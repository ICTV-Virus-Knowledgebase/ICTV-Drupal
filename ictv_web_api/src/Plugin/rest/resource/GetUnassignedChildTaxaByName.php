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

    if (Utils::isNullOrEmpty($taxonName)) { throw new BadRequestHttpException("Invalid taxon name"); }

    $releaseNumber = null;
    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) { $releaseNumber = (int)$strMslRelease; }

    $data = $this->getUnassignedChildTaxaByName($releaseNumber, $taxonName);

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
   * Replicates the C# getUnassignedChildTaxaByName logic.
   *
   * @param int|null $releaseNumber
   * @param string $taxonName
   * @return array
   *   Structure with keys: parentID, taxNodeID, taxonomy.
   */
  
   public function getUnassignedChildTaxaByName(?int $releaseNumber, string $taxonName): array {

    // 1) get treeID
    $sql1 = "SELECT udf_getTreeID(:releaseNumber) AS treeID";
    $stmt1 = $this->connection->query($sql1, [':releaseNumber' => $releaseNumber]);

    // Fetch one row as an associative array
    $row1 = $stmt1->fetchAssoc();
    $treeID = $row1['treeID'] ?? null;
  
    // 2) get taxNodeID
    $sql2 = "
      SELECT taxnode_id
      FROM taxonomy_node
      WHERE name = :taxonName
        AND tree_id = :treeID
      LIMIT 1
    ";

    $stmt2 = $this->connection->query($sql2, [
      ':taxonName' => $taxonName,
      ':treeID' => $treeID
    ]);

    $row2 = $stmt2->fetchAssoc();
    $taxNodeID = $row2['taxnode_id'] ?? null;
  
    if (!$taxNodeID) {

      // no match found or invalid taxnode
      return ['parentID' => null, 'taxNodeID' => null, 'taxonomy' => []];
    }
  
    // 3) final SELECT using generatePartialQuery inside TaxonomyHelper
    $sql3 = "
      SELECT " . TaxonomyHelper::generatePartialQuery() . "
      JOIN taxonomy_node ptn ON tn.left_idx BETWEEN ptn.left_idx AND ptn.right_idx
        AND tn.tree_id = ptn.tree_id
        AND ptn.taxnode_id = :taxNodeID
      LEFT JOIN taxonomy_node genus ON genus.taxnode_id = tn.genus_id
      WHERE (genus.name = 'unassigned' OR (tn.genus_id IS NULL AND tn.subgenus_id IS NULL))
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
      ORDER BY tn.left_idx ASC
    ";
  
    $stmt3 = $this->connection->query($sql3, [':taxNodeID' => $taxNodeID]);
    
    $tempTaxa = [];
    foreach ($stmt3 as $row) {
      $taxon = Taxon::fromArray((array)$row);
      $taxon->process();
      $taxon->memberOf = $taxon->getMemberOf();
      $tempTaxa[] = $taxon;
    }
  
    // offset node depths, set parentID, etc.
    $parentID = null;
    if (!empty($tempTaxa)) {
      $first = $tempTaxa[0];
      $parentID = $first->parentID;
      $taxNodeID = $first->taxnodeID;
      $offset = 2 - $first->nodeDepth;
      foreach ($tempTaxa as $t) {
        $t->nodeDepth += $offset;
      }
    }
  
    // convert to normalized
    $taxonomy = [];
    foreach ($tempTaxa as $t) {
      $taxonomy[] = $t->normalize();
    }
  
    return [
      'parentID' => $parentID,
      'taxNodeID' => $taxNodeID,
      'taxonomy' => $taxonomy,
    ];
  }
}