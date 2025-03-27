<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\ClassificationJob;
use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\Common;
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
use Drupal\ictv_common\Utils;

/**
 * A web service to retrieve the result summary created by a sequence classifier job.
 * @RestResource(
 *   id = "get-classification-result",
 *   label = @Translation("ICTV Sequence Classifier: Get the results of a classified sequence job"),
 *   uri_paths = {
 *      "canonical" = "/get-classification-result",
 *      "create" = "/get-classification-result"
 *   }
 * )
 */
class GetClassificationResult extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName;

   // The path of the Drupal installation.
   protected string $drupalRoot;

   // The directory where input sequences are uploaded.
   protected ?string $inputDirectory;

   // The full path of the jobs directory.
   protected string $jobsPath; // Ex. "/var/www/drupal/files/jobs";

   // The JobService object.
   protected JobService $jobService;
   
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
         
         // Get the filename of the JSON results file.
         $this->jsonResultsFilename = $config->get("jsonResultsFilename");
         if (Utils::isNullOrEmpty($this->jsonResultsFilename)) { throw new \Exception("The jsonResultsFilename setting is empty"); }

         // Get the output directory.
         $this->outputDirectory = $config->get("outputDirectory");
         if (Utils::isNullOrEmpty($this->outputDirectory)) { throw new \Exception("The outputDirectory setting is empty"); }
      }
      catch (\Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return;
      }
      
      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);

      // Create a new instance of JobService.
      $this->jobService = new JobService($this->jobsPath, $this->logger, Common::$MODULE_NAME, $this->inputDirectory, $this->outputDirectory);
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
      
      // Get the request classification job.
      $data = $this->getJob($request);

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


   // Get the the results of a user's sequence classification.
   public function getJob(Request $request) {

      // Get and validate the JSON in the request body.
      $json = Json::decode($request->getContent());
      if ($json == null) { throw new BadRequestHttpException("Invalid JSON parameter"); }

      // Get and validate the job UID.
      $jobUID = $json["jobUID"];
      if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid result identifier"); }

      // Get and validate the user email.
      $userEmail = $json["userEmail"];
      if (Utils::isNullOrEmpty($userEmail)) { throw new BadRequestHttpException("Invalid user email"); }

      // Get and validate the user UID.
      $userUID = $json["userUID"];
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }

      // Get the job path and output path.
      $jobPath = $this->jobService->getJobPath($jobUID, $userUID);
      $filePath = $this->jobService->getOutputPath($jobPath);
   
      // Retrieve a job and return it as a Classification Job "object" (nested arrays).
      $job = ClassificationJob::getJob($this->connection, $jobUID, $userEmail, $userUID);
      if ($job == null) { return null; }

      // Add result files to the job.
      $job = ClassificationJob::addResultFiles($filePath, $job);

      /*
      // How many results are available?
      $resultCount = length($job["data"]["results"]);

      for ($r=0; $r<$resultCount; $r++) {

         $result = $job["data"]["results"][$r];

         $csvFilename = $result["blast_csv"];
         if (!Utils::isNullOrEmpty($csvFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $csvFilename, $filePath);
            
            if (!Utils::isNullOrEmpty($contents)) { $job["data"]["results"][$r]["csv_file"] = $contents; }
         }

         $htmlFilename = $result["blast_html"];
         if (!Utils::isNullOrEmpty($htmlFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $htmlFilename, $filePath);
            
            if (!Utils::isNullOrEmpty($contents)) { $job["data"]["results"][$r]["html_file"] = $contents; }
         }
      }*/

      /*foreach ($job["data"]["results"] as $result) {

         $csvFilename = $result["blast_csv"];
         if (!Utils::isNullOrEmpty($csvFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $csvFilename, $filePath);
            
            if (!Utils::isNullOrEmpty($contents)) { $result["csv_file"] = $contents; }
         }

         $htmlFilename = $result["blast_html"];
         if (!Utils::isNullOrEmpty($htmlFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $htmlFilename, $filePath);
            
            if (!Utils::isNullOrEmpty($contents)) { $result["html_file"] = $contents; }
         }

         $count = $count + 1;
      }*/

      /*
      {
         "program_name": "classify_sequence",
         "version": "v0.3.b4cd48a",
         "input_dir": "seq_in",
         "results": [
            {
                  "input_file": "test12.fa",
                  "input_seq": "test_seq_1",
                  "status": "CLASSIFIED",
                  "classification_rank": "species",
                  "classification_lineage": {
                     "realm": "HelloRealm",
                     "family": "BigFamily",
                     "genus": "WorldGenus",
                     "species": "WorldGenus specius"
                  },
                  "blast_html": "tax_results_1.html",
                  "blast_csv": "tax_results_1.csv"
            },
            {
                  "input_file": "test12.fa",
                  "input_seq": "test_seq_2",
                  "status": "CLASSIFIED",
                  "classification_rank": "genus",
                  "classification_lineage": {
                     "realm": "HelloRealm",
                     "family": "BigFamily",
                     "genus": "CountryGenus"
                  },
                  "message": "Homologous to species within the genus, but not close enough to classify within an existing species",
                  "blast_html": "tax_results_2.html",
                  "blast_csv": "tax_results_2.csv"
            }
         ]
      }
      */

      return $job;
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

      // Get metadata for a specific job.
      $data = $this->getJob($request);

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

