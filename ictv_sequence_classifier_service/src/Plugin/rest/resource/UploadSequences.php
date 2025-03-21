<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Drupal\rest\ModifiedResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\Serialization;
use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\SequenceClassifier;
use Drupal\ictv_common\Utils;

/**
 * A sequence classifier web service for uploading sequence files.
 * @RestResource(
 *   id = "upload-sequences",
 *   label = @Translation("ICTV Sequence Classifier: Upload Sequences"),
 *   uri_paths = {
 *      "canonical" = "/upload-sequences",
 *      "create" = "/upload-sequences"
 *   }
 * )
 */
class UploadSequences extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   // The directory where input sequences are uploaded.
   protected ?string $inputDirectory;

   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";

   // The JobService object.
   protected JobService $jobService;
   
   // The name of the JSON result file.
   protected ?string $jsonResultsFilename;

   // The directory where output files are stored.
   protected ?string $outputDirectory;

   // The name of the sequence classifier script (run from within a Docker container).
   protected ?string $scriptName;

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
      $config = $configFactory->get('ictv_sequence_classifier_service.settings');

      // Get configuration settings from the ictv_sequence_classifier_service.settings file.
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
         
         // Get the input directory.
         $this->inputDirectory = $config->get("inputDirectory");
         if (Utils::isNullOrEmpty($this->inputDirectory)) { throw new \Exception("The inputDirectory setting is empty"); }

         // Get the jobs path.
         $this->jobsPath = $config->get("jobsPath");
         if (Utils::isNullOrEmpty($this->jobsPath)) { throw new \Exception("The jobsPath setting is empty"); }
         
         // Get the output directory.
         $this->outputDirectory = $config->get("outputDirectory");
         if (Utils::isNullOrEmpty($this->outputDirectory)) { throw new \Exception("The outputDirectory setting is empty"); }

         // Get the filename of the JSON results file.
         $this->jsonResultsFilename = $config->get("jsonResultsFilename");
         if (Utils::isNullOrEmpty($this->jsonResultsFilename)) { throw new \Exception("The jsonResultsFilename setting is empty"); }

         // The name of the sequence classifier script (from within a Docker container).
         $this->scriptName = $config->get("scriptName");
         if (Utils::isNullOrEmpty($this->scriptName)) { throw new \Exception("The scriptName setting is empty"); }
      }
      catch (\Exception $e) {
         \Drupal::logger('ictv_sequence_classifier_service')->error($e->getMessage());
         return;
      }

      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);

      // Create a new instance of JobService.
      $this->jobService = new JobService($this->jobsPath, $this->logger, "ictv_sequence_classifier", $this->inputDirectory, $this->outputDirectory);
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
         $container->get('logger.factory')->get('ictv_sequence_classifier_service'),
         $container->get("current_user")
      );
   }

   
   /**
    * Responds to GET request.
    * Passes the HTTP Request to the updateSequences method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      
      // Upload the sequences that were sent in the request.
      $data = $this->uploadSequences($request);

      $build = array(
         '#cache' => array(
            'max-age' => 0,
         ),
      );
       
      $response = new ResourceResponse($data);
      $response->addCacheableDependency($build);
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

      // NOTE: ChatGPT suggested that we disable caching by setting the max-age to permanent (no expiration).
      // return Cache::PERMANENT;
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
    * Passes the HTTP Request to the updateSequences method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      // Upload the sequences that were sent in the request.
      $data = $this->uploadSequences($request);

      $build = array(
         '#cache' => array(
            'max-age' => 0,
         ),
      );
       
      $response = new ResourceResponse($data);
      $response->addCacheableDependency($build);
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }


   /**
    * Uploads the sequences that were sent in the request.
    */
   public function uploadSequences(Request $request) {

      // Get and validate the JSON in the request body.
      $requestJSON = Json::decode($request->getContent());
      if ($requestJSON == null) { throw new BadRequestHttpException("Invalid JSON request parameter"); }

      $jobName = $requestJSON["jobName"];

      // Get and validate the user email.
      $userEmail = $requestJSON["userEmail"];
      if (Utils::isNullOrEmpty($userEmail)) { throw new BadRequestHttpException("Invalid user email"); }

      // Get and validate the user UID.
      $userUID = $requestJSON["userUID"];
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }
      
      // Get and validate the array of files.
      $files = $requestJSON["files"];
      if (!$files || !is_array($files) || sizeof($files) < 1) { throw new BadRequestHttpException("No files were uploaded"); }

      // Declare variables used below.
      $jobID = 0;
      $jobStatus;
      $jobUID = "";
      $message = null;
      $resultsJSON = null;

      try {
         //-------------------------------------------------------------------------------------------------------
         // Create a job record and get its ID and UID.
         //-------------------------------------------------------------------------------------------------------
         $this->jobService->createJob($this->connection, $jobID, $jobName, JobType::sequence_classification, $jobUID, $userEmail, $userUID);
         
         // TODO: This is for debugging and can be deleted later.
         //\Drupal::logger('ictv_sequence_classifier_service')->info("created job with ID ".$jobID." and UID ".$jobUID);
         
         // Create the job directory and subdirectories and return the full path of the job directory.
         $jobPath = $this->jobService->createDirectories($jobUID, $userUID);

         // Use the job path to generate the paths of the intput and output subdirectories.
         $inputPath = $this->jobService->getInputPath($jobPath);
         $outputPath = $this->jobService->getOutputPath($jobPath);

         //-------------------------------------------------------------------------------------------------------
         // Create job_file records and actual files for every sequence file provided.
         //-------------------------------------------------------------------------------------------------------
         $uploadOrder = 1;

         foreach ($files as $file) {
               
            //-------------------------------------------------------------------------------------------------------
            // Get and validate file attributes.
            //-------------------------------------------------------------------------------------------------------
            $filename = $file["name"];
            if (Utils::isNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

            $contents = $file["contents"];
            if (Utils::isNullOrEmpty($contents)) { throw new BadRequestHttpException("Invalid file contents"); }

            $fileStartIndex = stripos($contents, ",");
            if ($fileStartIndex < 0) { throw new BadRequestHttpException("Invalid data URL in sequence file"); }

            $base64Data = substr($contents, $fileStartIndex + 1);
            if (strlen($base64Data) < 1) { throw new BadRequestHttpException("The sequence file is empty"); }

            // Decode the file contents from base64.
            $binaryData = base64_decode($base64Data);

            // Create the sequence file in the job directory using the data provided.
            $fileID = $this->jobService->createInputFile($binaryData, $filename, $jobPath);

            // Create a job file
            $jobFileUID = $this->jobService->createJobFile($this->connection, $filename, $jobID, $uploadOrder);
      
            // TODO: This is for debugging and can be deleted later.
            //\Drupal::logger('ictv_sequence_classifier_service')->info("created job_file with UID ".$jobFileUID);

            $uploadOrder = $uploadOrder + 1;
         }

         // This *should* be the Drupal root directory's path.
         $rootPath = getcwd();

         // Get the relative path of this module.
         $moduleHandler = \Drupal::service('module_handler');
         $modulePath = $moduleHandler->getModule('ictv_sequence_classifier_service')->getPath();

         // The path within this module.
         $localPath = "src/Plugin/rest/resource";

         // Combine the paths to get the full path of the directory containing the PHP script.
         $fullPath = $rootPath."/".$modulePath."/".$localPath;
      
         // Run the sequence classifier script. A job status should be returned.
         $jobStatus = SequenceClassifier::runClassifier($inputPath, $this->jsonResultsFilename, $outputPath, $this->scriptName, $fullPath);
         
         if ($jobStatus == JobStatus::complete) {

            // Open and read the JSON file that should've been generated.
            $resultsJSON = TaxResult::getJSON($this->jsonResultsFilename, $outputPath);
            if (!$resultsJSON) { $jobStatus = JobStatus::invalid; }
         }

         // Update the job record's JSON and status.
         $this->jobService->updateJobJSON($this->connection, $jobID, $resultsJSON, $message, $jobStatus);

      } catch (Exception $e) {

         $jobStatus = JobStatus::crashed;

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

         // Update the job record's JSON and status.
         JobService::updateJobJSON($this->connection, $jobID, $resultsJSON, $message, $jobStatus);
      }

      // Decode the JSON so it can be correctly serialized.
      $decodedJSON = null;
      if ($resultsJSON != null) { $decodedJSON = json_decode($resultsJSON, true); }
      
      return array(
         "jobName" => $jobName,
         "jobUID" => $jobUID,
         "output" => $decodedJSON,
         "status" => $jobStatus->value
      );
   }

   
}

