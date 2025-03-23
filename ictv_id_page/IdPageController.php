<?php

namespace Drupal\ictv_id_page\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;


class IdPageController extends ControllerBase {
  

   public function content($msl_id, $ictv_id, Request $request) {
      
      // Build your page here
      $build = [
         '#type' => 'markup',
         '#markup' => $this->t('MSL ID: @msl_id, ICTV ID: @ictv_id', [
         '@msl_id' => $msl_id,
         '@ictv_id' => $ictv_id,
         ]),

         // Attach your custom block or JavaScript
         '#attached' => [
            'library' => [
               'mymodule/custom-js',
            ],
            'drupalSettings' => [
               'mymodule' => [
                  'mslId' => $msl_id,
                  'ictvId' => $ictv_id,
               ],
            ],
         ],
      ];
      
      return $build;
   }
}