<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Job;
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
 * Provides a resource to [TODO!]
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



    public function createJob(string $filename, string $userEmail, int $userUID) {

        $jobUID = null;

        // Generate SQL to call the "createJob" stored procedure and return the job UID.
        $sql = "CALL createJob('{$filename}', '{$userEmail}', {$userUID});";

        $query = $this->connection->query($sql);
        $result = $query->fetchAll();
        if ($result && $result[0] !== null) {
            $jobUID = $result[0]->jobUID;
        }

        return $jobUID;
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


    public function getJobs(string $userEmail, int $userUID) {

        $jobs = [];

        // Generate the SQL
        $sql = "SELECT * 
                FROM v_job 
                WHERE user_uid = {$userUID}
                AND user_email = '{$userEmail}'
                ORDER BY created_on DESC";

        // Execute the query and process the results.
        $query = $this->connection->query($sql);
        $result = $query->fetchAll();
        if ($result) {

            foreach ($result as $job) {

                array_push($jobs, array(
                    "id" => $job->id,
                    "completedOn" => $job->completed_on,
                    "createdOn" => $job->created_on,
                    "failedOn" => $job->failed_on,
                    "filename" => $job->filename,
                    "message" => $job->message,
                    "status" => $job->status,
                    "type" => $job->type,
                    "uid" => $job->uid,
                    "userEmail" => $job->user_email,
                    "userUID" => $job->user_uid
                ));  
            }
        }

        return $jobs;
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
                $data = $this->getJobs($userEmail, $userUID);
                break;
            case "upload_proposal":
                $data = $this->uploadProposal($json, $userEmail, $userUID);
                break;
            default: throw new BadRequestHttpException("Unrecognized action code");
        }

        return $data;
    }


    public function uploadProposal(array $json, string $userEmail, int $userUID) {

        $filename = $json["filename"];
        if (Utils::IsNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

        $proposal = $json["proposal"];
        if (Utils::IsNullOrEmpty($proposal)) { throw new BadRequestHttpException("Invalid proposal"); }

        $fileStartIndex = stripos($proposal, ",");
        if ($fileStartIndex < 0) { throw HttpException("Invalid data URL in proposal file"); }

        $fileContents = substr($proposal, $fileStartIndex + 1);


        // TODO: decode file contents from base64
        // TODO: determine the job UID (create record in db, return resulting UID?)
        $jobUID = $this->createJob($filename, $userEmail, $userUID);

        // TODO: save file in temp directory using Curtis' directory structure


        

        //\Drupal::logger('ictv_proposal_service')->notice($proposalFile);


        $result[] = array(
            "filename" => $filename,
            "file" => $fileContents,
            "jobUID" => $jobUID
        );

        return $result;
    }


}