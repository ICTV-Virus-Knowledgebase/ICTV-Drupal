<?php

namespace Drupal\ictv_config;

use Drupal\Core\Database\Connection;
use Drupal\ictv_common\Utils;


class ConfigSettings {

   // The URL for the ICTV web services on the app server.
   public string $appServerURL;

   // The JWT auth token for the app server web services.
   public string $authToken;

   // The current Master Species List (MSL) release number.
   public int $currentMslRelease;

   // The current virus metadata resource (VMR) identifier.
   public string $currentVMR;

   // The location of release proposal files.
   public string $releaseProposalsURL;

   // The taxon details page URL.
   public string $taxonDetailsPage;

   // The base URL for web services.
   public string $webServiceURL;


   public Connection $dbConnection;


   /**
    * Create a new ConfigSettings instance.
    */
   public function __construct(Connection $dbConnection_) {

      $this->dbConnection = $dbConnection_;

      // Get all ICTV settings as a single result.
      $query = $this->dbConnection->query(
         "SELECT
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'appServerURL'
            LIMIT 1
         ) AS appServerURL,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'authToken'
            LIMIT 1
         ) AS authToken,
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
            WHERE name = 'taxonDetailsPage'
            LIMIT 1
         ) AS taxonDetailsPage,
         (
            SELECT value
            FROM ictv_settings
            WHERE name = 'webServiceURL'
            LIMIT 1
         ) AS webServiceURL ");

      $result = $query->fetch();
      if (!$result) { throw new \Exception("Failed to fetch ICTV configuration settings from the database"); }
      
      $this->appServerURL = $result->appServerURL;
      if (Utils::isNullOrEmpty($this->appServerURL)) { throw new \Exception("Invalid appServerURL config setting"); }

      $this->authToken = $result->authToken;
      if (Utils::isNullOrEmpty($this->authToken)) { throw new \Exception("Invalid authToken config setting"); }

      if (!is_numeric($result->currentMslRelease)) { throw new \Exception("Invalid currentMslRelease config setting"); }
      $this->currentMslRelease = intval($result->currentMslRelease);

      $this->currentVMR = $result->currentVMR;
      if (Utils::isNullOrEmpty($this->currentVMR)) { throw new \Exception("Invalid currentVMR config setting"); }

      $this->releaseProposalsURL = $result->releaseProposalsURL;
      if (Utils::isNullOrEmpty($this->releaseProposalsURL)) { throw new \Exception("Invalid releaseProposalsURL config setting"); }

      $this->taxonDetailsPage = $result->taxonDetailsPage;
      if (Utils::isNullOrEmpty($this->taxonDetailsPage)) { throw new \Exception("Invalid taxonDetailsPage config setting"); }

      $this->webServiceURL = $result->webServiceURL;
      if (Utils::isNullOrEmpty($this->webServiceURL)) { throw new \Exception("Invalid webServiceURL config setting"); }
   }
}  
