<?php

namespace Drupal\ictv_web_api\helpers;

use Drupal\Core\Database\Connection;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonAndRelease;


class TaxonHistory {

  /**
   * Call the (single‐result) stored procedure `GetTaxonHistory`
   *
   * @param Connection $connection
   * 
   * The current MSL release number.
   * @param int $currentMSL
   * 
   * The ICTV ID (optional)
   * @param int|null $ictvID
   * 
   * The MSL associated with the ICTV ID parameter (optional).
   * @param int|null $MSL
   * 
   * The taxnode ID (optional)
   * @param int|null $taxNodeID
   * 
   * The taxon name (optional)
   * @param string|null $taxonName
   * 
   * The VMR / isolate ID (optional)
   * @param int|null $vmrID
   *
   * @return array{
   *   messages: string,
   *   results: array
   * }
   */
   public static function fetch(Connection $connection, int $currentMSL, ?int $ictvID, ?int $MSL, ?int $taxNodeID, ?string $taxonName, ?int $vmrID): array {

      $messages = '';
      $results = [];

      // Call the stored procedure
      $sql = 'CALL GetTaxonHistory(:currentMSL, :ictvID, :MSL, :taxNodeID, :taxonName, :vmrID)';
      $params = [
         ":currentMSL"  => $currentMSL,
         ":ictvID"      => $ictvID,
         ":MSL"         => $MSL,
         ":taxNodeID"   => $taxNodeID,
         ":taxonName"   => $taxonName,
         ":vmrID"       => $vmrID
      ];

      try {
         $rows = $connection->query($sql, $params)->fetchAll(\PDO::FETCH_ASSOC);
      }
      catch (\Exception $e) {
         return [
            "messages" => $e->getMessage(),
            "results" => []
         ];
      }

      foreach ($rows as $r) {
         $results.push(TaxonAndRelease::fromArray($r)->normalize());
      }

      return [
         "messages" => $messages,
         "results" => $results
      ];
   }
}







