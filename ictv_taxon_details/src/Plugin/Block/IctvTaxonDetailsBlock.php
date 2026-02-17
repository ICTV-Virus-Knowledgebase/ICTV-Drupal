<?php

namespace Drupal\ictv_taxon_details\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_taxon_details\Plugin\Block\ConfigSettings;

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

      $settings = new ConfigSettings();

      $build = [
         '#markup' => $this->t("<div id='taxon_details_container' class='ictv-custom'></div>"),
         '#attached' => [
            'library' => [
               'ictv_taxon_details/ICTV_TaxonDetails',
            ],
            'library' => [
               'ictv_taxon_details/taxonDetails',
            ],
         ],
      ];

      // Populate drupalSettings with the ICTV settings from the database.
      $build['#attached']['drupalSettings']['applicationURL'] = $settings->applicationURL;
      $build['#attached']['drupalSettings']['baseWebServiceURL'] = $settings->baseWebServiceURL;
      $build['#attached']['drupalSettings']['currentMslRelease'] = $settings->currentMslRelease;
      $build['#attached']['drupalSettings']['releaseProposalsURL'] = $settings->releaseProposalsURL;
      $build['#attached']['drupalSettings']['taxonHistoryPage'] = $settings->taxonHistoryPage;
      
      return $build;
   }

}