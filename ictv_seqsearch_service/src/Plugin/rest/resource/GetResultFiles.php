<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\ResultFileType;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\SeqSearchJob;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

/**
 * A web service for retrieving result files from a SeqSearch job.
 * @RestResource(
 *   id = "get-seqsearch-result-files",
 *   label = @Translation("ICTV SeqSearch: Get result files"),
 *   uri_paths = {
 *      "canonical" = "/get-seqsearch-result-files",
 *      "create" = "/get-seqsearch-result-files"
 *   }
 * )
 */
class GetResultFiles extends ResourceBase {

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

   // The maximum number of sequences that can be submitted (across all FASTA files that are uploaded).
   public int $MAX_SEQUENCE_COUNT = 100;

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
      $config = $configFactory->get('ictv_seqsearch_service.settings');

      // Get configuration settings from the ictv_seqsearch_service.settings file.
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

         // The name of the sequence classifier script (from within a Docker container).
         $this->scriptName = $config->get("scriptName");
         if (Utils::isNullOrEmpty($this->scriptName)) { throw new \Exception("The scriptName setting is empty"); }
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
    * Passes the HTTP Request to the getFiles method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      
      // Get the requested files
      $data = $this->getFiles($request);

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


   /**
    * Get the requested result files.
    */
   public function getFiles(Request $request) {

      // Get and validate the JSON in the request body.
      $requestJSON = Json::decode($request->getContent());
      if ($requestJSON == null) { throw new BadRequestHttpException("Invalid JSON request parameter"); }

      // Get and validate the input filename.
      $inputFilename = $requestJSON["inputFilename"];
      if (Utils::isNullOrEmpty($inputFilename)) { throw new BadRequestHttpException("Invalid input filename"); }

      // Get and validate the result file types.
      $fileTypes = $requestJSON["fileTypes"];
      if (Utils::isNullOrEmpty($fileTypes)) { throw new BadRequestHttpException("Invalid file types"); }
      // TODO: Validate that the file types in the comma-delimited list are valid ResultFileType values.

      // Get and validate the job UID.
      $jobUID = $requestJSON["jobUID"];
      if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job UID"); }

      // Get and validate the sequence index.
      $sequenceIndex = $requestJSON["sequenceIndex"];
      if (Utils::isNullOrEmpty($sequenceIndex)) { throw new BadRequestHttpException("Invalid sequence index"); }

      // Get and validate the user email.
      $userEmail = $requestJSON["userEmail"];
      if (Utils::isNullOrEmpty($userEmail)) { throw new BadRequestHttpException("Invalid user email"); }

      // Get and validate the user UID.
      $userUID = $requestJSON["userUID"];
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }


      // Determine the job path.
      $jobPath = $this->jobService->getJobPath($jobUID, $userUID);

      // Use the job path to generate the path of the output subdirectory.
      $outputPath = $this->jobService->getOutputPath($jobPath);

      // Determine the base filename for the output files.
      $baseFilename = $outputPath.'/'.$inputFilename;

      $resultFiles = [];

      $fileTypesArray = explode(',', $fileTypes);

      // Iterate over all requested file types.
      foreach ($fileTypesArray as $fileType) {

         $fileType = trim($fileType);
         if (Utils::isNullOrEmpty($fileType)) { continue; }

         // Validate the file type.
         $resultFileType = ResultFileType::tryFrom($fileType);
         if ($resultFileType == null) {
            throw new BadRequestHttpException("Invalid file type: " . $fileType);
         }

         // Add a file extension determined by the file type.
         $resultFilename = $inputFilename.'.'.$resultFileType->value;

         $isCompressed = false;

         // If the file type is CSV or HTML, we will retrieve the gzipped version of the file.
         if ($resultFileType === ResultFileType::csv || $resultFileType === ResultFileType::html) {
            $resultFilename = $resultFilename.".gz";
            $isCompressed = true;
         }

         // Open a file and return its contents.
         $fileContents = Common::getFileContents(true, $resultFilename, $outputPath);

         $fileData = [
            "contents" => $fileContents,
            "filename" => $resultFilename,
            "isCompressed" => $isCompressed,
            "type" => $resultFileType->value
         ];

         // Add the file data to the result files.
         array_push($resultFiles, $fileData);
      }

      return [
         "filename" => $inputFilename,
         "files" => $resultFiles,
         "jobUID" => $jobUID,
         "sequenceIndex" => $sequenceIndex
      ];
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
    * Passes the HTTP Request to the getFiles method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      // Get the requested files
      $data = $this->getFiles($request);

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
