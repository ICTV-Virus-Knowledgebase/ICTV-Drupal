<?php

namespace Drupal\ictv_curated_name_manager\Plugin\Block;

use Drupal\Core\Block\BlockBase;


/**
 * A Block for the ICTV Curated Name Manager UI.
 *
 * @Block(
 *   id = "ictv_curated_name_manager_block",
 *   admin_label = @Translation("ICTV Curated Name Manager block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvCuratedNameManagerBlock extends BlockBase {

   // The JWT auth token for the Drupal web service.
   public $authToken;

   // The current MSL release.
   public $currentMslRelease;

   // The current VMR.
   public $currentVMR;

   // The URL of the Drupal web service.
   public $drupalWebServiceURL;

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Get and validate the current user
      $currentUser = \Drupal::currentUser();
      if (!$currentUser) { 
         \Drupal::logger('ictv_curated_name_manager')->error("Current user is invalid"); 
         throw new HttpException("Current user is invalid");
      }

      // Retrieve additional user details.
      $user = \Drupal\user\Entity\User::load($currentUser->id());

      // Make sure the user has permission to access content.
      // TODO: shouldn't we also make sure they have a specific "proposal submitter" role?
      if (!$user->hasPermission('access content')) { throw new AccessDeniedHttpException(); }

      // Load ICTV settings from the database.
      $this->loadData();

      // Get the current user's email, name, and UID.
      $email = $user->get('mail')->value;
      $name = $user->get('name')->value;
      $userUID = $user->get('uid')->value;

      $build = [
         '#markup' => $this->t("<div id=\"ictv_curated_name_manager_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_curated_name_manager/ICTV_CuratedNameManager',
               ],
               'library' => [
                  'ictv_curated_name_manager/curatedNameManager',
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the VirusNameLookup object.
      $build['#attached']['drupalSettings']['authToken'] = $this->authToken;
      $build['#attached']['drupalSettings']['currentMslRelease'] = $this->currentMslRelease;
      $build['#attached']['drupalSettings']['currentVMR'] = $this->currentVMR;
      $build['#attached']['drupalSettings']['drupalWebServiceURL'] = $this->drupalWebServiceURL;
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


   /**
    * Load the ICTV settings from the database.
    */
   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->authToken = "";
      $this->currentMslRelease = 0;
      $this->currentVMR = "";
      $this->drupalWebServiceURL = "";

      // Get ICTV settings
      $sql = 
         "SELECT 
         (
            SELECT value FROM ictv_settings WHERE NAME = 'authToken' LIMIT 1
         ) AS authToken,
         ( 
            SELECT value FROM ictv_settings WHERE NAME = 'currentMslRelease' LIMIT 1
         ) AS currentMslRelease,
         ( 
            SELECT value FROM ictv_settings WHERE NAME = 'currentVMR' LIMIT 1
         ) AS currentVMR,
         ( 
            SELECT value FROM ictv_settings WHERE NAME = 'drupalWebServiceURL' LIMIT 1
         ) AS drupalWebServiceURL;";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_curated_name_manager')->error("Invalid query object"); }

      $settings = $query->fetchAssoc();
      if (!$settings) { \Drupal::logger('ictv_curated_name_manager')->error("Invalid settings object"); }

      $this->authToken = $settings["authToken"];
      $this->currentMslRelease = $settings["currentMslRelease"];
      $this->currentVMR = $settings["currentVMR"];
      $this->drupalWebServiceURL = $settings["drupalWebServiceURL"];
   }

}