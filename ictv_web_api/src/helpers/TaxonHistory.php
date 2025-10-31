<?php

namespace Drupal\ictv_web_api\helpers;

use Drupal\Core\Database\Connection;
use Drupal\ictv_web_api\Plugin\rest\resource\models\HistoricalRelease;
use Drupal\ictv_web_api\Plugin\rest\resource\models\HistoricalTaxon;


class TaxonHistory {

  /**
   * Call the (single result set) stored procedure `GetTaxonHistory`
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
   *   releases: array<HistoricalRelease>,
   *   taxa: array<HistoricalTaxon>
   * }
   */
   public static function fetch(Connection $connection, int $currentMSL, ?int $ictvID, ?int $MSL, ?int $taxNodeID, ?string $taxonName, ?int $vmrID): array {

      $messages = null;
      $releases = [];
      $taxa = [];

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
            "releases" => [],
            "taxa"     => []
         ];
      }

      $previousYear = NULL;

      // selectedTaxon is the taxNodeID that the SP got
      // $selectedTaxon = NULL;

      foreach ($rows as $r) {

         // Add the taxon to the taxa array.
         array_push($taxa, HistoricalTaxon::fromArray($r)->normalize());

         // If this is a release we haven't encountered, add it to the release array.
         if ($r['release_year'] != $previousYear) {
            array_push($releases, HistoricalRelease::fromArray($r)->normalize());
            $previousYear = $r['release_year'];
         }
      }

      return [
         "messages"        => $messages,
         "releases"        => $releases,
         "taxa"            => $taxa
      ];
   }
}
