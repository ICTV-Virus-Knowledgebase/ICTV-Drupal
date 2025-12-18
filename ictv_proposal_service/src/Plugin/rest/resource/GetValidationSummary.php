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
 * A web service to get the validation summary file for a proposal job.
 * @RestResource(
 *   id = "get-proposal-validation-summary",
 *   label = @Translation("ICTV Proposal Service: Get Proposal Validation Summary"),
 *   uri_paths = {
 *      "canonical" = "/get-proposal-validation-summary",
 *      "create" = "/get-proposal-validation-summary"
 *   }
 * )
 */
class GetValidationSummary extends ResourceBase {

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

   protected string $validationSummaryPrefix = "ictv-proposal-file-results";



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
    * Retrieves and returns the specified output file.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {

      $errorMessage = "";
      $isSuccess = false;
      $summary = null;

      try {
         // Get and validate the job UID.
         $jobUID = Common::safeTrim($request->get("jobUID"));
         if (mb_strlen($jobUID) < 1) { throw new BadRequestHttpException("Error in GetValidationSummary: Invalid job UID"); }

         // Get the job folder's output subdirectory.
         $outputPath = Common::getOutputPath($this->jobsPath, $jobUID, $this->outputDirName);

         \Drupal::logger(Common::$MODULE_NAME)->info("GetValidationSummary: outputPath = ".$outputPath.", summaryFilename = ".$this->summaryFilename);

         // Get the summary file for the specified job.
         $summary = Common::getOutputFile($this->summaryFilename, $jobUID, $this->validationSummaryPrefix, $outputPath);
         
         $isSuccess = true;

      } catch (\Throwable $e) {

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
      }

      $response = new ResourceResponse([
         "data" => $summary,
         "message" => $errorMessage,
         "success" => $isSuccess
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
    * {@inheritdoc} 
    * This function has to exist in order for the admin to assign user permissions 
    * to the web service.
    */ 
   public function permissions() {
      return []; 
   } 

   /**
    * Responds to POST request.
    * Retrieves and returns the specified output file.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      $errorMessage = "";
      $isSuccess = false;
      $summary = null;

      try {
         // Get and validate the JSON in the request body.
         $requestJSON = Json::decode($request->getContent());
         if ($requestJSON == null) { throw new BadRequestHttpException("Error in GetValidationSummary: Invalid JSON request parameter"); }

         // Get and validate the job UID.
         $jobUID = Common::safeTrim($requestJSON["jobUID"]);
         if (mb_strlen($jobUID) < 1) { throw new BadRequestHttpException("Error in GetValidationSummary: Invalid job UID"); }

         // Get the job folder's output subdirectory.
         $outputPath = Common::getOutputPath($this->jobsPath, $jobUID, $this->outputDirName);

         \Drupal::logger(Common::$MODULE_NAME)->info("GetValidationSummary: outputPath = ".$outputPath.", summaryFilename = ".$this->summaryFilename);

         // Get the summary file for the specified job.
         $summary = Common::getOutputFile($this->summaryFilename, $jobUID, $this->validationSummaryPrefix, $outputPath);
         
         $isSuccess = true;

      } catch (\Throwable $e) {

         // Get the error message.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         
         // Add an error to the system log.
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
      }

      $response = new ResourceResponse([
         "data" => $summary,
         "message" => $errorMessage,
         "success" => $isSuccess
      ]);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;
   }

}

