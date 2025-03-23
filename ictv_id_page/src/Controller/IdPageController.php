<?php

namespace Drupal\ictv_id_page\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database;
use Drupal\ictv_id_page\Services\IctvIdService;
use Drupal\ictv_id_page\Models\IctvIdTaxon;
use Drupal\Component\Serialization\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Log\LoggerInterface;
use Drupal\ictv_id_page\Services\MslService;
use Symfony\Component\HttpFoundation\Request;
use Drupal\rest\ResourceResponse;
use Drupal\Serialization;
use Drupal\ictv_common\Utils;


class IdPageController extends ControllerBase {
  
   protected $configFactory;

   // The connection to the ictv_apps database.
   protected ?Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;

   protected $logger;


   /**
    * Constructs a Drupal\Core\Controller\ControllerBase object.
    *
    * @param ConfigFactoryInterface $configFactory
    *   The factory for configuration objects.
    */
   public function __construct(
      ConfigFactoryInterface $configFactory,
      array $serializer_formats,
      LoggerInterface $logger
   ) {

      $this->configFactory = $configFactory;
      $this->logger = $logger;

      $config = $this->configFactory->get('ictv_id_page.settings');
      if ($config == null) { 
         $this->logger->error("Invalid settings");
         return null;
      }
         
      $this->databaseName = $config->get('databaseName');

      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
   }

   /**
    * {@inheritdoc}
    */
   public static function create(ContainerInterface $container) {
      return new static(
         $container->get('config.factory'),
         $container->getParameter('serializer.formats'),
         $container->get('logger.factory')->get('ictv_id_page')
      );
   }


   // Lookup the latest taxon for the ICTV ID provided.
   public function displayICTV($ictv_id) {

      $markup;
      $taxon = null;

      try {
         // Get the latest taxon for this ID.
         $taxon = IctvIdService::getLatestTaxon($this->connection, $ictv_id);
      }
      catch (\Exception $e) {
         \Drupal::logger('ictv_id_page')->error($e->getMessage());
         $ictvID = null;
      }

      if ($taxon == null) {
         $markup = [
            '#markup' => "Unrecognized ICTV ID (".$ictv_id.")"
         ];
      } else {
         $markup = [
            '#markup' => IctvIdService::toHTML($taxon)
         ];
      }

      return $markup;
   }


   // Lookup the MSL Release for this MSL release number.
   public function displayMSL($msl_id) {

      $markup;
      $mslRelease = null;

      try {

         // Get the MSL release for this ID.
         $mslRelease = MslService::getRelease($this->connection, $msl_id);
      }
      catch (\Exception $e) {
         \Drupal::logger('ictv_id_page')->error($e->getMessage());
         $mslRelease = null;
      }

      if ($mslRelease == null) {
         $markup = [
            '#markup' => "Unrecognized MSL release number (".$msl_id.")"
         ];
      } else {
         $markup = [
            '#markup' => MslService::toHTML($mslRelease)
         ];
      }

      return $markup;
   }


   public function displayMSL_ICTV($msl_id, $ictv_id, Request $request) {

      // Build your page here
      $build = [
         '#type' => 'markup',
         '#markup' => $this->t('MSL ID: @msl_id, ICTV ID: @ictv_id', [
         '@msl_id' => $msl_id,
         '@ictv_id' => $ictv_id,
      ]),

         /*
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
         ],*/
      ];
      
      /*return [
         '#markup' => 'Route matched! MSL: ' . ($msl_id ?? 'none') . ', ICTV: ' . $ictv_id,
      ];*/

      return $build;
   }


   public function displayTN($tn_id) {
      return [
         '#markup' => '(TODO) TN: ' . $tn_id,
       ];
   }

   
   public function displayVMR($vmr_id) {
      return [
         '#markup' => '(TODO) VMR: ' . $vmr_id,
       ];
   }

}