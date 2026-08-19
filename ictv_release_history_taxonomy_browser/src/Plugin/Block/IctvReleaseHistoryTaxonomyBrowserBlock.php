<?php

namespace Drupal\ictv_release_history_taxonomy_browser\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

/**
 * A custom block to display the MSL Release History and a Taxonomy Browser.
 *
 * @Block(
 *   id = "ictv_release_history_taxonomy_browser_block",
 *   admin_label = @Translation("ICTV Release History Taxonomy Browser"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvReleaseHistoryTaxonomyBrowserBlock extends BlockBase {

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
         
         \Drupal::logger('ictv_release_history_taxonomy_browser')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );

         return [
            '#markup' => $this->t('The ICTV release history taxonomy browser is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id='taxonomy_browser_container' class='ictv-custom'></div>"),
         '#attached' => [
               'library' => [
                  'ictv_release_history_taxonomy_browser/ICTV_TaxonomyBrowser',
                  'ictv_release_history_taxonomy_browser/releaseHistoryTaxonomyBrowser'
               ],
         ],
      ];

      // Populate drupalSettings with the ICTV settings from the database.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $settings->currentMslRelease;
      $build['#attached']['drupalSettings']['taxonDetailsPage'] = $settings->taxonDetailsPage;
      $build['#attached']['drupalSettings']['webServiceURL'] = $settings->webServiceURL;
      
      return $build;
   }

}