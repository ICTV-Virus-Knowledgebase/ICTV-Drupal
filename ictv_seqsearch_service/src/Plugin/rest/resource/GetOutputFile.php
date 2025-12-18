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
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

/**
 * A web service for retrieving an output file from a SeqSearch job.
 * @RestResource(
 *   id = "get-seqsearch-output-file",
 *   label = @Translation("ICTV SeqSearch: Get an output file"),
 *   uri_paths = {
 *      "canonical" = "/get-seqsearch-output-file",
 *      "create" = "/get-seqsearch-output-file"
 *   }
 * )
 */
class GetOutputFile extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName;

   // The directory where input sequences are uploaded.
   protected ?string $inputDirectory;

   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";
   
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
      $config = $configFactory->get('ictv_seqsearch_service.settings');

      // Get configuration settings from the ictv_seqsearch_service.settings file.
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
         
         // Get a database connection.
         $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
         
         // Get the input directory.
         $this->inputDirectory = $config->get("inputDirectory");
         if (Utils::isNullOrEmpty($this->inputDirectory)) { throw new \Exception("The inputDirectory setting is empty"); }

         // Get the jobs path.
         $this->jobsPath = $config->get("jobsPath");
         if (Utils::isNullOrEmpty($this->jobsPath)) { throw new \Exception("The jobsPath setting is empty"); }
         
         // Get the output directory.
         $this->outputDirectory = $config->get("outputDirectory");
         if (Utils::isNullOrEmpty($this->outputDirectory)) { throw new \Exception("The outputDirectory setting is empty"); }
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
    * Passes the HTTP Request to the getFiles method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      
      // Get the output file.
      $data = $this->getFile($request);

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
    * Get the requested output file.
    */
   public function getFile(Request $request) {

      // Get and validate the JSON in the request body.
      $requestJSON = Json::decode($request->getContent());
      if ($requestJSON == null) { throw new BadRequestHttpException("Invalid JSON request parameter"); }

      // Get and validate the filename.
      $filename = $requestJSON["filename"];
      if (Utils::isNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

      // Make sure the output directory isn't included in the filename.
      if (str_starts_with($filename, $this->outputDirectory.'/')) {
         $filename = substr($filename, mb_strlen($this->outputDirectory) + 1);
      }

      // Get and validate the job UID.
      $jobUID = $requestJSON["jobUID"];
      if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job UID"); }

      // Lookup the job's user UID.
      $userUID = Common::lookupJobUserUID($this->connection, $jobUID);
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }

      $isCompressed = False;
      if (str_ends_with($filename, ".csv") || str_ends_with($filename, ".html")) { 
         $isCompressed = True;
         $filename .= ".gz";
      }

      // Determine the job path.
      $jobPath = $this->jobsPath.DIRECTORY_SEPARATOR.$jobUID;
      
      // Use the job path to generate the path of the output subdirectory.
      $outputPath = $jobPath.DIRECTORY_SEPARATOR.$this->outputDirectory;

      $errorMessage = "";
      $fileContents = "";

      try {
         // Get the file contents.
         $fileContents = Common::getFileContents(true, $filename, $outputPath);
      } 
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger('ictv_seqsearch_service')->error($errorMessage);
      }

      return [
         "contents" => $fileContents,
         "error" => $errorMessage,
         "filename" => $filename,
         "isCompressed" => $isCompressed,
         "jobUID" => $jobUID
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

      // Get the output file.
      $data = $this->getFile($request);

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
