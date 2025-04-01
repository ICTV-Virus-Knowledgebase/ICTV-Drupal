<?php

namespace Drupal\ictv_taxon_history\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 
 * @Block(
 *   id = "ictv_taxon_history_block",
 *   admin_label = @Translation("ICTV Taxon History block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvTaxonHistoryBlock extends BlockBase {

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Get all ictv_settings
      // TODO: centralize this code somewhere else!
      $query = $database->query("SELECT
         (
            SELECT ictv_settings.value
            FROM {ictv_settings}
            WHERE ictv_settings.name = 'applicationURL'
         ) AS applicationURL,
         (
            SELECT ictv_settings.value
            FROM {ictv_settings}
            WHERE ictv_settings.name = 'baseWebServiceURL'
         ) AS baseWebServiceURL,
         (
            SELECT ictv_settings.value
            FROM {ictv_settings}
            WHERE ictv_settings.name = 'currentMslRelease'
         ) AS currentMslRelease,
         (
            SELECT ictv_settings.value
            FROM {ictv_settings}
            WHERE ictv_settings.name = 'releaseProposalsURL'
         ) AS releaseProposalsURL,
         (
            SELECT ictv_settings.value
            FROM {ictv_settings}
            WHERE ictv_settings.name = 'taxonHistoryPage'
         ) AS taxonHistoryPage ");

      $result = $query->fetchAll();

      // TODO: validate results!
      $applicationURL = $result[0]->applicationURL;
      $baseWebServiceURL = $result[0]->baseWebServiceURL;
      $currentMslRelease = $result[0]->currentMslRelease;
      $releaseProposalsURL = $result[0]->releaseProposalsURL;
      $taxonHistoryPage = $result[0]->taxonHistoryPage;

      $build = [
         '#markup' => $this->t("<div id='taxon_history_container' class='ictv-custom'></div>"),
         '#attached' => [
            'library' => [
                  'ictv_taxon_history/ICTV_TaxonReleaseHistory',
            ],
            'library' => [
               'ictv_taxon_history/taxonHistory',
            ],
         ],
      ];

      // Populate drupalSettings with the ICTV settings from the database.
      $build['#attached']['drupalSettings']['applicationURL'] = $applicationURL;
      $build['#attached']['drupalSettings']['baseWebServiceURL'] = $baseWebServiceURL;
      $build['#attached']['drupalSettings']['currentMslRelease'] = $currentMslRelease;
      $build['#attached']['drupalSettings']['releaseProposalsURL'] = $releaseProposalsURL;
      $build['#attached']['drupalSettings']['taxonHistoryPage'] = $taxonHistoryPage;
      
      return $build;
   }

}