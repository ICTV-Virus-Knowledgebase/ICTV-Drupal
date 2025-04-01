<?php

// PHP api call:
// GET https://logan1.ictv.global/api/get-unassigned-child-taxa-by-name?msl_release=39&taxon_name=Taleaviricota

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_unassigned_child_taxa_by_name&msl_release=39&taxon_name=Taleaviricota

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
 * Provides a REST Resource to get unassigned child taxa by taxon name.
 *
 * @RestResource(
 *   id = "get_unassigned_child_taxa_by_name",
 *   label = @Translation("Get Unassigned Child Taxa By Name"),
 *   uri_paths = {
 *     "canonical" = "/api/get-unassigned-child-taxa-by-name"
 *   }
 * )
 */
class GetUnassignedChildTaxaByName extends ResourceBase {

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
   * Handle GET requests to /api/get-unassigned-child-taxa-by-name
   */
  public function get(Request $request): ResourceResponse {
    $strMslRelease = $request->get('msl_release');
    $taxonName = $request->get('taxon_name');

    if (Utils::isNullOrEmpty($taxonName)) {
      throw new BadRequestHttpException("Invalid taxon name");
    }

    $releaseNumber = null;
    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) {
      $releaseNumber = (int)$strMslRelease;
    }

    $data = $this->getUnassignedChildTaxaByNameHelper($releaseNumber, $taxonName);

    $response = new ResourceResponse($data);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->addCacheableDependency(['#cache' => ['max-age' => 0]]);
    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function permissions() {
    return [];
  }

  /**
   * Replicates the C# getUnassignedChildTaxaByName logic.
   *
   * @param int|null $releaseNumber
   * @param string $taxonName
   * @return array
   *   Structure with keys: parentID, taxNodeID, taxonomy.
   */
  protected function getUnassignedChildTaxaByNameHelper(?int $releaseNumber, string $taxonName): array {
    $parentID = null;
    $taxNodeID = null;
    $taxa = [];

    $parameters = [
      ':taxonName' => $taxonName,
      ':releaseNumber' => $releaseNumber,
    ];

    // Build the SQL query.
    // In C#, declare @treeID and @taxNodeID. In PHP, use subqueries.
    $sql = "
    SELECT " . TaxonomyHelper::generatePartialQuery() . "
    
    CROSS JOIN (
      SELECT taxnode_id AS targetTaxNodeID, udf_getTreeID(:releaseNumber) AS treeID
      FROM taxonomy_node
      WHERE name = :taxonName
      LIMIT 1
    ) AS target
    JOIN taxonomy_node ptn 
      ON tn.left_idx BETWEEN ptn.left_idx AND ptn.right_idx 
         AND tn.tree_id = ptn.tree_id 
         AND ptn.taxnode_id = target.targetTaxNodeID
    LEFT JOIN taxonomy_node genus 
      ON genus.taxnode_id = tn.genus_id
    WHERE (genus.name = 'unassigned' OR (tn.genus_id IS NULL AND tn.subgenus_id IS NULL))
      AND tn.is_hidden = 0
      AND tn.is_deleted = 0
    ORDER BY tn.left_idx ASC
  ";

    try {
      $queryResults = $this->connection->query($sql, $parameters);

      $tempTaxa = [];
      foreach ($queryResults as $row) {
        $taxon = Taxon::fromArray((array)$row);
        $taxon->process();
        $tempTaxa[] = $taxon;
      }

      if (!empty($tempTaxa)) {
        // Use the first taxon as the reference.
        $first = $tempTaxa[0];
        $parentID = $first->parentID;
        $taxNodeID = $first->taxnodeID;

        // Adjust nodeDepth so that the top-level depth is 2.
        $topLevelDepth = 2 - $first->nodeDepth;
        for ($i = 0; $i < count($tempTaxa); $i++) {
          $tempTaxa[$i]->nodeDepth += $topLevelDepth;
        }

        foreach ($tempTaxa as $t) {
          $taxa[] = $t->normalize();
        }
      }
    }
    catch (\Exception $e) {
      \Drupal::logger('ictv_web_api')->error($e->getMessage());
      return [
        'parentID' => null,
        'taxNodeID' => null,
        'taxonomy' => [],
      ];
    }

    return [
      'parentID' => $parentID,
      'taxNodeID' => $taxNodeID,
      'taxonomy' => $taxa,
    ];
  }
}