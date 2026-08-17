<?php

namespace Drupal\ictv_config;

use Drupal\Core\Database\Connection;
use Drupal\ictv_common\Utils;


class ConfigSettings {

   // The website URL
   public string $applicationURL;

   // The base URL for web services.
   public string $baseWebServiceURL;

   // The current Master Species List (MSL) release number.
   public int $currentMslRelease;

   // The current virus metadata resource (VMR) identifier.
   public string $currentVMR;

   // ???
   public string $drupalWebServiceURL;

   // The location of release proposal files.
   public string $releaseProposalsURL;

   // The taxon details page URL.
   public string $taxonHistoryPage;


   /**
    * Create a new ConfigSettings instance.
    */
   public function __construct() {

      $database = \Drupal::database();

      // Get all ICTV settings as a single result.
      $query = $database->query(
         "SELECT
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'applicationURL'
            LIMIT 1
         ) AS applicationURL,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'baseWebServiceURL'
            LIMIT 1
         ) AS baseWebServiceURL,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'currentMslRelease'
            LIMIT 1
         ) AS currentMslRelease,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'currentVMR'
            LIMIT 1
         ) AS currentVMR,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'releaseProposalsURL'
            LIMIT 1
         ) AS releaseProposalsURL,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'taxonHistoryPage'
            LIMIT 1
         ) AS taxonHistoryPage ");

      $result = $query->fetch();
      if (!$result) { throw new \Exception("Failed to fetch ICTV settings from the database"); }
      
      $this->applicationURL = $result->applicationURL;
      if (Utils::isNullOrEmpty($this->applicationURL)) { throw new \Exception("Invalid applicationURL config setting"); }

      $this->baseWebServiceURL = $result->baseWebServiceURL;
      if (Utils::isNullOrEmpty($this->baseWebServiceURL)) { throw new \Exception("Invalid baseWebServiceURL config setting"); }

      if (!is_numeric($result->currentMslRelease)) { throw new \Exception("Invalid currentMslRelease config setting"); }
      $this->currentMslRelease = intval($result->currentMslRelease);

      $this->currentVMR = $result->currentVMR;
      if (Utils::isNullOrEmpty($this->currentVMR)) { throw new \Exception("Invalid currentVMR config setting"); }

      $this->releaseProposalsURL = $result->releaseProposalsURL;
      if (Utils::isNullOrEmpty($this->releaseProposalsURL)) { throw new \Exception("Invalid releaseProposalsURL config setting"); }

      $this->taxonHistoryPage = $result->taxonHistoryPage;
      if (Utils::isNullOrEmpty($this->taxonHistoryPage)) { throw new \Exception("Invalid taxonHistoryPage config setting"); }
   }
}  
