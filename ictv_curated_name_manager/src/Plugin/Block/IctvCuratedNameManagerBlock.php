<?php

namespace Drupal\ictv_curated_name_manager\Plugin\Block;

use Drupal\Core\Block\BlockBase;


/**
 * A Block for the ICTV Curated Name Manager UI.
 *
 * @Block(
 *   id = "ictv_curated_name_manager_block",
 *   admin_label = @Translation("ICTV Curated Name Manager block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvCuratedNameManagerBlock extends BlockBase {

   // The current MSL release.
   public $currentMslRelease;

   // The current VMR.
   public $currentVMR;

   // The URL of the Drupal web service.
   public $drupalWebServiceURL;

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Load ICTV settings from the database.
      $this->loadData();

      $build = [
         '#markup' => $this->t("<div id=\"ictv_curated_name_manager_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_curated_name_manager/ICTV_CuratedNameManager',
               ],
               'library' => [
                  'ictv_curated_name_manager/curatedNameManager',
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the VirusNameLookup object.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $this->currentMslRelease;
      $build['#attached']['drupalSettings']['currentVMR'] = $this->currentVMR;
      $build['#attached']['drupalSettings']['drupalWebServiceURL'] = $this->drupalWebServiceURL;
      
      return $build;
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
    * Load the ICTV settings from the database.
    */
   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->currentMslRelease = 0;
      $this->currentVMR = "";
      $this->drupalWebServiceURL = "";

      // Get ICTV settings
      $sql = 
         "SELECT ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'currentMslRelease' LIMIT 1
         ) AS currentMslRelease,
         ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'currentVMR' LIMIT 1
         ) AS currentVMR,
         ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'drupalWebServiceURL' LIMIT 1
         ) AS drupalWebServiceURL;";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_curated_name_manager')->error("Invalid query object"); }

      $settings = $query->fetchAssoc();
      if (!$settings) { \Drupal::logger('ictv_curated_name_manager')->error("Invalid settings object"); }

      $this->currentMslRelease = $settings["currentMslRelease"];
      $this->currentVMR = $settings["currentVMR"];
      $this->drupalWebServiceURL = $settings["drupalWebServiceURL"];
   }

}