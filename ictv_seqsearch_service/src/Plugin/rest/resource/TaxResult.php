<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_common\Utils;


class TaxResult {

   public static function getJSON(string $jsonFilename, string $outputPath) {

      // The contents of the JSON file as text.
      $json;

      try {
         // Open and read the JSON file.
         $json = file_get_contents($outputPath."/".$jsonFilename);

         if (json_decode($json) === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("JSON data is invalid after conversion");
         }
      }
      catch (\Exception $e) {
          throw new \Exception("Error in TaxResult.getJSON: ".$e->getMessage());
      }

      return $json;
   }

}