<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
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
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;



/**
 * A web service for downloading a binary output file from a TaxaBLAST job.
 * @RestResource(
 *   id = "download-taxablast-file",
 *   label = @Translation("ICTV TaxaBLAST: Download a binary output file"),
 *   uri_paths = {
 *      "canonical" = "/download-taxablast-file",
 *      "create" = "/download-taxablast-file"
 *   },
 *   formats = {"json", "bin"}
 * )
 */
class DownloadFile extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName;

   // The directory where input sequences are uploaded.
   protected ?string $inputDirectory;

   // The full path of the jobs directory.
   protected ?string $jobsPath; // Ex. "/var/www/drupal/files/jobs";

   // The JobService object.
   protected JobService $jobService;
   
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


   public function generateResponse(string $filename_, string $jobUID_): BinaryFileResponse {
      
      if (Utils::isNullOrEmpty($filename_)) { throw new BadRequestHttpException("Invalid filename"); }

      // Make sure the output directory isn't included in the filename.
      if (str_starts_with($filename_, $this->outputDirectory.'/')) {
         $filename = substr($filename_, strlen($this->outputDirectory) + 1);
      }

      if (Utils::isNullOrEmpty($jobUID_)) { throw new BadRequestHttpException("Invalid job UID"); }

      // Lookup the job's user UID.
      $userUID = Common::lookupJobUserUID($this->connection, $jobUID_);
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }

      // Determine the job path.
      $jobPath = $this->jobService->getJobPath($jobUID_, $userUID);

      // Use the job path to generate the path of the output subdirectory.
      $outputPath = $this->jobService->getOutputPath($jobPath);

      // The full path of the job directory, including the filename.
      $filePath = $outputPath.DIRECTORY_SEPARATOR.$filename_;

      // Make sure the file isn't empty and get its size.
      $fileSize = filesize($filePath);
      if (!$fileSize) { throw new BadRequestHttpException("The requested file is empty"); }

      // Bypass Drupal entirely
      header('Content-Type: application/octet-stream');
      header('Content-Disposition: attachment; filename="' . $filename_ . '"');
      header('Content-Length: ' . $fileSize);
      header('Content-Transfer-Encoding: binary');
      
      readfile($filePath);
      exit();

      /*
      // Create and return the response.
      $response = new BinaryFileResponse($filePath);

      $response->headers->remove('Content-Type');
      //$response->headers->set('Content-Type', 'application/zip');
      $response->headers->set('Content-Type', 'application/octet-stream');
      $response->headers->set('Content-Disposition', 'attachment; filename="'.$filename_.'"');
      $response->headers->set('Content-Length', $fileSize);
      $response->headers->set('Content-Transfer-Encoding', 'binary');
      $response->headers->set('Access-Control-Allow-Origin', '*');

      // Prevent any text processing
      $response->headers->set('Cache-Control', 'no-transform');

      return $response;*/
   }

   
   /**
    * Responds to GET request.
    * 
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      
      $filename = $request->get("filename");
      $jobUID = $request->get("jobUID");

      return $this->generateResponse($filename, $jobUID);
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
    * 
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function post(Request $request) {

      // Get and validate the JSON in the request body.
      $requestJSON = Json::decode($request->getContent());
      if ($requestJSON == null) { throw new BadRequestHttpException("Invalid JSON request parameter"); }

      // Get the filename and job UID.
      $filename = $requestJSON["filename"];
      $jobUID = $requestJSON["jobUID"];
      


      if (Utils::isNullOrEmpty($filename)) { throw new BadRequestHttpException("Invalid filename"); }

      // Make sure the output directory isn't included in the filename.
      if (str_starts_with($filename, $this->outputDirectory.'/')) {
         $filename = substr($filename, strlen($this->outputDirectory) + 1);
      }

      if (Utils::isNullOrEmpty($jobUID)) { throw new BadRequestHttpException("Invalid job UID"); }

      // Lookup the job's user UID.
      $userUID = Common::lookupJobUserUID($this->connection, $jobUID);
      if (!$userUID) { throw new BadRequestHttpException("Invalid user UID"); }

      // Determine the job path.
      $jobPath = $this->jobService->getJobPath($jobUID, $userUID);

      // Use the job path to generate the path of the output subdirectory.
      $outputPath = $this->jobService->getOutputPath($jobPath);

      // The full path of the job directory, including the filename.
      $filePath = $outputPath.DIRECTORY_SEPARATOR.$filename;

      // Make sure the file isn't empty and get its size.
      $fileSize = filesize($filePath);
      if (!$fileSize) { throw new BadRequestHttpException("The requested file is empty"); }

      // Nuclear option - bypass everything
      if (ob_get_level()) ob_end_clean();

      // Bypass Drupal entirely
      header('Content-Type: application/zip');
      header('Content-Disposition: attachment; filename="' . $filename . '"');
      header('Content-Length: ' . $fileSize);
      header('Content-Transfer-Encoding: binary');
      
      readfile($filePath);

      // Prevent Drupal from doing anything else
      \Drupal::service('kernel')->terminate();

      exit();



      //return $this->generateResponse($filename, $jobUID);

      /*
      $response = new StreamedResponse(function() use ($filePath) {
         $handle = fopen($filePath, 'rb');
         while (!feof($handle)) {
            echo fread($handle, 8192); // 8KB chunks
            flush();
         }
         fclose($handle);
      });
         
      $response->headers->set('Content-Type', 'application/zip');
      $response->headers->set('Content-Disposition', 'attachment; filename="'.$filename.'"');
      $response->headers->set('Content-Length', $fileSize);
      $response->headers->set('Access-Control-Allow-Origin', '*');
      return $response;*/
   }

}