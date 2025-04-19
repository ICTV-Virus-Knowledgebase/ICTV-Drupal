<?php

namespace Drupal\ictv_web_api\helpers;

use Drupal\Core\Database\Connection;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryDetail;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryRelease;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryTaxon;
use Exception;


class TaxonReleaseHistory {

  /**
   * Call the SQL Server proc `getTaxonReleaseHistory` and slice its 3 resultsets.
   *
   * @return array{
   *   details: array,
   *   messages: string,
   *   releases: array,
   *   taxa: array
   * }
   */

  public static function fetch(Connection $connection, ?int $currentMSL, int $taxNodeID): array {
    $messages = '';
    $details  = [];
    $releases = [];
    $taxa     = [];

    $parameters = [":currentMSL" => $currentMSL, ":taxNodeID" => $taxNodeID];
    $sql = "CALL getTaxonReleaseHistory(:currentMSL, :taxNodeID);";
    $stmt = $connection->query($sql, $parameters);
    // $stmt->nextRowset();

    \Drupal::logger('ictv_web_api')->debug('Statement executed: @stmt', ['@stmt' => print_r($stmt, TRUE)]);
    
    // $params = [":currentMSL" => $currentMSL, ":taxNodeID" => $taxNodeID];

    // $sql1  = 'CALL getTaxonReleaseHistoryDetails :currentMSL, :taxNodeID';
    // $rows1 = $connection->query($sql1, $params)->fetchAllAssoc(\PDO::FETCH_ASSOC);
    // foreach ($rows1 as $row) {
    //   $details[] = TaxonHistoryDetail::fromArray($row)->normalize();
    // }
  
    // $sql2  = 'CALL getTaxonReleaseHistoryDetails :currentMSL, :taxNodeID';
    // $rows2 = $connection->query($sql2, $params)->fetchAllAssoc(\PDO::FETCH_ASSOC);
    // foreach ($rows2 as $row) {
    //   $details[] = TaxonHistoryRelease::fromArray($row)->normalize();
    // }
  
    // $sql3  = 'CALL getTaxonReleaseHistoryDetails :currentMSL, :taxNodeID';
    // $rows3 = $connection->query($sql3, $params)->fetchAllAssoc(\PDO::FETCH_ASSOC);
    // foreach ($rows3 as $row) {
    //   $details[] = TaxonHistoryTaxon::fromArray($row)->normalize();
    // }
  
    return [
      'details'  => $details,
      'messages' => $messages,
      'releases' => $releases,
      'taxa'     => $taxa,
    ];
  }
}