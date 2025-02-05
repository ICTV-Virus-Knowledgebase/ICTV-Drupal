<?php

namespace Drupal\ictv_curated_name_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\Core\Config\ConfigFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
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
 * A web service that updates an ICTV curated name.
 * @RestResource(
 *   id = "update_curated_name",
 *   label = @Translation("Update an ICTV curated name"),
 *   uri_paths = {
 *      "canonical" = "/update-curated-name"
 *   }
 * )
 */
class UpdateCuratedName extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The names of the databases used by this web service.
   protected string $appsDbName; // = "ictv_apps";
   protected string $taxonomyDbName; // = "ictv_taxonomy";


   /**
    * A current user instance which is logged in the session.
    *
    * @var \Drupal\Core\Session\AccountProxyInterface
    */
   protected $currentUser;

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
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);
      
      $this->currentUser = $currentUser;

      // Maintain the config factory in a member variable.
      $this->configFactory = $configFactory;

      // Access the module's configuration object.
      $config = $this->configFactory->get("ictv_curated_name_service.settings");

      // Get the apps database name.
      $this->appsDbName = $config->get("appsDbName");
      if (Utils::isNullOrEmpty($this->appsDbName)) { 
         \Drupal::logger('ictv_curated_name_service')->error("The appsDbName setting is empty");
         return;
      }
      
      // Get the taxonomy database name.
      $this->taxonomyDbName = $config->get("taxonomyDbName");
      if (Utils::isNullOrEmpty($this->taxonomyDbName)) { 
         \Drupal::logger('ictv_curated_name_service')->error("The taxonomyDbName setting is empty");
         return;
      }

      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->appsDbName);
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
         $container->get('logger.factory')->get('ictv_curated_name_service_resource'),
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
      
      // TODO: get query string parameters
      //$currentRelease = $request->get("currentRelease");
      //if (Utils::isNullOrEmpty($currentRelease)) { throw new BadRequestHttpException("Invalid MSL release (did you provide a year?)"); }

      // TODO: do something!
      $data = [ "test" => "Just a test"];

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

      // TODO: get query string parameters
      //$currentRelease = $request->get("currentRelease");
      //if (Utils::isNullOrEmpty($currentRelease)) { throw new BadRequestHttpException("Invalid MSL release (did you provide a year?)"); }

      // TODO: do something!
      $data = [ "test" => "Just a test"];

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

