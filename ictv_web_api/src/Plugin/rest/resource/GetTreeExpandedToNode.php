<?php

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

      $html = "";
      
      // taxNodeID
      $strTaxNodeID = $request->get('taxnode_id');
      if (Utils::isNullOrEmpty($strTaxNodeID) || !is_numeric($strTaxNodeID)) {
      throw new BadRequestHttpException("Invalid tax node ID");
      }
      $taxNodeID = (int) $strTaxNodeID;

      // Get all top-level nodes (whose direct parent is the tree/root node), the selected taxon, 
      // its lineage, and the immediate child nodes of the lineage nodes (with redundancies removed).
      $taxa = TaxonomyHelper::getLineageAndTopLevelNodes($this->connection, $taxNodeID);
      if (!empty($taxa)) {
         // Format the taxa as HTML.
         $html = TaxonomyHelper::formatTaxaAsHTML($taxa);
      }

      $data = [
         "taxNodeID"       => $taxNodeID,
         "taxonomyHTML"    => $html
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