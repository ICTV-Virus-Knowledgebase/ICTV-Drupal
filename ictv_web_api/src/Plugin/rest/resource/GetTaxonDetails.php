<?php

// PHP api call:
// https://logan1.ictv.global/api/get-taxon-details?taxnode_id=202412131

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_taxon_details&taxnode_id=202412131

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ictv_common\Utils;

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\ReleaseListEntry;

//Helper
use Drupal\ictv_web_api\helpers\SimpleTaxon;

/**
 * Provides a REST Resource to get taxon details by taxnode_id.
 *
 * @RestResource(
 *   id = "get_taxon_details",
 *   label = @Translation("Get Taxon Details"),
 *   uri_paths = {
 *     "canonical" = "/api/get-taxon-details"
 *   }
 * )
 */

class GetTaxonDetails extends ResourceBase {

  protected Connection $connection;
  protected string $databaseName = 'ictv_taxonomy';

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $currentUser
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    // Get the database connection
    $this->connection = \Drupal\Core\Database\Database::getConnection('default', $this->databaseName);
  }

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
   * Handle GET requests to /api/get-taxon-details.
   */

  public function get(Request $request): ResourceResponse {

    // 1) Retrieve the 'taxnode_id' parameter
    $strTaxNodeID = $request->get('taxnode_id');
    if (Utils::isNullOrEmpty($strTaxNodeID) || !is_numeric($strTaxNodeID)) { throw new BadRequestHttpException("Invalid tax node ID"); }

    $taxNodeID = (int) $strTaxNodeID;

    // 2) Get lineage (ancestors)
    $lineage = $this->getLineage($taxNodeID);

    // 3) Get all releases for this taxnode ID
    $releases = $this->getAllReleases($taxNodeID);

    // 4) The C# code returns { ancestors: lineage, lineage: lineage, releases: releases }
    $data = [
      'ancestors' => $lineage,
      'lineage'   => $lineage,
      'releases'  => $releases,
    ];

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

  public function permissions() {
    return [];
  }

  /**
   * Replicates Taxonomy.getLineage in C#:
   */

  protected function getLineage(int $taxNodeID): array {

    $sql = "
      SELECT 
        tl.name AS taxon_level,
        lineage.name AS taxon_name,
        lineage.taxnode_id AS taxnode_id,
        lineage.is_hidden AS is_hidden
      FROM taxonomy_node AS src
      JOIN taxonomy_node AS lineage ON (
        src.left_idx BETWEEN lineage.left_idx AND lineage.right_idx
        AND lineage.parent_id <> lineage.taxnode_id
        AND lineage.tree_id = src.tree_id
      )
      JOIN taxonomy_level AS tl ON tl.id = lineage.level_id
      WHERE src.taxnode_id = :taxnode_id
      ORDER BY (lineage.right_idx - lineage.left_idx) DESC
    ";

    $stmt = $this->connection->query($sql, [':taxnode_id' => $taxNodeID]);

    // LRM 04072025
    // This is done with the SimpleTaxon class in c#
    // Here, I just return the array and type cast 
    // Should I just make a SimpleTaxon class instead?
    $lineage = [];
    foreach ($stmt as $row) {

      $simpleTaxon = SimpleTaxon::fromArray((array)$row);
      $simpleTaxon->process();
      $lineage[] = $simpleTaxon->normalize();
      // $lineage[] = [
      //   'isHidden'  => ((int) $row->is_hidden) === 1,
      //   'level' => $row->taxon_level,
      //   'name'  => $row->taxon_name,
      //   'taxNodeID' => (int) $row->taxnode_id,
      // ];
    }

    return $lineage;
  }

  /**
   * Replicates ReleaseListEntry.getAll(_dbConnectionString, taxNodeID, true).
   */

  protected function getAllReleases(int $taxNodeID): array {

    // 1) Let the ReleaseListEntry class handle the logic
    $entries = ReleaseListEntry::getAll($this->connection, $taxNodeID, true);

    // 2) Convert each ReleaseListEntry to an array
    $output = [];
    foreach ($entries as $e) {
      $output[] = $e->normalize();
    }
    return $output;
  }
}