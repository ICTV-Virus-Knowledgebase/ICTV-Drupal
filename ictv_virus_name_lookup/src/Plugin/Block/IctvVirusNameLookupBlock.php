<?php

namespace Drupal\ictv_virus_name_lookup\Plugin\Block;

use Drupal\Core\Block\BlockBase;


/**
 * A Block for the ICTV Virus Name Lookup UI.
 *
 * @Block(
 *   id = "ictv_virus_name_lookup_block",
 *   admin_label = @Translation("ICTV Virus Name Lookup block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvVirusNameLookupBlock extends BlockBase {

   // The JWT auth token for the Drupal web service.
   public $authToken;

   // The URL of the Drupal web service.
   public $drupalWebServiceURL;

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Load the authToken and drupalWebServiceURL from the database.
      $this->loadData();

      $build = [
         '#markup' => $this->t("<div id=\"ictv_virus_name_lookup_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_virus_name_lookup/ICTV_VirusNameLookup',
               ],
               'library' => [
                  'ictv_virus_name_lookup/virusNameLookup',
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the ProposalSubmission object.
      $build['#attached']['drupalSettings']['drupalWebServiceURL'] = $this->drupalWebServiceURL;
      
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


   public function loadData() {

      // Use the default database instance.
      $database = \Drupal::database();

      // Initialize the member variables.
      $this->authToken = "";
      $this->drupalWebServiceURL = "";

      // Get the drupalWebServiceURL from the ictv_settings table.
      $sql = 
         "SELECT value AS drupalWebServiceURL ".
         "FROM ictv_settings ".
         "WHERE name = 'drupalWebServiceURL' ".
         "LIMIT 1 ";

      $query = $database->query($sql);
      if (!$query) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid query object"); }

      $result = $query->fetchAll();
      if (!$result) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid result object"); }

      foreach ($result as $setting) {
         $this->drupalWebServiceURL = $setting->drupalWebServiceURL;
      }
      
      /*
      $result = $query->execute();
      if ($result) {
         $this->drupalWebServiceURL = $result->fetchAssoc()["drupalWebServiceURL"];
      } else {
         // TODO: handle error!
      }  */

      /*
      $result = $query->fetchAll();
      if (!$result) { \Drupal::logger('ictv_virus_name_lookup')->error("Invalid result object"); }

      foreach ($result as $setting) {
         $this->drupalWebServiceURL = $setting->drupalWebServiceURL;
      }*/
    }

}