<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Common;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

use Symfony\Component\HttpFoundation\File\UploadedFile;


/**
 * A web service that retrieves a user's uploaded proposal files.
 * @RestResource(
 *   id = "get-proposal-jobs",
 *   label = @Translation("ICTV Proposal Service: Get Jobs"),
 *   uri_paths = {
 *      "canonical" = "/get-proposal-jobs",
 *      "create" = "/get-proposal-jobs"
 *   }
 * )
 */
class GetJobs extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   // The subdirectory under the job folder where uploaded files are stored.
   protected string $inputDirName;
   
   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";
   
   // The subdirectory under the job folder where result files are stored.
   protected string $outputDirName;

   // The name of the downloadable validation summary file.
   protected string $summaryFilename; // Ex. "QC.pretty_summary.all.xlsx";

   //protected string $validationSummaryPrefix = "ictv-proposal-file-results";



   /**
    * A current user instance which is logged in the session.
    *
    * @var \Drupal\Core\Session\AccountProxyInterface
    */
   protected $currentUser;

   /**
    * Constructs a Drupal\rest\Plugin\ResourceBase object.
    *
    * @param Config|ImmutableConfig $config
    *   A configuration array which contains the information about the plugin instance.
    * @param string $module_id
    *   The module_id for the plugin instance.
    * @param mixed $module_definition
    *   The plugin implementation definition.
    * @param ConfigFactoryInterface $configFactory
    *   The factory for configuration objects.
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
      ConfigFactoryInterface $configFactory,
      array $serializer_formats,
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      // Call the parent constructor.
      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);

      // TODO: Should we validate the user?
      $this->currentUser = $currentUser;

      // Access the module's configuration object.
      $config = $configFactory->get('ictv_proposal_service.settings');

      // Get configuration settings from the ictv_proposal_service.settings file.
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         return;
      }

      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
   }


   /**
    * {@inheritdoc}
    */
   public static function create(ContainerInterface $container, array $config, $module_id, $module_definition) {
      return new static(
         $config,
         $module_id,
         $module_definition,
         $container->get('config.factory'),
         $container->getParameter('serializer.formats'),
         $container->get('logger.factory')->get(Common::$MODULE_NAME),
         $container->get("current_user")
      );
   }

   /**
    * Responds to GET request.
    * Get the user's email and UID from the HTTP Request and return their jobs as JSON.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {

      $errorMessage = "";
      $isSuccess = false;
      $jobs = null;

      try {
         // Get and validate the user email.
         $userEmail = Common::safeTrim($request->get("userEmail"));
         if (mb_strlen($userEmail) < 1) { throw new BadRequestHttpException("Error in GetJobs: Invalid user email"); }

         // Get and validate the user UID.
         $userUID = Common::safeTrim($request->get("userUID"));
         if (strlen($userUID) < 1) {throw new BadRequestHttpException("Error in GetJobs: Invalid user UID"); }

         // Get the user's jobs.
         $jobs = $this->getJobs($userEmail, $userUID);
         
         $isSuccess = true;

      } catch (\Throwable $e) {

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
      }

      $response = new ResourceResponse([
         "errorMessage" => $errorMessage,
         "isSuccess" => $isSuccess,
         "jobs" => $jobs
      ]);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }

   /**
    * {@inheritdoc}
    * 
    * Prevent this block from being cached.
    */
   public function getCacheMaxAge() {
      return 2;
   }

   /** 
    * Get all jobs uploaded by the specified user.
    */ 
   public function getJobs(string $userEmail, string $userUID) {

      // Populate the stored procedure's parameters.
      $parameters = [":jobType" => JobType::proposal_validation->value, ":userEmail" => $userEmail, ":userUID" => $userUID];

      // Generate SQL to call the "getJobs" stored procedure.
      $sql = "CALL getJobs(:jobType, :userEmail, :userUID);";

      // Execute the query and process the results.
      $result = $this->connection->query($sql, $parameters);
      $jobsJSON = $result->fetchField(0);

      return $jobsJSON;
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
    * Get the user's email and UID from the HTTP Request and return their jobs as JSON.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      $data = null;
      $message = null;
      $success = false;
      
      try {
         // Get and validate the JSON in the request body.
         $requestJSON = Json::decode($request->getContent());
         if ($requestJSON == null) { throw new BadRequestHttpException("Error in GetJobs: Invalid JSON request parameter"); }

         // Get and validate the user email.
         $userEmail = Common::safeTrim($requestJSON["userEmail"]);
         if (mb_strlen($userEmail) < 1) { throw new BadRequestHttpException("Error in GetJobs: Invalid user email"); }

         // Get and validate the user UID.
         $userUID = Common::safeTrim($requestJSON["userUID"]);
         if (mb_strlen($userUID) < 1) {throw new BadRequestHttpException("Error in GetJobs: Invalid user UID"); }

         // Get the user's jobs.
         $data = $this->getJobs($userEmail, $userUID);
         if ($data == "null") { $data = null; }

         $success = true;

      } catch (\Throwable $e) {

         // Get the error message.
         $message = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($message);
      }

      $response = new ResourceResponse([
         "data" => $data,
         "message" => $message,
         "success" => $success
      ]);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }
}

