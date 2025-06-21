<?php

// PHP api call:
// https://logan1.ictv.global/api/get-taxon-history?msl_release=39&taxnode_id=202312129

// C# api call:
// https://dev.ictv.global/ICTV/api/taxonomy.ashx?action_code=get_child_taxa&taxnode_id=202312129

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\ictv_web_api\helpers\Common;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\Core\Database\Connection;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Psr\Log\LoggerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\ictv_web_api\helpers\TaxonHistory;

 /**
  * @RestResource(
  *   id = "get_taxon_history",
  *   label = @Translation("Get Taxon History"),
  *   uri_paths = {
  *     "canonical" = "/api/get-taxon-history",
  *     "create" = "/api/get-taxon-history"
  *   }
  * )
  */

class GetTaxonHistory extends ResourceBase {

  protected Connection $connection;

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    
    $this->connection = \Drupal\Core\Database\Database::getConnection('default', 'ictv_taxonomy');
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
    
      // Get and validate the input parameters.
      $currentMSL = Common::getIntParameter($request, "currentMSL", true);
      $ictvID = Common::getIntParameter($request, "ictvID");
      $MSL = Common::getIntParameter($request, "MSL");
      $taxNodeID = Common::getIntParameter($request, "taxNodeID");
      $taxonName = $request->get("taxonName") ?? null;
      $vmrID = Common::getIntParameter($request, "vmrID");

      // Get the taxa and releases associated with the input parameters.
      $result = TaxonHistory::fetch($this->connection, $currentMSL, $ictvID, $MSL, $taxNodeID, $taxonName, $vmrID);

      $response = new ResourceResponse($result);
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
  
}