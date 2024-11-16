<?php

namespace Drupal\ictv_virus_name_lookup\Plugin\Block;

use Drupal\Core\Block\BlockBase;


/**
 * A Block for the ICTV Virus Name Lookup UI.
 *
 * @Block(
 *   id = "ictv_virus_name_lookup_block",
 *   admin_label = @Translation("ICTV Virus Name Lookup block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvVirusNameLookupBlock extends BlockBase {

   // The current MSL release.
   public $currentMslRelease;

   // The URL of the Drupal web service.
   public $drupalWebServiceURL;

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Load ICTV settings from the database.
      $this->loadData();

      $build = [
         '#markup' => $this->t("<div id=\"ictv_virus_name_lookup_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_virus_name_lookup/ICTV_VirusNameLookup',
               ],
               'library' => [
                  'ictv_virus_name_lookup/virusNameLookup',
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the VirusNameLookup object.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $this->currentMslRelease;
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


   /*
   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->authToken = "";
      $this->drupalWebServiceURL = "";

      // Get the drupalWebServiceURL from the ictv_settings table.
      $sql = 
         "SELECT value AS drupalWebServiceURL ".
         "FROM ictv_settings ".
         "WHERE name = 'drupalWebServiceURL' ".
         "LIMIT 1 ";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid query object"); }

      $result = $query->fetchAll();
      if (!$result) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid result object"); }

      foreach ($result as $setting) {
         $this->drupalWebServiceURL = $setting->drupalWebServiceURL;
      }
    }*/

    /**
    * Load the ICTV settings from the database.
    */
   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->currentMslRelease = 0;
      $this->drupalWebServiceURL = "";

      // Get ICTV settings
      $sql = 
         "SELECT ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'currentMslRelease' LIMIT 1
         ) AS currentMslRelease,
         ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'drupalWebServiceURL' LIMIT 1
         ) AS drupalWebServiceURL;";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid query object"); }

      $settings = $query->fetchAssoc();
      if (!$settings) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid settings object"); }

      $this->currentMslRelease = $settings["currentMslRelease"];
      $this->drupalWebServiceURL = $settings["drupalWebServiceURL"];
   }

}