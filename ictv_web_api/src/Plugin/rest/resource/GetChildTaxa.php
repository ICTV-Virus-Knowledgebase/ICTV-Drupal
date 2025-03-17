<?php

// PHP api call:
// https://test.ictv.global/api/get-child-taxa?taxnode_id=202312129

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_child_taxa&taxnode_id=202312129

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Config;
use Drupal\Core\Database;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;

// Helpers
use Drupal\ictv_web_api\helpers\TaxonomyHelper;

// Models
// use Drupal\ictv_web_api\Plugin\rest\resource\models\ChildTaxaResult;
use Drupal\ictv_web_api\Plugin\rest\resource\models\Taxon;

/**
 * Provides a REST Resource to get child taxa by parent taxnode_id.
 *
 * @RestResource(
 *   id = "get_child_taxa",
 *   label = @Translation("Get Child Taxa"),
 *   uri_paths = {
 *     "canonical" = "/api/get-child-taxa"
 *   }
 * )
 */
class GetChildTaxa extends ResourceBase {

  // The connection to the ictv_apps database.
  protected Connection $connection;

  // The name of the database used by this web service.
  protected string $databaseName = 'ictv_taxonomy';

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
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $currentUser) {

    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);

    // Get a database connection.
    $this->connection = \Drupal\Core\Database\Database::getConnection('default', $this->databaseName);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('ictv_web_api_resource'),
      $container->get('current_user')
    );
  }

  public function get(Request $request) {

    // 1) Retrieve the 'taxnode_id' parameter from the request.
    $taxnodeID = $request->get('taxnode_id');
    if (Utils::isNullOrEmpty($taxnodeID)) { throw new BadRequestHttpException("Invalid tax node ID"); }

    $results = $this->getByParentTaxon($taxnodeID);
    // if (Utils::isNullOrEmpty($results)) { throw new BadRequestHttpException("Invalid results"); }

    // if (empty($taxnodeID) || !is_numeric($taxnodeID)) {
    //   throw new BadRequestHttpException('Invalid tax node ID');
    // }

    $taxnodeID = (int) $taxnodeID;

    // 2) Call a method to retrieve child taxa from the database.
    $taxa = $this->getByParentTaxon($taxnodeID);

    // 3) Build the response data.
    $data = [
      'parentTaxnodeID' => $taxnodeID,
      'taxonomy' => $taxa,
    ];

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


  public function getByParentTaxon(int $taxnodeID): array {

    // Populate the query parameters.
    $parameters = [':taxnode_id' => $taxnodeID];

    // Generate mariadb query.
    $sql = "
    SELECT
      parent.level_id       AS parent_level_id,
      parent_level.name     AS parent_level_name,
  " . TaxonomyHelper::generatePartialQuery() . "
    JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
    JOIN taxonomy_level parent_level ON parent_level.id = parent.level_id
    WHERE tn.parent_id = :taxnode_id
      AND tn.is_hidden = 0
      AND tn.is_deleted = 0
    ORDER BY tn.left_idx ASC
  ";

    try {
      // Run the mariadb query.
      $queryResults = $this->connection->query($sql, $parameters);
    } 
    catch (Exception $e) {
      \Drupal::logger('ictv_web_api')->error($e);
      return null;
    }

    $taxa = [];

    // Iterate over the result rows and add each row to the search results.
    // foreach ($queryResults as $row) {

    //   $taxonObj = ChildTaxaResult::fromArray((array) $row);

    //   array_push($taxa, $taxonObj->normalize());
    // }

    foreach ($queryResults as $row) {

      // Convert DB row to an array
      $rowArr = (array) $row;
  
      // Build the Taxon object from that array
      $taxon = Taxon::fromArray($rowArr);
      $taxon->process();
      // memberOf is calculated from the lineage column in the DB
      $taxon->memberOf = $taxon->getMemberOf();
  
      // Add the populated Taxon object to the array
      $taxa[] = $taxon->normalize();
    }

    return $taxa;
  }
}


