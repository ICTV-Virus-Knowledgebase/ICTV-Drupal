<?php

namespace Drupal\ictv_find_the_species_component\Plugin\Block;

use Drupal\Core\Block\BlockBase;


/**
 * A Block for the stand-alone ICTV Find the Species UI component.
 *
 * @Block(
 *   id = "ictv_find_the_species_component_block",
 *   admin_label = @Translation("ICTV Find the Species component block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvFindTheSpeciesComponentBlock extends BlockBase {

   // The application URL.
   public $applicationURL;


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
                  'ictv_find_the_species_component/ICTV_VirusNameLookup',
               ],
               'library' => [
                  'ictv_find_the_species_component/findTheSpeciesComponent',
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the VirusNameLookup object to create this component.
      $build['#attached']['drupalSettings']['applicationURL'] = $this->applicationURL;
      
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

      // Initialize the member variable.
      $this->applicationURL = "";

      // Get ICTV settings
      $sql = 
         "SELECT ( 
            SELECT VALUE FROM ictv_settings WHERE NAME = 'applicationURL' LIMIT 1
         ) AS applicationURL;";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_find_the_species_component')->error("Invalid query object"); }

      $settings = $query->fetchAssoc();
      if (!$settings) { \Drupal::logger('ictv_find_the_species_component')->error("Invalid settings object"); }

      $this->applicationURL = $settings["applicationURL"];
   }
}