<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Job;
use Drupal\ictv_proposal_service\Plugin\rest\resource\JobService;
use Drupal\ictv_proposal_service\Plugin\rest\resource\ProposalValidator;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;


/**
 * A web service supporting ICTV proposal validations and quality control.
 * @RestResource(
 *   id = "ictv_proposal_service_resource",
 *   label = @Translation("ICTV Proposal Service"),
 *   uri_paths = {
 *     "canonical" = "/proposal-api",
 *      "create" = "/proposal-api"
 *   }
 * )
 */
class ProposalService extends ResourceBase {

    // The connection to the ictv_apps database.
    protected Connection $connection;

    protected JobService $jobService;

    // The full path of the jobs directory.
    protected string $jobsPath;


    /**
     * Constructs a Drupal\rest\Plugin\ResourceBase object.
     *
     * @param array $config
     *   A configuration array which contains the information about the plugin instance.
     * @param string $module_id
     *   The module_id for the plugin instance.
     * @param mixed $module_definition
     *   The plugin implementation definition.
     * @param array $serializer_formats
     *   The available serialization formats.
     * @param \Psr\Log\LoggerInterface $logger
     *   A logger instance.
     * @param \Drupal\Core\Session\AccountProxyInterface $current_user
     *   A currently logged user instance.
     */
    public function __construct(
        array $config,
        $module_id,
        $module_definition,
        array $serializer_formats,
        LoggerInterface $logger) {
        parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);

        // Use the ictv_apps database instance.
        $this->connection = \Drupal\Core\Database\Database::getConnection('default', 'ictv_apps');

        // Get configuration settings from ictv_proposal_service.settings.yml.
        //$config = \Drupal::config('ictv_proposal_service.settings');

        // Get the jobs path setting.
        $this->jobsPath = "/var/www/dapp/files/jobs"; //$config->get("jobsPath");

        // Create a new instance of JobService.
        $this->jobService = new JobService($this->connection, $this->jobsPath);
    }

    /**
     * {@inheritdoc}
     */
    public static function create(ContainerInterface $container, array $config, $module_id, $module_definition) {
        return new static(
            $config,
            $module_id,
            $module_definition,
            $container->getParameter('serializer.formats'),
            $container->get('logger.factory')->get('ictv_proposal_resource')
        );
    }


    /**
     * Responds to GET request.
     * Returns data corresponding to the action code provided.
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     * Throws exception expected.
     */
    public function get(Request $request) {

        $data = $this->processAction($request);

        return new ResourceResponse($data);
    }

    /** 
     * {@inheritdoc} 
     * This function has to exist in order for the admin to assign user permissions 
     * to the web service.
     */ 
    public function permissions() {
        return []; 
    } 

    /**
     * Responds to POST request.
     * Returns data corresponding to the action code provided.
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     * Throws exception expected.
     */
    public function post(Request $request) {

        $data = $this->processAction($request);

        return new ResourceResponse($data);
    }


    public function processAction(Request $request) {

        // Get and validate the JSON in the request body.
        $json = Json::decode($request->getContent());
        if ($json == null) { throw new BadRequestHttpException("Invalid JSON parameter"); }

        // Get and validate the action code.
        $actionCode = $json["actionCode"];
        if (Utils::IsNullOrEmpty($actionCode)) { throw new BadRequestHttpException("Invalid action code"); }

        // Get and validate the user email.
        $userEmail = $json["userEmail"];
        if (Utils::IsNullOrEmpty($userEmail)) { throw new BadRequestHttpException("Invalid user email"); }

        // Get and validate the user UID.
        $userUID = $json["userUID"];
        if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }
        
        $data = null;

        switch ($actionCode) {
            case "get_jobs":
                $data = $this->jobService->getJobs($userEmail, $userUID);
                break;
            case "upload_proposal":
                $data = $this->uploadProposal($json, $userEmail, $userUID);
                break;
            default: throw new BadRequestHttpException("Unrecognized action code");
        }

        return $data;
    }


    public function uploadProposal(array $json, string $userEmail, string $userUID) {

        // Declare variables used in the try/catch block.
        $errorMessage = null;
        $fileID = null;
        $jobUID = null;
        $updatedStatus = null;
        $validatorResult = null;

        $filename = $json["filename"];
        if (Utils::IsNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

        $proposal = $json["proposal"];
        if (Utils::IsNullOrEmpty($proposal)) { throw new BadRequestHttpException("Invalid proposal"); }

        $fileStartIndex = stripos($proposal, ",");
        if ($fileStartIndex < 0) { throw new BadRequestHttpException("Invalid data URL in proposal file"); }

        $base64Data = substr($proposal, $fileStartIndex + 1);

        // Decode the file contents from base64.
        $binaryData = base64_decode($base64Data);

        try {
            //-------------------------------------------------------------------------------------------------------
            // Create a job record and return its unique ID.
            //-------------------------------------------------------------------------------------------------------
            $jobUID = $this->jobService->createJob($filename, $userEmail, $userUID);

            // Create the job directory and subdirectories and return the full path of the job directory.
            $jobPath = $this->jobService->createDirectories($jobUID, $userUID);

            // Create the proposal file in the job directory using the data provided.
            $fileID = $this->jobService->createProposalFile($binaryData, $filename, $jobPath);
            
            // Use the job path to generate the path of the proposals and results subdirectories.
            $proposalsPath = $this->jobService->getProposalsPath($jobPath);
            $resultsPath = $this->jobService->getResultsPath($jobPath);

            //-------------------------------------------------------------------------------------------------------
            // Validate the proposal
            //-------------------------------------------------------------------------------------------------------
            $validatorResult = ProposalValidator::validateProposals($proposalsPath, $resultsPath, $jobPath);

            if ($validatorResult["isValid"] == TRUE) {
                $updatedStatus = "completed";
                $errorMessage = "";
            } else {
                $updatedStatus = "failed";
                $errorMessage = $validatorResult["error"];
            }

            //-------------------------------------------------------------------------------------------------------
            // Update the job record in the database.
            //-------------------------------------------------------------------------------------------------------
            $this->jobService->updateJob($jobUID, $errorMessage, $updatedStatus, $userUID);    

            // Process the job subdirectories and results files after the validator process has been run.
            //$this->jobService->processValidatorResults($jobPath);
        }
        catch (Exception $e) {
            \Drupal::logger('ictv_proposal_service')->error($e->getMessage());
        }

        $result[] = array(
            "fileID" => $fileID,
            "filename" => $filename,
            "validatorResult" => $validatorResult,
            "jobUID" => $jobUID 
        );

        return $result;
    }


}