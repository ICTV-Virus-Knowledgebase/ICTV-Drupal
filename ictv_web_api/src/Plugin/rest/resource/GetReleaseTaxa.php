<?php

// PHP api call:
// https://logan1.ictv.global/api/get-release-taxa?msl_release=39&top_level_rank=family

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_release_taxa&msl_release=39&top_level_rank=family

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

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\Taxon;

// Helper 
// For generatePartialQuery() method
use Drupal\ictv_web_api\helpers\TaxonomyHelper;              

/**
 * Provides a REST Resource to get taxa by release number and top-level rank.
 *
 * @RestResource(
 *   id = "get_release_taxa",
 *   label = @Translation("Get Release Taxa"),
 *   uri_paths = {
 *     "canonical" = "/api/get-release-taxa"
 *   }
 * )
 */

class GetReleaseTaxa extends ResourceBase {

  protected Connection $connection;
  protected string $databaseName = 'ictv_taxonomy';

  /**
   * Constructs a Drupal\rest\Plugin\ResourceBase object.
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
   * Handle GET requests to /api/get-release-taxa
   */

  public function get(Request $request): ResourceResponse {

    // Retrieve the 'msl_release' param
    $strMslRelease = $request->get('msl_release');
    $releaseNumber = null;

    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) { $releaseNumber = (int) $strMslRelease; }

    // The 'top_level_rank' param
    $topLevelRank = $request->get('top_level_rank');
    if (Utils::isNullOrEmpty($topLevelRank)) { $topLevelRank = null; }

    // Call a helper method to replicate the C# logic:
    $data = $this->getByReleaseNumber($releaseNumber, $topLevelRank);

    // Build the response
    // The C# returns { "taxonomy": taxa }.
    $responseData = [
      'taxonomy' => $data,
    ];

    $response = new ResourceResponse($responseData);
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

  /**
   * Replicates the C# getByReleaseNumber(...) logic.
   *
   * @param int|null $releaseNumber
   * @param string|null $topLevelRank
   *
   * @return array
   *   An array of normalized Taxon objects.
   */

  protected function getByReleaseNumber(?int $releaseNumber, ?string $topLevelRank): array {

    // If topLevelRank is empty, default to 'tree' (like C# code).
    if (empty($topLevelRank)) {
      $topLevelRank = 'tree';
    }

    // Get topLevelID from the table taxonomy_level
    $sql1 = "
      SELECT id AS topLevelID
      FROM taxonomy_level
      WHERE name = :topLevelRank
      LIMIT 1
    ";

    $stmt1 = $this->connection->query($sql1, [':topLevelRank' => $topLevelRank]);

    // Fetch the top row
    $row1 = $stmt1->fetchAssoc();
    $topLevelID = $row1['topLevelID'] ?? null;

    // How should we handle this if the rank is not found?
    if (!$topLevelID) {

      // For now let's just set it to 100 if not found
      $topLevelID = 100;
    }

    $partial = TaxonomyHelper::generatePartialQuery();

    // The partial includes "FROM taxonomy_node tn JOIN taxonomy_level tl ON ..."
    // Do a subselect for the treeID:
    // e.g. "tn.tree_id = udf_getTreeID(:releaseNumber)" or if releaseNumber is null => pass null
    $sql2 = "
      SELECT " . $partial . "
      JOIN taxonomy_node parent ON (
        parent.taxnode_id = tn.parent_id 
        AND (parent.level_id < :topLevelID OR parent.level_id = 100)
      )
      WHERE tn.tree_id = udf_getTreeID(:releaseNumber)
        AND tn.level_id >= :topLevelID
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
      ORDER BY tn.level_id,
        CASE 
          WHEN tn.start_num_sort IS NULL THEN COALESCE(tn.name, 'ZZZZ')
          ELSE LEFT(tn.name, tn.start_num_sort)
        END,
        CASE
          WHEN tn.start_num_sort IS NULL THEN NULL
          ELSE floor(LTRIM(SUBSTRING(tn.name, tn.start_num_sort + 1, 50)))
        END
    ";

    $parameters = [
      ':topLevelID' => $topLevelID,
      ':releaseNumber' => $releaseNumber
    ];

    $stmt2 = $this->connection->query($sql2, $parameters);

    $tempTaxa = [];
    foreach ($stmt2 as $row) {

      $taxon = Taxon::fromArray((array) $row);
      $taxon->process();

      // Call getMemberOf to get memberOf value
      $taxon->memberOf = $taxon->getMemberOf();
      $tempTaxa[] = $taxon;
    }

    // Convert them to normalized arrays
    $taxonomy = [];
    foreach ($tempTaxa as $t) {
      $taxonomy[] = $t->normalize();
    }

    return $taxonomy;
  }
}