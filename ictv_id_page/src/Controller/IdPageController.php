<?php

namespace Drupal\ictv_id_page\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Drupal\ictv_common\Utils;


class IdPageController extends ControllerBase {
  
   protected $configFactory;

   // The connection to the ictv_apps database.
   protected ?Connection $connection;

   // The name of the database used by this web service.
   protected ?string $databaseName;


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


   public function displayICTV($ictv_id) {
      return [
         '#markup' => 'Route matched! ICTV: ' . $ictv_id,
       ];
   }

   public function displayMSL($msl_id) {

      // Initialize the database connection and other settings.
      //$this->initialize(); 

      /*
      // Get configuration settings from the ictv_id_page.settings file.
      $config = $this->configFactory->get('ictv_id_page.settings');
      if ($config == null) { 
         \Drupal::logger('ictv_id_page')->error("Config is null"); 
      } else {
         \Drupal::logger('ictv_id_page')->info("Config is NOT null");
      }*/

      //\Drupal::logger('ictv_id_page')->info("After getting ictv_id_page.settings");

      /*
      try {
         // Get the database name.
         $this->databaseName = $config->get("databaseName");
         if (Utils::isNullOrEmpty($this->databaseName)) { throw new \Exception("The databaseName setting is empty"); }
      }
      catch (\Exception $e) {
         \Drupal::logger('ictv_id_page')->error($e->getMessage());
         return null;
      }*/

      return [
        '#markup' => 'Route matched! MSL: '.$msl_id,
      ];
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
         '#markup' => 'Route matched! TN: ' . $tn_id,
       ];
   }

   public function displayVMR($vmr_id) {
      return [
         '#markup' => 'Route matched! VMR: ' . $vmr_id,
       ];
   }


   /*
   public function initialize() {


      

      
      
      // Get a database connection.
      $this->connection = \Drupal\Core\Database\Database::getConnection("default", $this->databaseName);
   }*/
}