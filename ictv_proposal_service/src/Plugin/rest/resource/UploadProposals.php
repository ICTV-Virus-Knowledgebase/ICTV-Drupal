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
 * A web service for uploading MSL proposal files.
 * @RestResource(
 *   id = "upload-proposals",
 *   label = @Translation("ICTV Proposal Service: Upload Proposals"),
 *   uri_paths = {
 *      "canonical" = "/upload-proposals",
 *      "create" = "/upload-proposals"
 *   }
 * )
 */
class UploadProposals extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   protected int $errorCount = 0;
   protected string $errorMessages = "";

   // The subdirectory under the job folder where uploaded files are stored.
   protected string $inputDirName;
   
   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";
   
   // The subdirectory under the job folder where result files are stored.
   protected string $outputDirName;

   // The name of the downloadable validation summary file.
   protected string $summaryFilename; // Ex. "QC.pretty_summary.all.xlsx";


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
         
         // Get the Drupal root.
         $this->drupalRoot = $config->get("drupalRoot");
         if (Utils::isNullOrEmpty($this->drupalRoot)) { throw new \Exception("The drupalRoot setting is empty"); }

         // Get the input directory name.
         $this->inputDirName = $config->get("inputDirName");
         if (Utils::isNullOrEmpty($this->inputDirName)) { throw new \Exception("The inputDirName setting is empty"); }

         // Get the jobs path.
         $this->jobsPath = $config->get("jobsPath");
         if (Utils::isNullOrEmpty($this->jobsPath)) { throw new \Exception("The jobsPath setting is empty"); }
         
         // Get the output directory name.
         $this->outputDirName = $config->get("outputDirName");
         if (Utils::isNullOrEmpty($this->outputDirName)) { throw new \Exception("The outputDirName setting is empty"); }

         // The name of the downloadable validation summary file.
         $this->summaryFilename = $config->get("summaryFilename");
         if (Utils::isNullOrEmpty($this->summaryFilename)) { throw new \Exception("The summaryFilename setting is empty"); }
      }
      catch (\Throwable $e) {
         $this->addErrorMessage(method_exists($e, "getMessage") ? $e->getMessage() : get_class($e));
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


   public function addErrorMessage(string $message) {

      if (mb_strlen($this->errorMessages) > 0) { $this->errorMessages .= "; "; }

      $this->errorMessages .= $message;
      $this->errorCount += 1;
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
    * Passes the HTTP Request to the uploadProposals method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      if ($this->errorCount > 0) {
         throw new BadRequestHttpException("Error in UploadProposals: ".$this->errorMessages);
      }

      $isSuccess = false;
      $result = null;

      try {
         // Get and validate the JSON in the request body.
         $requestJSON = Json::decode($request->getContent());
         if ($requestJSON == null) { throw new BadRequestHttpException("Error in uploadProposals: Invalid JSON request parameter"); }

         // The uploaded file(s)
         $files = $requestJSON["files"];
         if (!$files || !is_array($files) || sizeof($files) < 1) { throw new BadRequestHttpException("Error in uploadProposals: Invalid files"); }

         // Get the job name (optional).
         $jobName = Common::safeTrim($requestJSON["jobName"]);

         // Get and validate the user email.
         $userEmail = Common::safeTrim($requestJSON["userEmail"]);
         if (mb_strlen($userEmail) < 1) { throw new BadRequestHttpException("Error in uploadProposals: Invalid user email"); }

         // Get and validate the user UID.
         $userUID = Common::safeTrim($requestJSON["userUID"]);
         if (mb_strlen($userUID) < 1) {throw new BadRequestHttpException("Error in uploadProposals: Invalid user UID"); }

         // Upload the proposals from the request.
         $result = $this->uploadProposals($files, $jobName, $userEmail, $userUID);
         
         $isSuccess = true;

      } catch (\Throwable $e) {

         $this->addErrorMessage(method_exists($e, "getMessage") ? $e->getMessage() : get_class($e));
         
         // Add error messages to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($this->errorMessages);

         $result = array(
            "command" => null,
            "commandResult" => null,
            "jobName" => $jobName,
            "jobUID" => $jobUID,
            "message" => $this->errorMessages,
            "status" => JobStatus::crashed->value,
            "success" => false
         );
      }

      $response = new ResourceResponse($result);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }

   /**
    * Create a proposal file from the provided data.
    */
   public function createProposalFile($file, string $inputPath, int $jobID, int $uploadOrder) {

      // TODO: validate file?

      $filename = $file["name"];
      if (Utils::isNullOrEmpty($filename)) { throw new \Exception("Invalid filename"); }

      $proposal = $file["contents"];
      if (Utils::isNullOrEmpty($proposal)) { throw new \Exception("Invalid file contents"); }

      $fileStartIndex = stripos($proposal, ",");
      if ($fileStartIndex < 0) { throw new \Exception("Invalid data URL in proposal file"); }

      $base64Data = substr($proposal, $fileStartIndex + 1);
      if (mb_strlen($base64Data) < 1) { throw new \Exception("The proposal file is empty"); }

      // Decode the file contents from base64.
      $binaryData = base64_decode($base64Data);

      // Create the proposal file in the input subdirectory.
      Common::createInputFile($binaryData, $filename, $inputPath);
   }


   /**
    * Upload the proposal files sent in the HTTP request.
    */
   public function uploadProposals(array $files, string $jobName, string $userEmail, string $userUID) {

      $command = "";
      $commandResult = -1;
      $isSuccess = true;
      $jobID = 0;
      $jobUID = "";
      $resultCode = -1;
      $status = null;

      try {
         //-------------------------------------------------------------------------------------------------------
         // Create a job record and get its ID and UID.
         //-------------------------------------------------------------------------------------------------------
         $results = Common::createJob($this->connection, $jobName, $userEmail, $userUID);
         $jobID = $results["jobID"];
         $jobUID = $results["jobUID"];
         // TODO: make sure jobID and jobUID are valid!

         \Drupal::logger(Common::$MODULE_NAME)->info("Created a proposal job for ".$userEmail." with UID ".$jobUID);
         
         // Create the job directory and subdirectories and return the full path of the job directory.
         $jobPath = Common::createJobFolder($this->inputDirName, $this->jobsPath, $jobUID, $this->outputDirName);

         // Use the job path to generate the paths of the input and output subdirectories.
         $proposalsPath = $jobPath.DIRECTORY_SEPARATOR.$this->inputDirName;
         $resultsPath = $jobPath.DIRECTORY_SEPARATOR.$this->outputDirName;

         //-------------------------------------------------------------------------------------------------------
         // Save the proposal files in the proposals subdirectory and create a job_file record for each file.
         //-------------------------------------------------------------------------------------------------------
         $uploadOrder = 1;

         foreach ($files as $file) {
               
            try {
               // Save the file under the job's input subdirectory.
               $this->createProposalFile($file, $proposalsPath, $jobID, $uploadOrder);

               // Create a job file record.
               Common::createJobFile($this->connection, $file["name"], $jobID, $uploadOrder);

            } catch (\Throwable $e) {
               $filename = $file["name"] ?? "unknown";   
               $fileError = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
               $this->addErrorMessage("Error processing file ".$filename.": ".$fileError);
            }

            $uploadOrder = $uploadOrder + 1;
         }

         // TODO: Keep track of invalid files compared to the total number of files.

         // This *should* be the Drupal root directory's path.
         $rootPath = getcwd();

         // Get the relative path of this module.
         $moduleHandler = \Drupal::service('module_handler');
         $modulePath = $moduleHandler->getModule(Common::$MODULE_NAME)->getPath();

         // The path within this module.
         $localPath = "src/Plugin/rest/resource";

         $fullPath = $rootPath.DIRECTORY_SEPARATOR.$modulePath.DIRECTORY_SEPARATOR.$localPath;
      
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
         $status = JobStatus::pending;

         // Run the command on the command line.
         $commandResult = exec($command, $output, $resultCode);

      } catch (\Throwable $e) {

         $status = JobStatus::crashed;
         $isSuccess = false;

         $error = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         $this->addErrorMessage($error);

         // Update the job record in the database.
         Common::updateJob($this->connection, $this->errorMessages, $jobUID, $status, $userUID); 
      }

      // Log any error messages.
      if ($this->errorCount > 0) { \Drupal::logger(Common::$MODULE_NAME)->error($this->errorMessages); }

      return array(
         "command" => $command,
         "commandResult" => $commandResult,
         "jobName" => $jobName,
         "jobUID" => $jobUID,
         "message" => $this->errorMessages,
         "resultCode" => $resultCode,
         "status" => $status->value,
         "success" => $isSuccess
      );
   }

}

