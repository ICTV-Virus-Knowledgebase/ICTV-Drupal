<?php

namespace Drupal\ictv_taxonomy_browser\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

/**
 * Provides a test Block.
 *
 * @Block(
 *   id = "ictv_taxonomy_browser_block",
 *   admin_label = @Translation("ICTV Taxonomy Browser"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvTaxonomyBrowserBlock extends BlockBase {

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
         \Drupal::logger('ictv_taxonomy_browser')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );
         return [
            '#markup' => $this->t('The taxonomy browser is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id='taxonomy_browser_container' class='ictv-custom'></div>"),
         '#attached' => [
               'library' => [
                  'ictv_taxonomy_browser/ICTV_TaxonomyBrowser',
                  'ictv_taxonomy_browser/taxonomyBrowser'
               ],
         ],
      ];

      // Populate drupalSettings with the ICTV settings from the database.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $settings->currentMslRelease;
      $build['#attached']['drupalSettings']['releaseProposalsURL'] = $settings->releaseProposalsURL;
      $build['#attached']['drupalSettings']['taxonDetailsPage'] = $settings->taxonDetailsPage;
      $build['#attached']['drupalSettings']['webServiceURL'] = $settings->webServiceURL;
      
      return $build;
   }

}