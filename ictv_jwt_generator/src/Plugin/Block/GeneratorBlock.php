<?php

namespace Drupal\ictv_jwt_generator\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "ictv_jwt_generator_block",
 *   admin_label = @Translation("ICTV JWT Generator block"),
 *   category = @Translation("ICTV")
 * )
 */
class GeneratorBlock extends BlockBase {
  /**
   * {@inheritdoc}
   */
    public function build() {
        $form = \Drupal::formBuilder()->getForm('Drupal\ictv_jwt_generator\Form\GeneratorForm');
        return $form;
    }
    
}