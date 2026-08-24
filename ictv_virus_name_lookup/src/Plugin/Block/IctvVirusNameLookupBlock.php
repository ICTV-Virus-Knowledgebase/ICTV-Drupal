<?php

namespace Drupal\ictv_virus_name_lookup\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

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

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Configuration settings
      $settings = null;

      try {
         // Get the ICTV configuration settings from the database.
         $settings = new ConfigSettings($database);
      }
      catch (\Throwable $error) {
         \Drupal::logger('ictv_virus_name_lookup')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );
         return [
            '#markup' => $this->t('The Find the Species page is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id=\"ictv_virus_name_lookup_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_virus_name_lookup/ICTV_FindTheSpecies',
                  'ictv_virus_name_lookup/findTheSpecies'
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the Find the Species object.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $settings->currentMslRelease;
      $build['#attached']['drupalSettings']['currentVMR'] = $settings->currentVMR;
      $build['#attached']['drupalSettings']['taxonDetailsPage'] = $settings->taxonDetailsPage;
      $build['#attached']['drupalSettings']['webServiceURL'] = $settings->webServiceURL;
      
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
}