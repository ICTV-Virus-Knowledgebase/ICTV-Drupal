<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_common\Utils;



class TaxResult {

   public static function getJSON(string $jsonFilename, string $outputPath) {

      // The contents of the JSON file as text.
      $text;

      try {
         // Open and read the JSON file.
         $text = file_get_contents($outputPath."/".$jsonFilename);
         if (!$text) { throw new \Exception("Error in TaxResult.getJSON: ".$jsonFilename." is empty"); }

         // https://www.php.net/manual/en/function.json-decode.php
         //$json = json_decode($text);
      }
      catch (\Exception $e) {
          throw new \Exception("Error in TaxResult.getJSON: ".$e->getMessage());
      }

      return $text;
   }

}