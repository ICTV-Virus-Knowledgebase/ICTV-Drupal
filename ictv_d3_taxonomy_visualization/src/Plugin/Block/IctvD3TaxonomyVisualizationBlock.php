<?php

namespace Drupal\ictv_d3_taxonomy_visualization\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 
 * @Block(
 *   id = "ictv_d3_taxonomy_visualization_block",
 *   admin_label = @Translation("ICTV D3 Taxonomy Visualization block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvD3TaxonomyVisualizationBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {

    // Use the module path to create a path for the module's asset directory.
    //$testModulePath = \Drupal::service('extension.list.module')->getPath('ictv_d3_taxonomy_visualization');
    //\Drupal::logger('ictv_d3_taxonomy_visualization')->info("test module path = ".$testModulePath);
    //$assetPath = $modulePath."/assets";

    // dmd 030223 the code above doesn't work in prod, so we use this hard-coded version.
    $assetPath = "/modules/custom/ictv_d3_taxonomy_visualization/assets";

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

    // Store the results in local variables.
    $applicationURL = $result[0]->applicationURL;
    $baseWebServiceURL = $result[0]->baseWebServiceURL;
    $currentMslRelease = $result[0]->currentMslRelease;
    $releaseProposalsURL = $result[0]->releaseProposalsURL;
    $taxonHistoryPage = $result[0]->taxonHistoryPage;

    $build = [
        '#markup' => $this->t("<div id='d3_taxonomy_vis_container' class='ictv-custom'>
            <div class='header-panel'>
                <div class='label'>Release</div>
                <select class='release-ctrl'></select>
                <div class='font-size-panel'></div>
                <div class='search-panel'></div>
            </div>
            <div class='search-results-panel'></div>
            <div class='body-panel'>
                <div class='taxonomy-panel'></div>
                <div class='species-panel light-bg'>
                    <div class='parent-name'></div>
                    <div class='species-list'></div>
                </div>
            </div>
        </div>"),
        '#attached' => [
            'library' => [
               'ictv_d3_taxonomy_visualization/d3',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/jquery.dataTables',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/popper',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/select2',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/tippy',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/html2canvas',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/searchPanel',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/script',
            ],
            'library' => [
               'ictv_d3_taxonomy_visualization/d3TaxonomyVisualization',
            ],
        ],
    ];

    // Include the asset path in Drupal settings.
    $build['#attached']['drupalSettings']['assetPath'] = $assetPath;

    // Include the ICTV config settings from the database.
    $build['#attached']['drupalSettings']['applicationURL'] = $applicationURL;
    $build['#attached']['drupalSettings']['baseWebServiceURL'] = $baseWebServiceURL;
    $build['#attached']['drupalSettings']['currentMslRelease'] = $currentMslRelease;
    $build['#attached']['drupalSettings']['releaseProposalsURL'] = $releaseProposalsURL;
    $build['#attached']['drupalSettings']['taxonHistoryPage'] = $taxonHistoryPage;
    
    return $build;
  }

}