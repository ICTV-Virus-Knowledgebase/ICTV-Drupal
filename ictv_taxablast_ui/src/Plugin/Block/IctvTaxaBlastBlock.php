<?php

namespace Drupal\ictv_taxablast_ui\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Symfony\Component\Yaml\Yaml;


/**
 * A Block for the ICTV TaxaBLAST form.
 *
 * @Block(
 *   id = "ictv_taxablast_ui_block",
 *   admin_label = @Translation("ICTV TaxaBLAST UI block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvTaxaBlastBlock extends BlockBase {

   // The JWT auth token for the Drupal web service.
   public $authToken;

   // The URL of the Drupal web service.
   public $drupalWebServiceURL;

   // The name of the taxon details/history page.
   public $taxonHistoryPage;


   /**
    * {@inheritdoc}
    */
   public function build() {

      // Get and validate the current user
      $currentUser = \Drupal::currentUser();
      if (!$currentUser) { 
         \Drupal::logger('ictv_taxablast_ui')->error("Current user is invalid"); 
         throw new HttpException("Current user is invalid");
      }

      // Retrieve additional user details.
      $user = \Drupal\user\Entity\User::load($currentUser->id());

      // Make sure the user has permission to access content.
      if (!$user->hasPermission('access content')) { throw new AccessDeniedHttpException(); }

      // Load the authToken and drupalWebServiceURL from the database.
      $this->loadData();

      // Get the current user's email, name, and UID.
      $email = $user->get('mail')->value;
      $name = $user->get('name')->value;
      $userUID = $user->get('uid')->value;

      $build = [
         '#markup' => $this->t("<div id=\"ictv_taxablast_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_taxablast_ui/ICTV_TaxaBLAST',
               ],
               'library' => [
                  'ictv_taxablast_ui/taxaBLAST',
               ],
         ],
      ];

      // Get info icon JSON from the info-icons YAML file.
      $infoIcons = $this->loadInfoIcons();

      // Populate drupalSettings with variables needed by the ICTV_TaxaBLAST object.
      $build['#attached']['drupalSettings']['authToken'] = $this->authToken;
      $build['#attached']['drupalSettings']['drupalWebServiceURL'] = $this->drupalWebServiceURL;
      $build['#attached']['drupalSettings']['infoIcons'] = $infoIcons;
      $build['#attached']['drupalSettings']['taxonHistoryPage'] = $this->taxonHistoryPage;
      $build['#attached']['drupalSettings']['userEmail'] = $email;
      $build['#attached']['drupalSettings']['userName'] = $name;
      $build['#attached']['drupalSettings']['userUID'] = $userUID;
      
      return $build;
   }


   /**
    * {@inheritdoc}
    * 
    * Prevent this block from being cached.
    */
   public function getCacheMaxAge() {
      return 2;
   }

   public function loadInfoIcons() {

      $json = "";

      try {

         /** 
          * @var \Drupal\Core\Extension\ModuleHandlerInterface $module_handler 
         */
         $module_handler = \Drupal::service('module_handler');

         // Get the module's full path and include the YAML file name. Then make sure the YAML file exists.
         $path = $module_handler->getModule("ictv_taxablast_ui")->getPath();
         $file_path = DRUPAL_ROOT.DIRECTORY_SEPARATOR.$path.DIRECTORY_SEPARATOR."info-icons.yml";
         if (!file_exists($file_path)) {
            return "";
         }

         // Load the contents of the file, parse it as YAML, and then encode as JSON.
         $yaml_text = file_get_contents($file_path);
         $data = Yaml::parse($yaml_text);
         $json = json_encode($data);

      } catch (\Throwable $e) {
         
         // Get the error message and add it to Drupal's error log.
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger("ictv_taxablast_ui")->error($errorMessage);
      }

      return $json;
   }

   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->authToken = "";
      $this->drupalWebServiceURL = "";

      // Get authToken and drupalWebServiceURL from the ictv_settings table.
      $sql = 
         "SELECT (".
         "  SELECT a.value ".
         "  FROM {ictv_settings} a ".
         "  WHERE a.name = 'authToken' ".
         "  LIMIT 1 ".
         ") AS authToken, ".
         "(".
         "  SELECT d.value ".
         "  FROM {ictv_settings} d ".
         "  WHERE d.name = 'drupalWebServiceURL' ".
         "  LIMIT 1 ".
         ") AS drupalWebServiceURL, ".
         "(".
         "  SELECT t.value ".
         "  FROM {ictv_settings} t ".
         "  WHERE t.name = 'taxonHistoryPage' ".
         "  LIMIT 1 ".
         ") AS taxonHistoryPage ";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_taxablast_ui')->error("Invalid query object"); }

      $result = $query->fetchAll();
      if (!$result) { \Drupal::logger('ictv_taxablast_ui')->error("Invalid result object"); }

      foreach ($result as $setting) {

         // Populate member variables
         $this->authToken = $setting->authToken;
         $this->drupalWebServiceURL = $setting->drupalWebServiceURL;
         $this->taxonHistoryPage = $setting->taxonHistoryPage;
      }

      // TODO: validate?
   }

}