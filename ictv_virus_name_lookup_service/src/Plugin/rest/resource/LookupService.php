<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Drupal\rest\ModifiedResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource\SearchResult;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

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
      array $serializer_formats,
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);
      
      $this->currentUser = $currentUser;

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
         $container->getParameter('serializer.formats'),
         $container->get('logger.factory')->get('ictv_virus_name_lookup_service_resource'),
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
      $data = $this->processAction($request);
      return new ResourceResponse($data);
   }

   /**
    * Search the database to find taxon name matches.
    * 
    * @param int maxCountDiff
    *    The maximum number of total symbol count differences.
    *
    * @param int maxLengthDiff
    *    The maximum difference between the search text and test text.
    *
    * @param int maxResultCount
    *    The maximum number of results to return.
    *
    * @param string searchText
    *    Search for this text.  
    */
   public function lookupName(int $maxCountDiff, int $maxLengthDiff, int $maxResultCount, string $searchText) {

      $searchResults = [];

      // Populate the stored procedure's parameters.
      $parameters = [":maxCountDiff" => $maxCountDiff, ":maxLengthDiff" => $maxLengthDiff, ":maxResultCount" => $maxResultCount, ":searchText" => $searchText];

      // Generate SQL to search taxon names for the search text.
      $sql = "CALL searchTaxonHistogram(:maxCountDiff, :maxLengthDiff, :maxResultCount, :searchText);";

      // Execute the query and process the results.
      $result = $this->connection->query($sql, $parameters);

      // Iterate over the result rows and add each row to the search results.
      foreach($result as $row) {
         $searchResult = SearchResult::fromArray((array) $row);
         array_push($searchResults, $searchResult->normalize());
      }

      return $searchResults;
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
      $data = $this->processAction($request);
      return new ResourceResponse($data);
   }

   public function processAction(Request $request) {

      // Get and validate the JSON in the request body.
      //$json = Json::decode($request->getContent());
      //if (!$json) { throw new BadRequestHttpException("Invalid JSON parameter"); }

      // Get and validate the action code.
      $actionCode = $request->get("actionCode"); //$json["actionCode"];
      if (Utils::isNullOrEmpty($actionCode)) { throw new BadRequestHttpException("Invalid action code"); }

      $data = null;

      switch ($actionCode) {

         case "lookup_name":

            $maxCountDiff = $request->get("maxCountDiff"); //$json["maxCountDiff"];
            $maxLengthDiff = $request->get("maxLengthDiff"); //$json["maxLengthDiff"];
            $maxResultCount = $request->get("maxResultCount"); //$json["maxResultCount"];
            $searchText = $request->get("searchText"); //$json["searchText"];
            if (Utils::isNullOrEmpty($searchText)) { throw new BadRequestHttpException("Invalid search text"); }

            // TODO: validate parameters and provide defaults where appropriate

            $data = $this->lookupName($maxCountDiff, $maxLengthDiff, $maxResultCount, $searchText);
            break;

         default: throw new BadRequestHttpException("Unrecognized action code {$actionCode}");
      }

      return $data;
   }
}