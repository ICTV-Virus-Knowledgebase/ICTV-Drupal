<?php

namespace Drupal\ictv_seqsearch_service\Controller;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
//use Drupal\rest\Plugin\ResourceBase;
//use Drupal\rest\ResourceResponse;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\SequenceSearch;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\SeqSearchJob;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

use Symfony\Component\HttpFoundation\File\UploadedFile;


class UploadFiles extends ControllerBase {

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

   // The name of the JSON result file.
   protected ?string $jsonResultsFilename;

   // The maximum number of sequences that can be submitted (across all FASTA files that are uploaded).
   //public int $MAX_SEQUENCE_COUNT = 100;

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

      \Drupal::logger(Common::$MODULE_NAME)->info("In post()");


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


   /** @return \Generator|UploadedFile[] */
   function iterUploadedFiles(mixed $value): \Generator {
      if ($value instanceof UploadedFile) {
         yield $value;
         return;
      }
      if (is_array($value)) {
         foreach ($value as $v) {
            if ($v === null) continue;
            yield from iterUploadedFiles($v);
         }
      }
   }

   /**
    * Upload the FASTA sequence(s) sent in the HTTP request.
    */
   public function uploadSequences(Request $request) {

      // TESTING
      //$fileCount = count($request->files);
      //\Drupal::logger(Common::$MODULE_NAME)->info("HTTP request files: ".$fileCount);

      //$files = $request->files->get("files");

      $bag = $request->files;

      // Iterate a specific field that might be single or multiple:
      if (($f = $bag->get('files')) !== null) {
         foreach (iterUploadedFiles($f) as $uploaded) {
            // $uploaded is an UploadedFile
            \Drupal::logger(Common::$MODULE_NAME)->info("found a file ".$uploaded->getClientOriginalName());
         }
      }

      return [
         "errorMessage" => "",
         "jobUID" => "No job UID",
         "status" => "complete"
      ];
   }

}

