<?php

namespace Drupal\ictv_d3_taxonomy_visualization\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

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

      // Configuration settings
      $settings = null;

      try {
         $settings = new ConfigSettings($database);
      }
      catch (\Throwable $error) {
         
         \Drupal::logger('ictv_d3_taxonomy_visualization')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );

         return [
            '#markup' => $this->t('The ICTV taxonomy visualization is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id='d3_taxonomy_vis_container' class='ictv-custom'>
               <div class='header-panel'>
                  <div class='label'>Release</div>
                  <select class='release-ctrl'></select>
                  <div class='font-size-panel'></div>
                  <div class='search-panel'></div>
                  <label class='paginate-toggle'><input type='checkbox' class='paginate-ctrl' checked='checked' /><span>Paginate Taxa</span></label>
               </div>
               <div class='search-results-panel'></div>
               <div class='body-panel'>
                  <div class='taxonomy-panel'></div>
               </div>
         </div>"),
         '#attached' => [
               'library' => [
                  'ictv_d3_taxonomy_visualization/d3',
                  'ictv_d3_taxonomy_visualization/dataTables.dataTables',
                  'ictv_d3_taxonomy_visualization/popper',
                  'ictv_d3_taxonomy_visualization/select2',
                  'ictv_d3_taxonomy_visualization/tippy',
                  'ictv_d3_taxonomy_visualization/html2canvas',
                  'ictv_d3_taxonomy_visualization/searchPanel',
                  'ictv_d3_taxonomy_visualization/script',
                  'ictv_d3_taxonomy_visualization/d3TaxonomyVisualization'
               ],
         ],
      ];

      // Include the asset path in Drupal settings.
      $build['#attached']['drupalSettings']['assetPath'] = $assetPath;

      // Include the ICTV config settings from the database.
      $build['#attached']['drupalSettings']['currentMslRelease'] = $settings->currentMslRelease;
      $build['#attached']['drupalSettings']['taxonDetailsPage'] = $settings->taxonDetailsPage;
      $build['#attached']['drupalSettings']['webServiceURL'] = $settings->webServiceURL;

      return $build;
   }

}
