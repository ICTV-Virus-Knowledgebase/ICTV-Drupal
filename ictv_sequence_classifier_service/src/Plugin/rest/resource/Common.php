<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_common\Utils;


class Common {

   // The name of the parent module.
   public static string $MODULE_NAME = "ictv_sequence_classifier_service";


   // Open a file and return its contents.
   public static function getFileContents(bool $encodeBase64, string $filename, string $filePath) {

      $handle = null;
      $fileData = null;
   
      try {
         // Get a file handle and read its contents.
         $handle = fopen($filePath, "r");
         $fileData = fread($handle, filesize($filePath));
   
      } catch (\Exception $e) {
         \Drupal::logger($MODULE_NAME)->error($e->getMessage());
         return null;
   
      } finally {
         if ($handle != null) { fclose($handle); }
      }
   
      if ($fileData == null) {
         \Drupal::logger($MODULE_NAME)->error("Invalid file ".$filename." in job ".$jobUID);
         return null;
      }
   
      // Should we encode the file contents as base64?
      if ($encodeBase64) {
         return base64_encode($fileData);
      } else {
         return $fileData;
      }
   }

}



