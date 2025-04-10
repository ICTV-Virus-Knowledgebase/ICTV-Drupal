<?php

// PHP api call:
// https://logan1.ictv.global/api/search-taxonomy?searchText=pox&currentRelease=39&includeAllReleases=1

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=search_taxonomy&search_text=pox&current_release=39&include_all_releases=True

namespace Drupal\ictv_web_api\Plugin\rest\resource;

// use Drupal\Core\Config;
// use Drupal\Core\Database;
// use Drupal\Component\Serialization\Json;
// use Symfony\Component\HttpFoundation\JsonResponse;
// use Drupal\Serialization;

use Drupal\Core\Session\AccountProxyInterface; // Used in the constructor and create() method
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException; // Used when throwing exceptions for invalid parameters
use Drupal\Core\Database\Connection; // Used for the $connection property
use Symfony\Component\DependencyInjection\ContainerInterface; // Used in the static create() method
use Psr\Log\LoggerInterface; // Used in the constructor
use Symfony\Component\HttpFoundation\Request; // Used in the get() method parameter
use Drupal\rest\Plugin\ResourceBase; // Class SearchTaxonomy extends ResourceBase
use Drupal\rest\ResourceResponse; // Used to build the response
use Drupal\ictv_common\Utils; // Used for parameter validation (Utils::isNullOrEmpty)

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonSearchResult;


/**
 * Provides a REST Resource to search ICTV taxonomy.
 *
 * @RestResource(
 *   id = "search_taxonomy",
 *   label = @Translation("Search ICTV taxonomy"),
 *   uri_paths = {
 *     "canonical" = "/api/search-taxonomy"
 *   }
 * )
 */

class SearchTaxonomy extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName = "ictv_taxonomy";



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
    */

    public function __construct(
      array $config,
      $module_id,
      $module_definition,
      array $serializer_formats,
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);
      
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
         $container->get('logger.factory')->get('ictv_web_api_resource'),
         $container->get("current_user")
      );
   }


   public function get(Request $request) {

      // The current MSL release
      $currentRelease = $request->get("currentRelease");
      if (Utils::isNullOrEmpty($currentRelease)) { throw new BadRequestHttpException("Invalid MSL release (did you provide a year?)"); }

      // Include all MSL releases?
      $includeAllReleases = $request->get("includeAllReleases");
      if (Utils::isNullOrEmpty($includeAllReleases)) { $includeAllReleases = 0; }

      // The selected MSL release (optional)
      $selectedRelease = $request->get("selectedRelease");
      if (Utils::isNullOrEmpty($selectedRelease)) { $selectedRelease = $currentRelease; }

      // Search text
      $searchText = $request->get("searchText");
      if (Utils::isNullOrEmpty($searchText)) { throw new BadRequestHttpException("Please provide non-empty search text"); }

      // Search the taxonomy
      $data = $this->search($currentRelease, $includeAllReleases, $searchText, $selectedRelease);
      //['message' => "currentRelease = ".$currentRelease.", includeAllReleases = ".$includeAllReleases.", searchText = ".$searchText];

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


   public function search(int $currentRelease, bool $includeAllReleases, string $searchText, int $selectedRelease) {

      // Populate the stored procedure's parameters.
      $parameters = [":currentRelease" => $currentRelease, ":includeAllReleases" => $includeAllReleases, ":searchText" => $searchText, ":selectedRelease" => $selectedRelease];

      // Generate SQL to call the "SearchTaxonomy" stored procedure to search the ICTV taxonomy.
      $sql = "CALL searchTaxonomy(:currentRelease, :includeAllReleases, :searchText, :selectedRelease);";

      try {
         
         // Run the stored procedure.
         // fetchAll directly gets db rows as an array, so there is no need to convert in the loop.
         $queryResults = $this->connection->query($sql, $parameters)->fetchAll(\PDO::FETCH_ASSOC);
         // $queryResults = $this->connection->query($sql, $parameters);
         // \Drupal::logger('ictv_web_api')->notice(print_r($queryResults, true));
      } 
      
      catch (Exception $e) {
         \Drupal::logger('ictv_web_api')->error($e);
         return null;
      }

      
      $searchResults = [];

      // Iterate over the result rows and add each row to the search results.
      foreach($queryResults as $row) {
         
         // Create a taxon search result instance from the row of data.
         // $searchResult = TaxonSearchResult::fromArray((array) $row);
         $searchResult = TaxonSearchResult::fromArray($row);

         // Set lineageHTML and name.
         $searchResult->process();

         // Normalize the search result object and add it to the results.
         // array_push($searchResults, $searchResult->normalize());

         // AI says that $array[] is slightly faster than array_push since 1
         // element is being added each iteration instead of multiple at once.
         $searchResults[] = $searchResult->normalize();
      }
      return $searchResults;
   }

}
