<?php

// PHP api call:
// https://logan1.ictv.global/api/get-taxa-by-name?msl_release=39&taxon_name=Taleaviricota

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_taxa_by_name&msl_release=39&taxon_name=Taleaviricota

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ictv_common\Utils;

// Helper
use Drupal\ictv_web_api\helpers\TaxonomyHelper;

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\Taxon;

/**
 * Provides a REST Resource to get taxa by taxon name.
 *
 * @RestResource(
 *   id = "get_taxa_by_name",
 *   label = @Translation("Get Taxa By Name"),
 *   uri_paths = {
 *     "canonical" = "/api/get-taxa-by-name"
 *   }
 * )
 */

class GetTaxaByName extends ResourceBase {

  protected Connection $connection;
  protected string $databaseName = 'ictv_taxonomy';

  /**
   * Class constructor.
   */

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $currentUser
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);

    // Get the named DB connection.
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

  /**
   * Handle GET requests to /api/get-taxa-by-name
   */

  public function get(Request $request): ResourceResponse {
    
    // Retrieve the parameters from the request
    $strMslRelease = $request->get('msl_release');
    $taxonName = $request->get('taxon_name');
    
    // Validate
    if (Utils::isNullOrEmpty($taxonName)) { throw new BadRequestHttpException("Invalid taxon name"); }
    
    // Convert msl_release to int if present
    $releaseNumber = null;
    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) { $releaseNumber = (int) $strMslRelease; }

    // Call a helper method to replicate the C# logic:
    // getByTaxonName(...) that returns [parentID, taxNodeID, taxonomy].
    $data = $this->getByTaxonName($releaseNumber, $taxonName);

    // Build the response
    $response = new ResourceResponse($data);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->addCacheableDependency(['#cache' => ['max-age' => 0]]);
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

  // getByTaxonName was translated from the C# code inside Taxonomy.cs
  protected function getByTaxonName(?int $releaseNumber, string $taxonName): array {

    // Initialize outputs
    $parentID = null;
    $taxNodeID = null;
    $taxa = [];

    $parameters = [
        ':taxonName' => $taxonName,
        ':releaseNumber' => $releaseNumber,
      ];

    $sql = "
      SET @treeID = udf_getTreeID(:releaseNumber);

      SET @taxNodeID = (
        SELECT taxnode_id
        FROM taxonomy_node
        WHERE name = :taxonName
          AND tree_id = @treeID
        LIMIT 1
      );

      SELECT
        tn.*  -- or generatePartialQuery snippet
      FROM taxonomy_node tn
      WHERE (tn.parent_id = @taxNodeID OR tn.taxnode_id = @taxNodeID)
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
      ORDER BY tn.left_idx ASC
    ";

    $sql = "
      SELECT
        " . TaxonomyHelper::generatePartialQuery() . "
      WHERE (
          tn.parent_id = (
            SELECT taxnode_id
            FROM taxonomy_node
            WHERE name = :taxonName
              AND tree_id = udf_getTreeID(:releaseNumber)
            LIMIT 1
          )
        ) 
        OR (
          tn.taxnode_id = (
            SELECT taxnode_id
            FROM taxonomy_node
            WHERE name = :taxonName
              AND tree_id = udf_getTreeID(:releaseNumber)
            LIMIT 1
          )
        )
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
      ORDER BY tn.left_idx ASC
    ";

    try {
      $queryResults = $this->connection->query($sql, $parameters);

      // Convert each row into a Taxon
      $tempTaxa = [];
      foreach ($queryResults as $row) {
        $taxon = Taxon::fromArray((array) $row);
        $taxon->process();
        // Store the newly computed memberOf
        $taxon->memberOf = $taxon->getMemberOf();
        $tempTaxa[] = $taxon;
      }

      if (!empty($tempTaxa)) {

        // parentID_ = taxon.parentID; taxNodeID_ = taxon.taxnodeID; (like in C#)
        // The first taxon is the "selected" node or parent. 
        $first = $tempTaxa[0];
        $parentID = $first->parentID;
        $taxNodeID = $first->taxnodeID;

        // The C# code offset nodeDepth => replicate by:
        $topLevelDepth = 2 - $first->nodeDepth;
        for ($i = 0; $i < count($tempTaxa); $i++) {
          $tempTaxa[$i]->nodeDepth += $topLevelDepth;
        }

        // Convert to normalized arrays for final output
        foreach ($tempTaxa as $t) {
          $taxa[] = $t->normalize();
        }
      }
    }
    catch (\Exception $e) {
      \Drupal::logger('ictv_web_api')->error($e->getMessage());

      // Return some fallback
      return [
        'parentID' => null,
        'taxNodeID' => null,
        'taxonomy' => [],
      ];
    }

    // Return the structure:
    return [
      'parentID'  => $parentID,
      'taxNodeID' => $taxNodeID,
      'taxonomy'  => $taxa,
    ];
  }
}
