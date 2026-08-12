<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\Common;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\FastaFile;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\TaxaBLAST;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\TaxaBlastJob;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

use Symfony\Component\HttpFoundation\File\UploadedFile;


/**
 * A web service for uploading sequence files and searching.
 * @RestResource(
 *   id = "upload-sequences",
 *   label = @Translation("ICTV TaxaBLAST: Upload Sequences"),
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

   // The docker container that contains the TaxaBLAST Python code.
   protected string $dockerContainer;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   // The directory where input sequences are uploaded.
   protected ?string $inputDirectory;

   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";
   
   // The name of the JSON result file.
   protected ?string $jsonResultsFilename;

   // The maximum number of FASTA records/sequences that can be submitted (across all FASTA files that are uploaded).
   protected int $maxUploadedRecords;

   // The maximum total size of all uploaded files (in bytes).
   protected int $maxTotalUploadSize;

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
      $config = $configFactory->get('ictv_taxablast_service.settings');

      // Get configuration settings from the ictv_taxablast_service.settings file.
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
         
         // Get the docker container.
         $this->dockerContainer = $config->get("dockerContainer");
         if (Utils::isNullOrEmpty($this->dockerContainer)) { throw new \Exception("The dockerContainer setting is empty"); }

         // Get the Drupal root.
         $this->drupalRoot = $config->get("drupalRoot");
         if (Utils::isNullOrEmpty($this->drupalRoot)) { throw new \Exception("The drupalRoot setting is empty"); }

         // Get the input directory.
         $this->inputDirectory = $config->get("inputDirectory");
         if (Utils::isNullOrEmpty($this->inputDirectory)) { throw new \Exception("The inputDirectory setting is empty"); }

         // Get the jobs path.
         $this->jobsPath = $config->get("jobsPath");
         if (Utils::isNullOrEmpty($this->jobsPath)) { throw new \Exception("The jobsPath setting is empty"); }
         
         // Get the filename of the JSON results file.
         $this->jsonResultsFilename = $config->get("jsonResultsFilename");
         if (Utils::isNullOrEmpty($this->jsonResultsFilename)) { throw new \Exception("The jsonResultsFilename setting is empty"); }

         // Get the maximum number of sequences that can be submitted (across all FASTA files that are uploaded).
         $this->maxUploadedRecords = $config->get("maxUploadedRecords");
         if ($this->maxUploadedRecords < 1) { throw new \Exception("The maxUploadedRecords setting is invalid"); }
         
         // Get the maximum total size (in bytes) of all uploaded files.
         $this->maxTotalUploadSize = $config->get("maxTotalUploadSize");
         if ($this->maxTotalUploadSize < 1) { throw new \Exception("The maxTotalUploadSize setting is invalid"); }

         // Get the output directory.
         $this->outputDirectory = $config->get("outputDirectory");
         if (Utils::isNullOrEmpty($this->outputDirectory)) { throw new \Exception("The outputDirectory setting is empty"); }

         // The name of the sequence classifier script (from within a Docker container).
         $this->scriptName = $config->get("scriptName");
         if (Utils::isNullOrEmpty($this->scriptName)) { throw new \Exception("The scriptName setting is empty"); }
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
    * Passes the HTTP Request to the updateSequences method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      
      try {
         // Upload the sequences that were sent in the request.
         $data = $this->uploadSequences($request);
         
      } catch (\Throwable $e) {

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);

         $data = [
            "errorMessage" => $errorMessage,
            "jobUID" => null,
            "status" => JobStatus::crashed->value
         ];
      }

      $response = new ResourceResponse($data);
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

      try {
         // Upload the sequences that were sent in the request.
         $data = $this->uploadSequences($request);
         
      } catch (\Throwable $e) {

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);

         $data = [
            "errorMessage" => $errorMessage,
            "jobUID" => null,
            "status" => JobStatus::crashed->value
         ];
      }

      $response = new ResourceResponse($data);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }


   /**
    * Process the uploaded files and return an array of FastaFile objects.
    */
   private function processUploadedJSONFiles(array $files) {

      // A file's index in the total number of uploaded files.
      $fileIndex = 0;

      // An array of FastaFile objects.
      $inputFiles = [];

      // The total size (in bytes) of all uploaded files.
      $totalFileSize = 0;

      // The total number of FASTA records/sequences uploaded.
      $totalRecordCount = 0;

      
      // Iterate over all uploaded files, validate them, and maintain their contents in an array.
      foreach ($files as $file) {

         $fileIndex = $fileIndex + 1;

         // Get and validate the filename.
         $filename = $file["name"];
         if (Utils::isNullOrEmpty($filename)) { throw new \Exception("Invalid filename for file #{$fileIndex}"); }

         // Get and validate the FASTA file contents.
         $contents = $file["contents"];
         if (Utils::isNullOrEmpty($contents)) { throw new \Exception("File #{$fileIndex} is empty"); }

         // Update the total size of all uploaded files.
         $totalFileSize += mb_strlen($contents);
         if ($totalFileSize > $this->maxTotalUploadSize) {
            // TODO: add commas when displaying maxTotalUploadSize.
            throw new \Exception("The total size of all uploaded files exceeds the maximum allowed (".$this->maxTotalUploadSize." bytes)");
         }

         // The number of invalid records in the current file.
         $invalidCount = 0;

         // The number of records in the current file.
         $recordCount = 0;

         // Validate the FASTA file's contents.
         $isValid = Common::validateFASTA($contents, $filename, $invalidCount, $recordCount);
         if (!$isValid) { throw new \Exception("File ".$filename." is not a valid FASTA file"); }

         // Update the total record count.
         $totalRecordCount += $recordCount;

         // If the total record/sequence count exceeds the maximum allowed, raise an exception.
         if ($totalRecordCount > $this->maxUploadedRecords) {
            throw new \Exception("Too many sequences have been submitted. Maximum allowed is ".$this->maxUploadedRecords);
         }

         // Add the input file to the array.
         array_push($inputFiles, new FastaFile($contents, $filename, $isValid, $recordCount));
      }

      return $inputFiles;
   }


   /**
    * Upload the FASTA sequence(s) sent in the HTTP request.
    */
   public function uploadSequences(Request $request) {

      $errorMessage = null;
      $jobID = null;
      $jobUID = null;
      $outputPath = null;

      try {
         // Get and validate the JSON in the request body.
         $requestJSON = Json::decode($request->getContent());
         if ($requestJSON == null) { throw new BadRequestHttpException("Error in UploadSequences: Invalid JSON request parameter"); }

         // Get the job name (optional).
         $jobName = Common::safeTrim($requestJSON["jobName"]);

         // Get and validate the user email.
         $userEmail = Common::safeTrim($requestJSON["userEmail"]);
         if (mb_strlen($userEmail) < 1) { throw new BadRequestHttpException("Error in UploadSequences: Invalid user email"); }

         // Get and validate the user UID.
         $userUID = Common::safeTrim($requestJSON["userUID"]);
         if (mb_strlen($userUID) < 1) {throw new BadRequestHttpException("Error in UploadSequences: Invalid user UID"); }
         

         //----------------------------------------------------------------
         // Get BLAST parameters and provide defaults if necessary.
         //----------------------------------------------------------------

         // Maximum number of HSPs to return.
         $maxHSPS = null;
         if (isset($requestJSON["maxHSPS"])) {
            $maxHSPS = $requestJSON["maxHSPS"];
         }

         if (!is_int($maxHSPS)) { $maxHSPS = Common::$DEFAULT_BLAST_MAX_HSPS; }

         // Maximum number of target sequences to return.
         $maxTargetSeqs = null;
         if (isset($requestJSON["maxTargetSeqs"])) {
            $maxTargetSeqs = $requestJSON["maxTargetSeqs"];
         }
         
         if (!is_int($maxTargetSeqs)) { $maxTargetSeqs = Common::$DEFAULT_BLAST_MAX_TARGET_SEQS; }

         // The BLAST task to use.
         $task = Common::$DEFAULT_BLAST_TASK;
         if (isset($requestJSON["task"])) {
            $testValue = Common::safeTrim($requestJSON["task"]);
            if (mb_strlen($task) > 0 && in_array($task, Common::$VALID_BLAST_TASKS)) { $task = $testValue; }
         }
         
         // Get and validate the array of files.
         $files = $requestJSON["files"];
         if (!$files || !is_array($files) || sizeof($files) < 1) { throw new BadRequestHttpException("Error in UploadSequences: No files were uploaded"); }


         // Process the uploaded files and return an array of FastaFile objects.
         $inputFiles = $this->processUploadedJSONFiles($files);
         if (count($inputFiles) < 1) { throw new \Exception("Error in UploadSequences: No valid FASTA records were found in the uploaded files"); }

         // Create a new job record and get its ID and UID.
         TaxaBlastJob::createJob($this->connection, $jobID, $jobName, $jobUID, $userEmail, $userUID);
         if (!$jobID || $jobID < 1 || !$jobUID || mb_strlen($jobUID) < 1) { throw new \Exception("Error in UploadSequences: Unable to create job record"); }

         // Create the a new job folder and its subdirectories and return the full path of the job directory.
         $jobPath = TaxaBlastJob::createJobFolder($this->inputDirectory, $this->jobsPath, $jobUID, $this->outputDirectory);
         if (Utils::isNullOrEmpty($jobPath)) { throw new \Exception("Error in UploadSequences: Unable to create job folder"); }

         // Initialize the job status.
         $jobStatus = JobStatus::pending;

         // Use the job path to generate the paths of the input and output subdirectories.
         $inputPath = $jobPath.DIRECTORY_SEPARATOR.$this->inputDirectory;
         $outputPath = $jobPath.DIRECTORY_SEPARATOR.$this->outputDirectory;

         // These capture stdout and stderr for RunTaxaBLAST.php.
         $errorFile = $outputPath.DIRECTORY_SEPARATOR."run_taxablast_stderr.txt";
         $outputFile = $outputPath.DIRECTORY_SEPARATOR."run_taxablast_stdout.txt";

         // Initialize the upload order.
         $uploadOrder = 1;

         //------------------------------------------------------------------------------------------------------------
         // Create a FASTA file on the filesystem for each FastaFile object and create a job file record for every file.
         //------------------------------------------------------------------------------------------------------------
         foreach ($inputFiles as $inputFile) {

            // Create a FASTA file in the job's input directory.
            FastaFile::createInputFile($inputFile, $inputPath, true);

            // Create a job file record.
            TaxaBlastJob::createJobFileRecord($this->connection, $inputFile->encodedFilename, $jobID, $uploadOrder);

            $uploadOrder = $uploadOrder + 1;
         }

         // This *should* be the Drupal root directory's path.
         $rootPath = getcwd();

         // Get the relative path of this module.
         $moduleHandler = \Drupal::service('module_handler');
         $modulePath = $moduleHandler->getModule(Common::$MODULE_NAME)->getPath();

         // The path within this module.
         $localPath = "src/Plugin/rest/resource";

         // Combine the paths to get the full path of the directory containing the PHP script.
         $fullPath = $rootPath.DIRECTORY_SEPARATOR.$modulePath.DIRECTORY_SEPARATOR.$localPath;
      
         //-------------------------------------------------------------------------------------------------------
         // Create the command that will be run on the command line.
         //-------------------------------------------------------------------------------------------------------
         $command = "nohup php -f {$fullPath}/RunTaxaBLAST.php ".

            // The name of the MySQL database (probably "ictv_apps").
            "dbName={$this->databaseName} ".
         
            // The docker container that contains the TaxaBLAST Python code.
            "dockerContainer={$this->dockerContainer} ".

            // The path of the Drupal installation (Ex. "/var/www/drupal/site").
            "drupalRoot={$this->drupalRoot} ".

            // The job's input path
            "inputPath={$inputPath} ".

            // The job's unique alphanumeric identifier (UUID).
            "jobUID={$jobUID} ".

            // The name of the JSON file generated by TaxaBLAST.
            "jsonFilename={$this->jsonResultsFilename} ".

            // The maximum number of HSPs to return.
            "maxHSPS={$maxHSPS} ".

            // The maximum number of target sequences to return.
            "maxTargetSeqs={$maxTargetSeqs} ".

            // The job's output path
            "outputPath={$outputPath} ".

            // The name of the Docker container that runs the TaxaBLAST Python code.
            "scriptName={$this->scriptName} ".
            
            // The BLAST task to use.
            "task={$task} ".
            
            // The user's unique numeric identifier.
            "userUID={$userUID} ".

            // Redirect stderr and stdout to text files in $outputPath
            "> ".$outputFile." 2> ".$errorFile." ".
            
            // Run in the background.
            "&";

         // Run the command on the command line.
         $commandResult = exec($command);

      } catch (\Throwable $e) {

         $jobStatus = JobStatus::crashed;
         $jsonForSQL = null;

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Update the log with the error message.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);

         if (isset($jobID) && $jobID > 0) {

            // Update the job record's JSON and status.
            TaxaBlastJob::updateJobJSON($this->connection, $jobID, $jobUID, $jsonForSQL, $errorMessage, $jobStatus);
         }
      }

      // Return the job UID and status and an error message (if an error occurred).
      return [
         "errorMessage" => $errorMessage,
         "jobUID" => $jobUID,
         "status" => $jobStatus->value
      ];
   }

}

