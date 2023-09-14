<?php

namespace Drupal\ictv_taxonomy_browser\Plugin\Block;

use Drupal\Core\Block\BlockBase;

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

    // Get all ictv_settings
    // TODO: centralize this code somewhere else!
    $query = $database->query("SELECT
        (
            SELECT value
            FROM ictv_settings
            WHERE name = 'applicationURL'
            LIMIT 1
        ) AS applicationURL,
        (
            SELECT value
            FROM ictv_settings
            WHERE name = 'baseWebServiceURL'
            LIMIT 1
        ) AS baseWebServiceURL,
        (
            SELECT value
            FROM ictv_settings
            WHERE name = 'currentMslRelease'
            LIMIT 1
        ) AS currentMslRelease,
        (
            SELECT value
            FROM ictv_settings
            WHERE name = 'releaseProposalsURL'
            LIMIT 1
        ) AS releaseProposalsURL,
        (
            SELECT value
            FROM ictv_settings
            WHERE name = 'taxonHistoryPage'
            LIMIT 1
        ) AS taxonHistoryPage");

    $result = $query->fetchAll();

    // TODO: validate result!
    $applicationURL = $result[0]->applicationURL;
    $baseWebServiceURL = $result[0]->baseWebServiceURL;
    $currentMslRelease = $result[0]->currentMslRelease;
    $releaseProposalsURL = $result[0]->releaseProposalsURL;
    $taxonHistoryPage = $result[0]->taxonHistoryPage;

    $build = [
        '#markup' => $this->t("<div id='taxonomy_browser_container' class='ictv-custom'></div>"),
        '#attached' => [
            'library' => [
                'ictv_taxonomy_browser/ICTV',
            ],
            'library' => [
              'ictv_taxonomy_browser/taxonomyBrowser',
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