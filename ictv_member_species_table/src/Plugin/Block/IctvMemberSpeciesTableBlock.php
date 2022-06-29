<?php

namespace Drupal\ictv_member_species_table\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * A Block for the ICTV member species table.
 *
 * @Block(
 *   id = "ictv_member_species_table_block",
 *   admin_label = @Translation("ICTV Member Species Table block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvMemberSpeciesTableBlock extends BlockBase {

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

    // TODO: validate result!
    $applicationURL = $result[0]->applicationURL;
    $baseWebServiceURL = $result[0]->baseWebServiceURL;
    $currentMslRelease = $result[0]->currentMslRelease;
    $releaseProposalsURL = $result[0]->releaseProposalsURL;
    $taxonHistoryPage = $result[0]->taxonHistoryPage;

    $build = [
        '#markup' => $this->t("<div id='member_species_table_container' class='ictv-custom'></div>"),
        '#attached' => [
            'library' => [
                'ictv_member_species_table/ICTV',
            ],
            'library' => [
              'ictv_member_species_table/memberSpeciesTable',
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