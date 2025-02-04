<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
//use Drupal\ictv_proposal_service\Plugin\rest\resource\JobService;
//use Drupal\ictv_proposal_service\Plugin\rest\resource\JobStatus;
//use Drupal\ictv_proposal_service\Plugin\rest\resource\JobType;
use Drupal\Component\Serialization\Json;
use Psr\Log\LoggerInterface;
use Drupal\ictv_proposal_service\Plugin\rest\resource\ProposalValidator;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_common\Utils;
//use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;

/**
 * A web service supporting ICTV proposal validations and quality control.
 * @RestResource(
 *   id = "ictv_proposal_service_resource",
 *   label = @Translation("ICTV Proposal Service"),
 *   uri_paths = {
 *      "canonical" = "/proposal-api",
 *      "create" = "/proposal-api"
 *   }
 * )
 */
class ProposalService extends ResourceBase {

   protected $configFactory;

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot; // = "/var/www/dapp/web";

   protected JobService $jobService;

   // The full path of the jobs directory.
   protected string $jobsPath;

   protected string $validationSummaryPrefix = "ictv-proposal-file-results";

   // The name of the downloadable validation summary file.
   protected string $summaryFilename; // = "QC.pretty_summary.all.xlsx";


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
      ConfigFactoryInterface $configFactory,
      array $serializer_formats,
      LoggerInterface $logger) {

      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);

      // Maintain the config factory in a member variable.
      $this->configFactory = $configFactory;

      // Access the module's configuration object.
      $config = $this->configFactory->get("ictv_proposal_service.settings");

      //---------------------------------------------------------------------------------------------------------
      // Get data from the settings.yml file.
      //---------------------------------------------------------------------------------------------------------

      // Get the database name.
      $this->databaseName = $config->get("databaseName");
      if (Utils::isNullOrEmpty($this->databaseName)) { 
         \Drupal::logger('ictv_proposal_service')->error("The databaseName setting is empty");
         return;
      }
      
      // Get the path of the Drupal installation.
      $this->drupalRoot = $config->get("drupalRoot");
      if ($this->drupalRoot === null || trim($this->drupalRoot) === '') { throw new Exception("Invalid drupal root path in ProposalService"); }

      // Get the full path of the jobs directory.
      $this->jobsPath = $config->get("jobsPath");
      if (Utils::isNullOrEmpty($this->jobsPath)) { 
         \Drupal::logger('ictv_proposal_service')->error("The jobsPath setting is empty");
         return;
      }

      // Get the name of the downloadable validation summary file.
      $this->summaryFilename = $config->get("summaryFilename");
      if (Utils::isNullOrEmpty($this->summaryFilename)) { 
         \Drupal::logger('ictv_proposal_service')->error("The summaryFilename setting is empty");
         return;
      }
      
      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);

      // Create a new instance of JobService.
      $this->jobService = new JobService($this->jobsPath, $this->logger, "ictv_proposal_service", "proposalsTest", "results");
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
         $container->get('logger.factory')->get('ictv_proposal_service_resource')
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

         case "get_jobs":
            $data = $this->jobService->getJobs($this->connection, JobType::proposal_validation, $userEmail, $userUID);
            break;

         case "get_validation_summary":
               
            $jobUID = $json["jobUID"];
            if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job UID"); }
            
            $data = $this->jobService->getOutputFile($this->summaryFilename, $jobUID, $this->validationSummaryPrefix, $userUID);
            break;

         case "upload_proposals":
            $data = $this->uploadProposals($json, $userEmail, $userUID);
            break;

         default: throw new BadRequestHttpException("Unrecognized action code {$actionCode}");
      }

      return $data;   // Json::encode();
   }


   public function uploadProposals(array $json, string $userEmail, string $userUID) {

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
         $this->jobService->createJob($this->connection, $jobID, $jobName, JobType::proposal_validation, $jobUID, $userEmail, $userUID);
         
         \Drupal::logger('ictv_proposal_service')->info("created job with ID ".$jobID." and UID ".$jobUID);
         
         // Create the job directory and subdirectories and return the full path of the job directory.
         $jobPath = $this->jobService->createDirectories($jobUID, $userUID);

         // Use the job path to generate the path of the proposals and results subdirectories.
         $proposalsPath = $this->jobService->getInputPath($jobPath);
         $resultsPath = $this->jobService->getOutputPath($jobPath);

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
            $fileID = $this->jobService->createInputFile($binaryData, $filename, $jobPath);

            // Create a job file
            $jobFileUID = $this->jobService->createJobFile($this->connection, $filename, $jobID, $uploadOrder);
      
            \Drupal::logger('ictv_proposal_service')->info("created job_file with UID ".$jobFileUID);

            $uploadOrder = $uploadOrder + 1;
         }

         // This *should* be the Drupal root directory's path.
         $rootPath = getcwd();

         // Get the relative path of this module.
         $moduleHandler = \Drupal::service('module_handler');
         $modulePath = $moduleHandler->getModule('ictv_proposal_service')->getPath();

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
         \Drupal::logger('ictv_proposal_service')->error($userUID."_".$jobUID.": ".$errorMessage);

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