<?php

namespace Drupal\ictv_curated_name_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\ictv_curated_name_service\Plugin\rest\resource\models\CuratedName;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database;
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
 * A web service that returns all curated names from the database.
 * @RestResource(
 *   id = "get_curated_names",
 *   label = @Translation("Get ICTV curated names"),
 *   uri_paths = {
 *      "canonical" = "/get-curated-names"
 *   }
 * )
 */
class GetCuratedNames extends ResourceBase {

   protected $configFactory;

   // The connection to the ictv_apps database.
   // TODO: Do we need a connection for each database?
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
      
      // Get all curated names.
      $data = $this->getCuratedNames();

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

   public function getCuratedNames() {

      $sql = 
         "SELECT
            comments,
            created_by,
            created_on,
            division,
            ictv_id,
            ictv_taxnode_id,
            id,
            is_valid,
            name,
            name_class,
            rank_name,
            taxonomy_db,
            taxonomy_id,
            type,
            version_id 
         
         FROM v_curated_name 
         ORDER BY name ASC";

      try {
         // Run the SQL query.
         $queryResults = $this->connection->query($sql);
      } 
      catch (Exception $e) {
         \Drupal::logger('ictv_curated_name_service')->error($e);
         return null;
      }

      $names = [];

      // Iterate over the result rows and add each row to the names array.
      foreach($queryResults as $row) {

         // Create a curated name instance from the row of data.
         $curatedName = CuratedName::fromArray((array) $row);

         // Normalize the curated name object and add it to the results.
         array_push($names, $curatedName->normalize());
      }

      return $names;
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

      // Get all curated names.
      $data = $this->getCuratedNames();

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

