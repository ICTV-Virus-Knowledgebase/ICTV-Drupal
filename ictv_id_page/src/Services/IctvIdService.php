<?php

namespace Drupal\ictv_id_page\Services;

use Drupal\Core\Database\Connection;
use Drupal\ictv_id_page\Models\IctvIdTaxon;


class IctvIdService {


   public static function getLatestTaxon(Connection $connection, int $ictvID) {

      $parameters = [":ictvID" => $ictvID];

      $query = null;
      $result = null;

      $sql = "SELECT ".
         "tn.lineage, ".
         "tn.msl_release_num, ".
         "tn.name, ".
         "tl.name AS rank_name, ".
         "tn.taxnode_id ".

         "FROM taxonomy_node tn ".
         "JOIN taxonomy_level tl ON tl.id = tn.level_id ".
         "WHERE tn.ictv_id = :ictvID ".
         "ORDER BY tn.msl_release_num DESC ".
         "LIMIT 1;";

      try {
         // Run the query
         $query = $connection->query($sql, $parameters);
         $result = $query->fetchAssoc();
      } 
      catch (Exception $e) {
         \Drupal::logger('ictv_id_page')->error($e);
         return null;
      }

      if (!$result) { return null; }

      // Create an IctvIdTaxon instance from the row of data.
      return IctvIdTaxon::fromArray($result);
   }


   public static function toHTML(IctvIdTaxon $taxon) {

      $html = "<br/>".
         $taxon->rankName.": ".$taxon->name." (TN:".$taxon->taxnodeID.")<br/>".
         "MSL ".$taxon->mslReleaseNum."<br/>".
         $taxon->lineage;

      return $html;
   }

}
