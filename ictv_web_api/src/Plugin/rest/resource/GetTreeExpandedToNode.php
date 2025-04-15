<?php

// PHP api call:
// https://logan1.ictv.global/api/get-tree-expanded-to-node?taxnode_id=202404739&msl_release=40&pre_expand_to_rank=family&top_level_rank=realm&display_child_count=true&display_history_controls=true&display_member_of_controls=true&left_align_all=false&use_small_font=false

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_tree_expanded_to_node&taxnode_id=202404739&msl_release=40&pre_expand_to_rank="family"&top_level_rank="realm"&display_child_count=true&display_history_controls=true&display_member_of_controls=true&left_align_all=false&use_small_font=false

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\ictv_common\Utils;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;

// Helper
use Drupal\ictv_web_api\helpers\TaxonomyHelper;

/**
 * Provides a REST Resource to expand the taxonomy tree to a specific node.
 *
 * @RestResource(
 *   id = "get_tree_expanded_to_node",
 *   label = @Translation("Get Tree Expanded to Node"),
 *   uri_paths = {
 *     "canonical" = "/api/get-tree-expanded-to-node"
 *   }
 * )
 */

class GetTreeExpandedToNode extends ResourceBase {

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
   * Handle GET requests to /api/get-tree-expanded-to-node
   */

  public function get(Request $request): ResourceResponse {

    // 1) Parse parameters from the request
    $displayChildCount    = $this->getBoolParam($request, 'display_child_count', true);
    $displayHistoryCtrls  = $this->getBoolParam($request, 'display_history_controls', true);
    $displayMemberOfCtrls = $this->getBoolParam($request, 'display_member_of_controls', true);
    $leftAlignAll         = $this->getBoolParam($request, 'left_align_all', false);
    $useSmallFont         = $this->getBoolParam($request, 'use_small_font', false);

    // taxNodeID
    $strTaxNodeID = $request->get('taxnode_id');
    if (Utils::isNullOrEmpty($strTaxNodeID) || !is_numeric($strTaxNodeID)) {
      throw new BadRequestHttpException("Invalid tax node ID");
    }
    $taxNodeID = (int) $strTaxNodeID;

    // preExpandToRank
    $preExpandToRank = $request->get('pre_expand_to_rank');
    if (Utils::isNullOrEmpty($preExpandToRank)) {
      $preExpandToRank = null;
    }

    // releaseNumber
    $strMslRelease = $request->get('msl_release');
    $releaseNumber = null;
    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) {
      $releaseNumber = (int)$strMslRelease;
    }

    // topLevelRank
    $topLevelRank = $request->get('top_level_rank');
    if (Utils::isNullOrEmpty($topLevelRank)) {
      $topLevelRank = null;
    }

    // 2) Step A: Build the "pre-expanded" taxonomy HTML
    //    (i.e. replicate C# getByReleasePreExpanded(...) => htmlResults_)
    //    We'll call a method in TaxonomyHelper, e.g. buildPreExpandedHtml.
    $htmlResults = TaxonomyHelper::buildPreExpandedHtml(
      $this->connection,
      $displayChildCount,
      $displayHistoryCtrls,
      $displayMemberOfCtrls,
      $leftAlignAll,
      $preExpandToRank,
      $releaseNumber,
      $topLevelRank,
      $useSmallFont
    );

    // 3) Step B: Get the sub-tree containing $taxNodeID
    //    (i.e. replicate getSubTreeContainingNode => we get the parentTaxNodeID, sub-tree taxa, etc.)
    $subTreeData = TaxonomyHelper::getSubTreeContainingNodeData(
      $this->connection,
      $preExpandToRank,
      $releaseNumber,
      $taxNodeID,
      $topLevelRank
    );
    // That returns something like:
    // [
    //   'parentTaxNodeID'   => ?int,
    //   'selectedLevelID'   => int,
    //   'taxa'              => array of Taxon,
    //   'topLevelRankID'    => int,
    //   'preExpandToRankID' => int,
    // ]

    $parentTaxnodeID  = $subTreeData['parentTaxNodeID'];
    $selectedLevelID  = $subTreeData['selectedLevelID'];
    $taxa             = $subTreeData['taxa'];
    $topLevelRankID   = $subTreeData['topLevelRankID'];
    $preExpandRankID  = $subTreeData['preExpandToRankID'];

    // 4) Step C: Format that sub-tree => subTreeHTML
    //    i.e. replicate C# formatSubTreeContainingNode(...).
    //    You presumably have it in TaxonomyHelper as well:
    $subTreeHTML = TaxonomyHelper::formatSubTreeContainingNode(
      $displayChildCount,
      $displayHistoryCtrls,
      $displayMemberOfCtrls,
      $leftAlignAll,
      $preExpandRankID,    // preExpandToRankID
      $releaseNumber,
      $selectedLevelID,
      $taxa,
      $taxNodeID,
      $topLevelRankID,
      $useSmallFont
    );

    // 5) Return final structure
    $data = [
      'parentTaxNodeID' => $parentTaxnodeID,
      'taxNodeID'       => $taxNodeID,
      'taxonomyHTML'    => $htmlResults,  // from step 2
      'subTreeHTML'     => $subTreeHTML,  // from step 4
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

   /** 
    * {@inheritdoc} 
    * This function has to exist in order for the admin to assign user permissions 
    * to the web service.
    */

   public function permissions() {
      return []; 
   } 

  /**
   * Helper to parse booleans from query params.
   */

  protected function getBoolParam(Request $request, string $paramName, bool $default): bool {
    $val = $request->get($paramName);
    if ($val === null) {
      return $default;
    }
    return in_array(strtolower($val), ['true','1'], true);
  }
}