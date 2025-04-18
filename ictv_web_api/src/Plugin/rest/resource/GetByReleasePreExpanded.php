<?php

// PHP api call:
// https://logan1.ictv.global/api/get-by-release-pre-expanded?msl_release=40&pre_expand_to_rank=realm&top_level_rank=realm&display_child_count=true&display_history_controls=true&display_member_of_controls=true&left_align_all=false&use_small_font=false

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_by_release_pre_expanded&msl_release=40&pre_expand_to_rank=realm&top_level_rank=realm&display_child_count=true&display_history_controls=true&display_member_of_controls=true&left_align_all=false&use_small_font=false

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\ictv_common\Utils;
use Drupal\ictv_web_api\helpers\TaxonomyHelper;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;

/**
 * Provides a REST Resource to get a pre‑expanded release tree.
 *
 * @RestResource(
 *   id = "get_by_release_pre_expanded",
 *   label = @Translation("Get Taxonomy Pre‑Expanded by Release"),
 *   uri_paths = {
 *     "canonical" = "/api/get-by-release-pre-expanded"
 *   }
 * )
 */

class GetByReleasePreExpanded extends ResourceBase {

  /** @var Connection */
  protected Connection $connection;

  protected string $databaseName = 'ictv_taxonomy';

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user
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
   * Handle GET requests to /api/get-by-release-pre-expanded.
   */

  public function get(Request $request): ResourceResponse {

    // Parse boolean flags
    $displayChildCount    = $this->getBoolParam($request, 'display_child_count',    TRUE);
    $displayHistoryCtrls  = $this->getBoolParam($request, 'display_history_controls', TRUE);
    $displayMemberOfCtrls = $this->getBoolParam($request, 'display_member_of_controls', TRUE);
    $leftAlignAll         = $this->getBoolParam($request, 'left_align_all',       FALSE);
    $useSmallFont         = $this->getBoolParam($request, 'use_small_font',       FALSE);

    // Optional string parameters
    $preExpandToRank = $request->get('pre_expand_to_rank') ?: NULL;
    $topLevelRank    = $request->get('top_level_rank')    ?: NULL;

    // Optional integer (nullable) parameter
    $releaseNumber = NULL;
    $str = $request->get('msl_release');
    if (!Utils::isNullOrEmpty($str) && is_numeric($str)) { $releaseNumber = (int) $str; }

    // Build the HTML
    $html = TaxonomyHelper::buildPreExpandedHtml(
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

    // Return wrapped in the expected key
    $data = ['taxonomyHTML' => $html];
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
   * Helper to read a boolean query parameter.
   */

  protected function getBoolParam(Request $request, string $key, bool $default): bool {
    $v = $request->get($key);
    if ($v === NULL) {
      return $default;
    }
    return in_array(strtolower($v), ['1','true'], TRUE);
  }
}