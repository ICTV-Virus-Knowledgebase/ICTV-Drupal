<?php

namespace Drupal\ictv_id_page\Services;

use Drupal\Core\Database\Connection;
use Drupal\ictv_id_page\Models\MslRelease;


class MslService {


   public static function getRelease(Connection $connection, int $releaseNum) {

      $parameters = [":releaseNum" => $releaseNum];

      $query = null;
      $result = null;

      $sql = "SELECT ".
         "msl_release_num, ".
         "notes, ".
         "tree_id, ".
         "year, ".

         "realms, ".
         "subrealms, ".
         "kingdoms, ".
         "subkingdoms, ".
         "phyla, ".
         "subphyla, ".
         "classes, ".
         "subclasses, ".
         "orders, ".
         "suborders, ".
         "families, ".
         "subfamilies, ".
         "genera, ".
         "subgenera, ".
         "species  ".

         "FROM view_taxa_level_counts_by_release  ".
         "WHERE msl_release_num = :releaseNum ".
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

      // Create an MslRelease instance from the row of data.
      return MslRelease::fromArray($result);
   }


   public static function toHTML(MslRelease $release) {

      $html = "<br/>".
         "<b>Virus Taxonomy: ".$release->year." Release</b><br/>".
         $release->notes."<br/>".
         $release->realms." realms, ".$release->kingdoms." kingdoms, ".$release->phyla." phyla, ".$release->subphyla." subphyla, ".
         $release->classes." classes, ".$release->orders." orders, ".$release->suborders." suborders, ".$release->families." families, ".
         $release->subfamilies." subfamilies, ".$release->genera." genera, ".$release->subgenera." subgenera, ".$release->species." species";

      return $html;
   }

}
