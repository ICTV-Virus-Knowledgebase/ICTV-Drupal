<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Job;


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

    // The database connection.
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

        // Use the ICTV_APPS database instance.
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


    public function getJobs($userUID_) {

        $jobs = [];

        $query = $this->connection->query("SELECT * FROM {v_job}");
        $result = $query->fetchAll();
        if ($result) {

            foreach ($result as $job) {

                array_push($jobs, array(
                    "id" => $job->id,
                    "completedOn" => $job->completed_on,
                    "createdOn" => $job->created_on,
                    "failedOn" => $job->failed_on,
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


    // Is this string null or empty?
    function isNullOrEmpty($str){
        return ($str === null || trim($str) === '');
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


        //$jsonType = gettype($json);
        //\Drupal::logger('ictv_proposal_service')->notice($jsonType);

        // Get and validate the action code.
        $actionCode = $json["actionCode"];
        if ($this->isNullOrEmpty($actionCode)) { throw new BadRequestHttpException("Invalid action code"); }

        // Get and validate the user UID.
        $userUID = $json["userUID"];
        if ($this->isNullOrEmpty($userUID)) { throw new BadRequestHttpException("Invalid user UID"); }
        
        $data = null;

        switch ($actionCode) {
            case "get_jobs":
                $data = $this->getJobs($userUID);
                break;
            case "upload_proposal":
                $data = $this->uploadProposal($json, $userUID);
                break;
            default: throw new BadRequestHttpException("Unrecognized action code");
        }

        return $data;
    }


    public function uploadProposal(array $json, string $userUID) {


        $proposalFile = $json["proposal"];

        $userEmail = $json["userEmail"];

        \Drupal::logger('ictv_proposal_service')->notice($proposalFile);


        //$all_files = $request->$files;

        //throw new Error($all_files);

        // Make sure there's an uploaded file to process.
        //$proposalFile = $request->$files[0];
        


        $filename = "TODO"; //$proposalFile->filename();

        $result[] = array(
            "filename" => $filename,
            'status' => "It worked"
        );

        return $result;
    }


}