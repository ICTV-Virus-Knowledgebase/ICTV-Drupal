<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Drupal\Core\Database\Connection;
use Drupal\Core\Config\ConfigFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\ictv_common\Utils;


/**
 * Provides a REST Resource to get a comma-delimited list of the taxnode_ids in a taxon's lineage.
 *
 * @RestResource(
 *   id = "get_taxon_lineage_ids",
 *   label = @Translation("Get Taxon Lineage IDs"),
 *   uri_paths = {
 *     "canonical" = "/api/get-taxon-lineage-ids"
 *   }
 * )
 */
class GetTaxonLineageIDs extends ResourceBase {

   // The database connection used by this web service.
   protected Connection $connection;
   
   // The name of the database used by this web service.
   protected ?string $databaseName;


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
      ConfigFactoryInterface $configFactory,
      array $serializer_formats,
      LoggerInterface $logger,
      AccountProxyInterface $currentUser) {

      parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);

      // Access the module's configuration object.
      $config = $configFactory->get('ictv_web_api.settings');

      // Get configuration settings from the ictv_web_api.settings file.
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         return;
      }

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
         $container->get('config.factory'),
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

      // Get the taxon's lineage IDs from the database.
      $lineageIDs = $this->getLineageIDs($taxnodeID);

      $data = [
         "taxnodeID" => $taxnodeID,
         "lineageIDs" => $lineageIDs
      ];

      $response = new ResourceResponse($data);
      $response->addCacheableDependency(array("#cache" => array("max-age" => 0)));
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
    * Get a comma-delimited list of taxnode_ids in a taxon's lineage.
    */
   protected function getLineageIDs(int $taxnodeID): string {

      $sql = "
         SELECT
            IF (RIGHT(lineage_ids, 1) = ',', SUBSTRING(lineage_ids, 1, LENGTH(lineage_ids) - 1), lineage_ids) AS lineage_ids
         FROM (
            SELECT
               tn.taxnode_id,
               CONCAT(
                  CASE WHEN tn.realm_id IS NOT NULL AND tn.level_id > 120 THEN CONCAT(CAST(tn.realm_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subrealm_id IS NOT NULL AND tn.level_id > 130 THEN CONCAT(CAST(tn.subrealm_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.kingdom_id IS NOT NULL AND tn.level_id > 140 THEN CONCAT(CAST(tn.kingdom_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subkingdom_id IS NOT NULL AND tn.level_id > 150 THEN CONCAT(CAST(tn.subkingdom_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.phylum_id IS NOT NULL AND tn.level_id > 160 THEN CONCAT(CAST(tn.phylum_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subphylum_id IS NOT NULL AND tn.level_id > 170 THEN CONCAT(CAST(tn.subphylum_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.class_id IS NOT NULL AND tn.level_id > 180 THEN CONCAT(CAST(tn.class_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subclass_id IS NOT NULL AND tn.level_id >190 THEN CONCAT(CAST(tn.subclass_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.order_id IS NOT NULL AND tn.level_id > 200 THEN CONCAT(CAST(tn.order_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.suborder_id IS NOT NULL AND tn.level_id > 250 THEN CONCAT(CAST(tn.suborder_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.family_id IS NOT NULL AND tn.level_id > 300 THEN CONCAT(CAST(tn.family_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subfamily_id IS NOT NULL AND tn.level_id > 400 THEN CONCAT(CAST(tn.subfamily_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.genus_id IS NOT NULL AND tn.level_id > 500 THEN CONCAT(CAST(tn.genus_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.subgenus_id IS NOT NULL AND tn.level_id > 550 THEN CONCAT(CAST(tn.subgenus_id AS VARCHAR(12)),',') ELSE '' END,
                  CASE WHEN tn.species_id IS NOT NULL AND tn.level_id > 600 THEN CONCAT(CAST(tn.species_id AS VARCHAR(12)),',') ELSE '' END
               ) AS lineage_ids
                  
            FROM taxonomy_node tn
            WHERE tn.taxnode_id = :taxnodeID
            LIMIT 1
         ) lineage ";

      $lineageIDs = "";

      try {
         $result = $this->connection->query($sql, [':taxnodeID' => $taxnodeID])->fetchField();
         $lineageIDs = $result !== FALSE ? $result : "";
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger("ictv_web_api")->error($errorMessage);
      }

      return $lineageIDs;
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