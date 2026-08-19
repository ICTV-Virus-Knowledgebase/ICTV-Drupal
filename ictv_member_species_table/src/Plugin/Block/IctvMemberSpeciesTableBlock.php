<?php

namespace Drupal\ictv_member_species_table\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\ictv_config\ConfigSettings;

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

      // Configuration settings
      $settings = null;

      try {
         // Get the ICTV configuration settings from the database.
         $settings = new ConfigSettings($database);
      }
      catch (\Throwable $error) {
         \Drupal::logger('ictv_member_species_table')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );
         return [
            '#markup' => $this->t('The virus isolates table is unavailable because configuration settings are invalid.'),
         ];
      }

      $build = [
         '#markup' => $this->t("<div id='member_species_table_container' class='ictv-custom'></div>"),
         '#attached' => [
            'library' => [
               'ictv_member_species_table/ICTV_MemberSpeciesTable',
               'ictv_member_species_table/memberSpeciesTable'
            ],
         ],
      ];

      
      // Populate drupalSettings with the ICTV settings from the database.
      $build['#attached']['drupalSettings']['webServiceURL'] = $settings->webServiceURL;
      
      return $build;
   }

}