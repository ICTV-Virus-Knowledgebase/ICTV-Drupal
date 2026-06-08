<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\Common;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Drupal\rest\ModifiedResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\TaxaBlastJob;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

/**
 * A web service to update a job record using its files.
 * @RestResource(
 *   id = "update-job-from-files",
 *   label = @Translation("ICTV TaxaBLAST: Update a job record using its files"),
 *   uri_paths = {
 *      "canonical" = "/update-job-from-files",
 *      "create" = "/update-job-from-files"
 *   }
 * )
 */
class UpdateJobFromFiles extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";
   
   // The name of the JSON result file.
   protected ?string $jsonResultsFilename;

   // The directory where output files are stored.
   protected ?string $outputDirectory;


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
         
         // Get the Drupal root.
         $this->drupalRoot = $config->get("drupalRoot");
         if (Utils::isNullOrEmpty($this->drupalRoot)) { throw new \Exception("The drupalRoot setting is empty"); }

         // Get the jobs path.
         $this->jobsPath = $config->get("jobsPath");
         if (Utils::isNullOrEmpty($this->jobsPath)) { throw new \Exception("The jobsPath setting is empty"); }
         
         // Get the filename of the JSON results file.
         $this->jsonResultsFilename = $config->get("jsonResultsFilename");
         if (Utils::isNullOrEmpty($this->jsonResultsFilename)) { throw new \Exception("The jsonResultsFilename setting is empty"); }

         // Get the output directory.
         $this->outputDirectory = $config->get("outputDirectory");
         if (Utils::isNullOrEmpty($this->outputDirectory)) { throw new \Exception("The outputDirectory setting is empty"); }

         // Get a database connection.
         $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         return;
      }
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
    * Passes the HTTP Request to the lookupName method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
    public function get(Request $request) {
      
      // Try to update the job record using its files and get the updated job.
      $data = $this->updateJob($request);

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
   }


   // TODO
   public function updateJob(Request $request) {

      // Get and validate the JSON in the request body.
      $json = Json::decode($request->getContent());
      if ($json == null) { throw new BadRequestHttpException("Invalid JSON parameter"); }

      // Get and validate the job UID.
      $jobUID = $json["jobUID"];
      if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job identifier"); }

      // Get the TaxaBLAST job from the database.
      $job = TaxaBlastJob::getJob($this->connection, $jobUID);

      if ($job == null) { throw new BadRequestHttpException("No job found for the UID provided"); }  

      \Drupal::logger(Common::$MODULE_NAME)->info("Updating job with UID ".$jobUID." using files. Current job status: ".$job->status->value);

      // We're only interested in pending jobs, so if the job is not pending, just return it as-is.
      if ($job->status !== JobStatus::pending->value) {
         return $job;
      }

      // Create an alias for the file system service.
      $fileSystem = \Drupal::service("file_system");

      // The full path of the output subdirectory.
      $outputPath = $this->jobsPath.DIRECTORY_SEPARATOR.$jobUID.DIRECTORY_SEPARATOR.$this->outputDirectory;
      if (!$fileSystem->exists($outputPath)) {
         throw new BadRequestHttpException("The job's output path does not exist");
      }

      // Determine the full path of the JSON results file and check if it exists.
      $jsonFilename = $outputPath.DIRECTORY_SEPARATOR.$this->jsonResultsFilename;
      if (!$fileSystem->exists($jsonFilename)) {
         
         // The JSON results file might not have been created yet, so just return the job as-is.
         return $job;
      }

      // Read the JSON results file and decode it into an associative array.
      $json = file_get_contents($jsonFilename);
      $taxResults = Json::decode($json, true);
      if ($taxResults == null) { throw new BadRequestHttpException("The JSON results file is invalid"); }

      $message = null;
      $newJobStatus = null;

      if ($taxResults->errors !== null && $taxResults->errors->count() > 0) {
         $newJobStatus = JobStatus::error;

         // Consolidate the error messages into a single string separated by semicolons.
         $message = implode(";", $taxResults->errors);

      } else {
         $newJobStatus = JobStatus::completed;
      }
      
      // Update the job's JSON 
      TaxaBlastJob::updateJobJSON($this->connection, null, $jobUID, $json, $message, $newJobStatus);

      // Return the updated TaxaBLAST job from the database.
      return TaxaBlastJob::getJob($this->connection, $jobUID);
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
    * Passes the HTTP Request to the lookupName method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      // Try to update the job record using its files and get the updated job.
      $data = $this->updateJob($request);

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
   
}

