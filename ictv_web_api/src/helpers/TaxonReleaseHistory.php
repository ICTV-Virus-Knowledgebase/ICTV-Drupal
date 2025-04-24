<?php

namespace Drupal\ictv_web_api\helpers;

use Drupal\Core\Database\Connection;
use Exception;

// Models
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryDetail;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryRelease;
use Drupal\ictv_web_api\Plugin\rest\resource\models\TaxonHistoryTaxon;

class TaxonReleaseHistory {

  /**
   * Call the (single‐result) proc `getTaxonReleaseHistory`
   *
   * @param Connection   $connection
   * @param int|null     $currentMSL
   * @param int          $taxNodeID
   *
   * @return array{
   *   detail: obj,
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

    // call the stored procedure
    $sql = 'CALL getTaxonReleaseHistory(:currentMSL, :taxNodeID)';
    $params = [
      ':currentMSL' => $currentMSL,
      ':taxNodeID'  => $taxNodeID,
    ];

    try {
      $rows = $connection->query($sql, $params)->fetchAll(\PDO::FETCH_ASSOC);
      // \Drupal::logger('ictv_web_api')->debug('Query results: @rows', ['@rows' => print_r($rows, TRUE)]);
    }

    catch (\Exception $e) {

      // if the proc itself failed, capture its message
      return [
        'details'  => [],
        'messages' => $e->getMessage(),
        'releases' => [],
        'taxa'     => [],
      ];
    }

    foreach ($rows as $r) {

      // use the real column name coming from mariadb
      $type = strtoupper($r['rec_type'] ?? '');   // TAXON / RELEASE / MODIFICATION
    
      switch ($type) {
        case 'TAXON':         // this is the “detail” table in the old API
          $details[]  = TaxonHistoryDetail::fromArray($r)->normalize();
          break;
    
        case 'RELEASE':
          $releases[] = TaxonHistoryRelease::fromArray($r)->normalize();
          break;
    
        case 'MODIFICATION':
          $taxa[]     = TaxonHistoryTaxon::fromArray($r)->normalize();
          break;
      }
    }

    // \Drupal::logger('ictv_web_module')->debug('Details array: @details', ['@details' => print_r($details, TRUE)]);

    $detailObj = null;
    if (!empty($details)) {
        $detailObj = $details[0];   // first (only) TAXON row
    }

    return [
      'detail'  => $detailObj,
      'messages' => $messages,
      'releases' => $releases,
      'taxa'     => $taxa,
    ];
  }
}