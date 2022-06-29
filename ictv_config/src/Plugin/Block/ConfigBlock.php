<?php

namespace Drupal\ictv_config\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "ictv_config_block",
 *   admin_label = @Translation("ICTV Configuration block"),
 *   category = @Translation("ICTV")
 * )
 */
class ConfigBlock extends BlockBase {
  /**
   * {@inheritdoc}
   */
    public function build() {
        $form = \Drupal::formBuilder()->getForm('Drupal\ictv_config\Form\ConfigForm');
        return $form;
    }
    
}