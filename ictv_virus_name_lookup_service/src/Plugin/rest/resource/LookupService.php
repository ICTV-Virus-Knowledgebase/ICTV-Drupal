<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource\IctvResult;
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

   // The maximum number of records to return from the database.
   //protected int $maxDbResultCount = 100;

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

      $build = array(
         '#cache' => array(
            'max-age' => 0,
         ),
      );
       
      return (new ResourceResponse($data))->addCacheableDependency($build);
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
    * Search the database to find taxon name matches.
    * 
    * @param int currentMslRelease
    *    The current MSL release number.
    *
    * @param int maxResultCount
    *    The maximum number of results to return.
    *
    * @param string searchText
    *    Search for this text.  
    */
   public function lookupName(int $currentMslRelease, int $maxResultCount, string $searchText) {

      // Populate the stored procedure's parameters.
      $parameters = [":currentMslRelease" => $currentMslRelease, ":maxResultCount" => $maxResultCount, ":searchText" => $searchText];

      // Generate SQL to call the "QuerySearchableTaxon" stored procedure to search for the virus name.
      $sql = "CALL QuerySearchableTaxon(:currentMslRelease, :maxResultCount, :searchText);";

      // Execute the query and process the results.
      $result = $this->connection->query($sql, $parameters);

      $ictvResults = [];

      $ictvResultKeys = [];

      // The number of non-viral results.
      $invalidMatches = 0;

      // Iterate over the result rows and add each row to the search results.
      foreach($result as $row) {
         
         // Create a search result instance from the row of data.
         $searchResult = SearchResult::fromArray((array) $row);

         // TODO: this is where we can calculate a custom score for the search result.

         if (!$searchResult->resultMslRelease) { $invalidMatches += 1; }
         
         // Create or update result metadata that represents the first occurrence of a result name in the search results.
         $ictvResult;
         $resultKey = $searchResult->resultName || "invalid";

         // Should we retrieve an existing ICTV result or create a new instance?
         if (array_key_exists($resultKey, $ictvResults)) {
            $ictvResult = $ictvResults[$resultKey];
         } else {
            $ictvResult = new IctvResult($searchResult->resultMslRelease, $searchResult->resultName, 
               $searchResult->resultRankName, $searchResult->resultTaxnodeID);

            // Add the key to the ordered list of keys.
            array_push($ictvResultKeys, $resultKey);
         }

         array_push($ictvResult->matches, $searchResult->normalize());

         // Replace the metadata in the collection.
         $ictvResults[$resultKey] = $ictvResult;
      }

      // TODO: this is where the search results can be sorted by the custom score.
      /*usort($searchResults, function(SearchResult $a, SearchResult $b) {
         if ($a->orderedPairCount == $b->orderedPairCount) {
            return 0;
         }
         return ($a->orderedPairCount < $b->orderedPairCount) ? 1 : -1;
      });*/

      // Create an array of normalized search results.
      $normalizedResults = [];

      foreach ($ictvResultKeys as $orderedKey) {
         $result = $ictvResults[$orderedKey];
         array_push($normalizedResults, $result->normalize());
      }

      return $normalizedResults;
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

      $build = array(
         '#cache' => array(
            'max-age' => 0,
         ),
      );
       
      return (new ResourceResponse($data))->addCacheableDependency($build);
   }

   public function processAction(Request $request) {

      // Get and validate the action code.
      $actionCode = $request->get("actionCode");
      if (Utils::isNullOrEmpty($actionCode)) { throw new BadRequestHttpException("Invalid action code"); }

      $data = null;

      switch ($actionCode) {

         case "lookup_name":

            $currentMslRelease = $request->get("currentMslRelease");
            $maxResultCount = $request->get("maxResultCount");
            $searchText = $request->get("searchText");
            if (Utils::isEmptyElseTrim($searchText)) { throw new BadRequestHttpException("Invalid search text (empty)"); }

            // TODO: validate parameters and provide defaults where appropriate

            // Look for the search text as a taxon name.
            $data = $this->lookupName($currentMslRelease, $maxResultCount, $searchText);
            break;

         default: throw new BadRequestHttpException("Unrecognized action code {$actionCode}");
      }

      return $data;
   }
}

