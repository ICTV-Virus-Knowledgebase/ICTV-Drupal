<?php

// PHP api call:
// https://logan1.ictv.global/api/get-release-history

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_release_history

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\MslRelease;

/**
 * Provides a REST Resource to get all MslRelease records (release history).
 *
 * @RestResource(
 *   id = "get_release_history",
 *   label = @Translation("Get Release History"),
 *   uri_paths = {
 *     "canonical" = "/api/get-release-history"
 *   }
 * )
 */

class GetReleaseHistory extends ResourceBase {

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
   * Handle GET requests to /api/get-release-history
   */

  public function get(Request $request): ResourceResponse {

    // 1) Call MslRelease::getAll() to retrieve all releases
    $allReleases = MslRelease::getAll($this->connection);

    // 2) Convert each MslRelease object to a plain array
    $output = [];
    foreach ($allReleases as $releaseObj) {
      $output[] = $releaseObj->normalize();
    }

    // 3) Return them as "releases"
    $data = [
      'releases' => $output
    ];

    $response = new ResourceResponse($data);
    // Optionally allow cross-origin requests:
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
   */

public function permissions() {
    return [];
  }
}