<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_common\Utils;

// Helpers
use Drupal\ictv_web_api\helpers\TaxonomyHelper;

// Models
use Drupal\ictv_web_api\Plugin\rest\resource\models\Taxon;

/**
 * Provides a REST Resource to get a Taxon by its taxnode_id.
 *
 * @RestResource(
 *   id = "get_taxon",
 *   label = @Translation("Get Taxon"),
 *   uri_paths = {
 *     "canonical" = "/api/get-taxon"
 *   }
 * )
 */
class GetTaxon extends ResourceBase {

   // The connection to the ictv_apps database.
   protected Connection $connection;

   // The name of the database used by this web service.
   protected string $databaseName = 'ictv_taxonomy';

   /**
    * Constructs a Drupal\rest\Plugin\ResourceBase object.
    *
    * @param array $config
    *   A configuration array which contains the information about the plugin instance.
    * @param string $module_id
    *   The module_id for the plugin instance.
    * @param mixed $module_definition
    *   The plugin implementation definition.
    * @param array $serializer_formats
    *   The available serialization formats.
    * @param \Psr\Log\LoggerInterface $logger
    *   A logger instance.
    */
   public function __construct(
      array $configuration,
      $plugin_id,
      $plugin_definition,
      array $serializer_formats,
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);

      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
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

  public function get(Request $request) {

      // Retrieve the 'taxnode_id' parameter from the request.
      $taxnodeID = $request->get('taxnode_id');
      if (empty($taxnodeID) || !is_numeric($taxnodeID)) {
         throw new BadRequestHttpException('Invalid tax node ID');
      }

      $taxnodeID = (int)$taxnodeID;

      // Get the taxon from the database.
      $taxon = $this->getTaxon($taxnodeID);

      $build = array(
         '#cache' => array(
            'max-age' => 0,
         ),
      );

      $response = new ResourceResponse($taxon);
      $response->addCacheableDependency($build);
      $response->headers->set('Access-Control-Allow-Origin', '*');

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


   public function getTaxon(int $taxnodeID): ?array {

      // The result that will be returned.
      $result = null;

      // Populate the query parameter.
      $parameters = [':taxnode_id' => $taxnodeID];

      // Generate a query to return a single taxon.
      $sql = 
         "SELECT
            parent.level_id AS parent_level_id,
            parent_level.name AS parent_level_name,
            " . TaxonomyHelper::generatePartialQuery() . "
         LEFT JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
         LEFT JOIN taxonomy_level parent_level ON parent_level.id = parent.level_id
         WHERE tn.taxnode_id = :taxnode_id
            AND tn.is_hidden = 0
            AND tn.is_deleted = 0
         LIMIT 1";

      try {
         // Run the mariadb query.
         $queryResults = $this->connection->query($sql, $parameters);
         $row = $queryResults->fetchAssoc();

         if ($row) {
            
            // Build the Taxon object from the result row.
            $taxon = Taxon::fromArray($row);
            $taxon->process();
            
            // Calculate "memberOf" from the lineage column.
            $taxon->memberOf = $taxon->getMemberOf();

            // Normalize the taxon object.
            $result = $taxon->normalize();
         }
      } 
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger('ictv_web_api')->error($errorMessage);
         return null;
      }

      return $result;
   }
}


