<?php

namespace Drupal\ictv_taxon_details\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

/**
 * 
 * @Block(
 *   id = "ictv_taxon_details_block",
 *   admin_label = @Translation("ICTV Taxon Details block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvTaxonDetailsBlock extends BlockBase {

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
         \Drupal::logger('ictv_taxon_details')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );
         return [
            '#markup' => $this->t('The taxon details page is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id='taxon_details_container' class='ictv-custom'></div>"),
         '#attached' => [
            'library' => [
               'ictv_taxon_details/ICTV_TaxonDetails',
               'ictv_taxon_details/taxonDetails'
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