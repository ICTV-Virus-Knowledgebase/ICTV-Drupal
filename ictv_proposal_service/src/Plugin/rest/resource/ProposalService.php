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

    // The docker command will be run in the working directory.
    protected string $workingDirectory = "/var/www/dapp/apps/";


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

        // Create a new instance of JobService.
        $this->jobService = new JobService($this->connection);
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

        $response = new ResourceResponse($data);
        //$response->addCacheableDependency($data);
        return $response;
    }

    
    /**
     * Responds to POST request.
     * Returns data corresponding to the action code provided.
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     * Throws exception expected.
     */
    public function post(Request $request) {

        $data = $this->processAction($request);

        $response = new ResourceResponse($data);
        //$response->addCacheableDependency($data);
        return $response;
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

        $filename = $json["filename"];
        if (Utils::IsNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

        $proposal = $json["proposal"];
        if (Utils::IsNullOrEmpty($proposal)) { throw new BadRequestHttpException("Invalid proposal"); }

        $fileStartIndex = stripos($proposal, ",");
        if ($fileStartIndex < 0) { throw HttpException("Invalid data URL in proposal file"); }

        $base64Data = substr($proposal, $fileStartIndex + 1);

        // Decode the file contents from base64.
        $binaryData = base64_decode($base64Data);


        //-------------------------------------------------------------------------------------------------------
        // Create a job record and return its unique ID.
        //-------------------------------------------------------------------------------------------------------
        $jobUID = $this->jobService->createJob($filename, $userEmail, $userUID);

        // Create the job directory that will contain the proposal file(s).
        $path = $this->jobService->createDirectory($jobUID, $userUID);

        // Save the proposal file in the job directory.
        $fileID = $this->jobService->createFile($binaryData, $filename, $path);
        

        //-------------------------------------------------------------------------------------------------------
        // Validate the proposal
        //-------------------------------------------------------------------------------------------------------
        $validatorResult = ProposalValidator::validateProposals($path, "the_output", $this->workingDirectory);

        //\Drupal::logger('ictv_jwt_generator')->info($validatorResult);
        /*array(
            "error",
            "isValid",
            "result"
        );*/

        // TODO: call the stored proc "updateJob" based on isValid



        

        $result[] = array(
            "fileID" => $fileID,
            "filename" => $filename,
            "validatorResult" => $validatorResult,
            "jobUID" => $jobUID 
        );

        return $result;
    }


}