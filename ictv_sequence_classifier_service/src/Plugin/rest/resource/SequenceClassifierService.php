<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\JobStatus;
//use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\ProposalValidator;
use Drupal\ictv_common\Utils;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;



/**
 * A web service supporting ICTV sequence classification.
 * @RestResource(
 *   id = "ictv_sequence_classifier_service_resource",
 *   label = @Translation("ICTV Sequence Classifier Controller"),
 *   uri_paths = {
 *      "canonical" = "/sequence-classifier-api",
 *      "create" = "/sequence-classifier-api"
 *   }
 * )
 */
class SequenceClassifierService extends ResourceBase {

   protected $configFactory;

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName; // = "ictv_apps";

   // The path of the Drupal installation.
   protected string $drupalRoot; //  = "/var/www/dapp/web";

   protected JobService $jobService;

   // The full path of the jobs directory.
   protected string $jobsPath; //  = "/var/www/drupal/files/jobs";


   /**
    * Constructs a Drupal\rest\Plugin\ResourceBase object.
    *
    * @param Config|ImmutableConfig $config
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
      array $configuration,
      $module_id,
      $module_definition,
      ConfigFactoryInterface $configFactory,
      array $serializer_formats = [],
      LoggerInterface $logger = NULL) {

      parent::__construct($configuration, $module_id, $module_definition, $serializer_formats, $logger);

      $this->configFactory = $configFactory;
      
      // Access the module's configuration object.
      $config = $this->configFactory->get('ictv_sequence_classifier_service.settings');

      // Get the database name.
      $this->databaseName = $config->get("databaseName");
      if (Utils::isNullOrEmpty($this->databaseName)) { 
         \Drupal::logger('ictv_sequence_classifier_service')->error("The databaseName setting is empty");
         return;
      }
      
      // Get the jobs path.
      $this->jobsPath = $config->get("jobsPath");
      if (Utils::isNullOrEmpty($this->jobsPath)) { 
         \Drupal::logger('ictv_sequence_classifier_service')->error("The jobsPath setting is empty");
         return;
      }
      
      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);

      // Create a new instance of JobService.
      $this->jobService = new JobService($this->jobsPath, $this->logger, "ictv_sequence_classifier_service", "proposalsTest", "results");
   }

   /**
    * {@inheritdoc}
    */
   public static function create(ContainerInterface $container, array $configuration, $module_id, $module_definition) {
      return new static(
         $configuration,
         $module_id,
         $module_definition,
         $container->get('config.factory'),
         $container->getParameter('serializer.formats'),
         $container->get('logger.factory')->get('ictv_sequence_classifier_service_resource')
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
      if (Utils::isNullOrEmpty($actionCode)) { throw new BadRequestHttpException("Invalid action code"); }

      // Get and validate the user email.
      $userEmail = $json["userEmail"];
      if (Utils::isNullOrEmpty($userEmail)) { throw new BadRequestHttpException("Invalid user email"); }

      // Get and validate the user UID.
      $userUID = $json["userUID"];
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }
      
      $data = null;

      switch ($actionCode) {

         /*case "get_jobs":
               $data = $this->jobService->getJobs($this->connection, $userEmail, $userUID);
               break;

         case "get_validation_summary":
               
               $jobUID = $json["jobUID"];
               if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job UID"); }
               
               $data = $this->jobService->getValidationSummary($this->summaryFilename, $jobUID, $userUID);
               break;*/

         case "test":
            $data = $this->test($json, $userEmail, $userUID);
            break;

         /*case "upload_sequences":
            $data = $this->uploadSequences($json, $userEmail, $userUID);
            break;*/

         default: throw new BadRequestHttpException("Unrecognized action code {$actionCode}");
      }

      return $data;
   }

   
   public function test(array $json, string $userEmail, string $userUID) {

      \Drupal::logger('ictv_sequence_classifier_service')->info("Inside the test endpoint");

      return array(
         "userEmail" => $userEmail,
         "userUID" => $userUID,
         "message" => "You're in the test endpoint"
      );
   }


   public function uploadSequences(array $json, string $userEmail, string $userUID) {

      $jobName = $json["jobName"];

      $files = $json["files"];
      if (!$files || !is_array($files) || sizeof($files) < 1) { throw new BadRequestHttpException("Invalid files"); }

      $command = "";
      $commandResult = -1;
      $jobID = 0;
      $jobUID = "";
      $resultCode = -1;
      $status = null;

      try {
         //-------------------------------------------------------------------------------------------------------
         // Create a job record and get its ID and UID.
         //-------------------------------------------------------------------------------------------------------
         $this->jobService->createJob($this->connection, $jobID, $jobName, $jobUID, $userEmail, $userUID);
         
         \Drupal::logger('ictv_sequence_classifier_service')->info("created job with ID ".$jobID." and UID ".$jobUID);
         
         // Create the job directory and subdirectories and return the full path of the job directory.
         $jobPath = $this->jobService->createDirectories($jobUID, $userUID);

         // Use the job path to generate the path of the proposals and results subdirectories.
         $proposalsPath = $this->jobService->getProposalsPath($jobPath);
         $resultsPath = $this->jobService->getResultsPath($jobPath);

         //-------------------------------------------------------------------------------------------------------
         // Create job_file records and actual files for every proposal file provided.
         //-------------------------------------------------------------------------------------------------------
         $uploadOrder = 1;

         foreach ($files as $file) {
               
            // TODO: validate file?
            $filename = $file["name"];
            if (Utils::isNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

            $proposal = $file["contents"];
            if (Utils::isNullOrEmpty($proposal)) { throw new BadRequestHttpException("Invalid proposal"); }

            $fileStartIndex = stripos($proposal, ",");
            if ($fileStartIndex < 0) { throw new BadRequestHttpException("Invalid data URL in proposal file"); }

            $base64Data = substr($proposal, $fileStartIndex + 1);
            if (strlen($base64Data) < 1) { throw new BadRequestHttpException("The proposal file is empty"); }

            // Decode the file contents from base64.
            $binaryData = base64_decode($base64Data);

            // Create the proposal file in the job directory using the data provided.
            $fileID = $this->jobService->createProposalFile($binaryData, $filename, $jobPath);

            // Create a job file
            $jobFileUID = $this->jobService->createJobFile($this->connection, $filename, $jobID, $uploadOrder);
      
            \Drupal::logger('ictv_sequence_classifier_service')->info("created job_file with UID ".$jobFileUID);

            $uploadOrder = $uploadOrder + 1;
         }

         // This *should* be the Drupal root directory's path.
         $rootPath = getcwd();

         // Get the relative path of this module.
         $moduleHandler = \Drupal::service('module_handler');
         $modulePath = $moduleHandler->getModule('ictv_sequence_classifier_service')->getPath();

         // The path within this module.
         $localPath = "src/Plugin/rest/resource";

         $fullPath = $rootPath."/".$modulePath."/".$localPath;
      
         //-------------------------------------------------------------------------------------------------------
         // Create the command that will be run on the command line.
         //-------------------------------------------------------------------------------------------------------
         $command = "nohup php -f {$fullPath}/RunProposalValidation.php ".

            // The name of the MySQL database (probably "ictv_apps").
            "dbName={$this->databaseName} ".
      
            // The path of the Drupal installation (Ex. "/var/www/drupal/site").
            "drupalRoot={$this->drupalRoot} ".
            
            // The job's unique alphanumeric identifier (UUID).
            "jobUID={$jobUID} ".
            
            // The job's filesystem path.
            "jobPath={$jobPath} ".
      
            // The location of the proposal file(s).
            "proposalsPath=\"{$proposalsPath}\" ".
            
            // The location where result files will be created.
            "resultsPath=\"{$resultsPath}\" ".
      
            // The user's unique numeric identifier.
            "userUID={$userUID} ".
            
            // Redirect stdout and stderr to the file "output.txt".
            "> {$resultsPath}/output.txt 2>&1 ".

            // Run in the background.
            "&";

         $output = null;
         $resultCode = -1;

         // Run the command on the command line.
         $commandResult = exec($command, $output, $resultCode);

      } catch (Exception $e) {

         $status = JobStatus::crashed;

         $errorMessage = null;
         if ($e) { 
               $errorMessage = $e->getMessage(); 
         } else {
               $errorMessage = "Unspecified error";
         }
         
         // Update the log with the job UID and this error message.
         \Drupal::logger('ictv_sequence_classifier_service')->error($userUID."_".$jobUID.": ".$errorMessage);

         // Provide a default message, if necessary.
         if ($message == NULL || len($message) < 1) { $message = "1 error"; }

         //-------------------------------------------------------------------------------------------------------
         // Update the job record in the database.
         //-------------------------------------------------------------------------------------------------------
         JobService::updateJob($this->connection, $errorMessage, $jobUID, $message, $status, $userUID); 
      }

      return array(
         "command" => $command,
         "commandResult" => $commandResult,
         "jobName" => $jobName,
         "jobUID" => $jobUID,
         "resultCode" => $resultCode
      );
   }
}