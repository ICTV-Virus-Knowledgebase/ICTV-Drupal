<?php

// PHP api call:
// https://logan1.ictv.global/api/get-msl-release?msl_release=40

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_msl_release&msl_release=40

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Drupal\ictv_common\Utils;

// Models
use Drupal\ictv_web_api\Plugin\rest\resource\models\MslRelease;

/**
 * Provides a REST Resource to get a single MslRelease.
 *
 * @RestResource(
 *   id = "get_msl_release",
 *   label = @Translation("Get Msl Release"),
 *   uri_paths = {
 *     "canonical" = "/api/get-msl-release"
 *   }
 * )
 */

class GetMslRelease extends ResourceBase {

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

  public function get(Request $request): ResourceResponse {

    // parse msl_release
    $strMslRelease = $request->get('msl_release');
    $releaseNumber = null;
    if (!Utils::isNullOrEmpty($strMslRelease) && is_numeric($strMslRelease)) { $releaseNumber = (int) $strMslRelease; }

    // get MslRelease
    $releaseObj = MslRelease::get($this->connection, $releaseNumber);

    $output = [
      'release' => $releaseObj ? $releaseObj->normalize() : null
    ];

    $response = new ResourceResponse($output);
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
}
  