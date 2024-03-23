<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Config;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;


/**
 * A web service that tries to find the best virus name match(es) from user-provided text.
 * @RestResource(
 *   id = "ictv_virus_name_lookup_service_resource",
 *   label = @Translation("ICTV Virus Name Lookup Service"),
 *   uri_paths = {
 *      "canonical" = "/virus-name-lookup",
 *      "create" = "/virus-name-lookup"
 *   }
 * )
 */
class LookupService extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName = "ictv_apps";

   // The path of the Drupal installation.
   protected string $drupalRoot = "/var/www/dapp/web";



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
      array $serializer_formats,
      LoggerInterface $logger) {
      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);
      
      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);

      // Create a new instance of JobService.
      //$this->jobService = new JobService($this->jobsPath);
   }

   /**
    * {@inheritdoc}
    */
   public static function create(ContainerInterface $container, array $config, $module_id, $module_definition) {
      return new static(
         $config,
         $module_id,
         $module_definition,
         $container->getParameter('serializer.formats'),
         $container->get('logger.factory')->get('ictv_virus_name_lookup_service_resource')
      );
   }


   /**
    * Responds to GET request.
    * Passes the HTTP Request to the lookupName method and returns the result.
    * @throws \Symfony\Component\HttpKernel\Exception\HttpException
    * Throws exception expected.
    */
   public function get(Request $request) {
      $data = $this->processRequest($request);
      return new ResourceResponse($data);
   }

   /**
    * Search the database for this name.
    */
   public function lookupName(string $name) {

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
      $data = $this->processRequest($request);
      return new ResourceResponse($data);
   }


   public function processRequest(Request $request) {

      // Get and validate the JSON in the request body.
      $json = Json::decode($request->getContent());
      if ($json == null) { throw new BadRequestHttpException("Invalid JSON parameter"); }

      // Get and validate the action code.
      $searchText = $json["searchText"];
      if (Utils::isNullOrEmpty($searchText)) { throw new BadRequestHttpException("Invalid search text"); }

      $data = $this->lookupName($searchText);

      return $data;
   }

}