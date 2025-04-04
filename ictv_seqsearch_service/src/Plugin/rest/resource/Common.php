<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_common\Utils;


class Common {

   // The name of the parent module.
   public static string $MODULE_NAME = "ictv_seqsearch_service";


   // Open the file specified by $filename and $filePath, compress it using zlib, save the compressed file 
   // in $filePath, and return the compressed data.
   public static function createCompressedFile(string $filename, string $filePath) {

      // Validate the filename.
      if (Utils::isNullOrEmpty($filename)) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid filename: ".$filename);
         return null;
      }

      // Has the file already been compressed?
      if (str_ends_with($filename, ".gz")) {
         \Drupal::logger(Common::$MODULE_NAME)->error("File ".$filePath.$filename." is already compressed.");
         return null;
      }

      // Validate the file path.
      if (Utils::isNullOrEmpty($filePath)) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid file path: ".$filePath);
         return null;
      }

      // Make sure the file path ends with a slash.
      if (!str_ends_with($filePath, "/")) { $filePath = $filePath."/"; }

      try {
         // Open the file and retrieve its contents (without base64 encoding).
         $contents = Common::getFileContents(false, $filename, $filePath);
               
         $compressedFilename = $filename.".gz";
         
         // Compress using gzip encoding.
         $compressed = zlib_encode($contents, ZLIB_ENCODING_GZIP);

         if ($compressed === FALSE) {
            \Drupal::logger(Common::$MODULE_NAME)->error("Compression failed for file ".$filePath.$compressedFilename);
            return null;
         }

         // Concatenate the path and filename.
         $filePathAndName = $filePath.$compressedFilename;

         // Create and save the new compressed file.
         $newFile = fopen($filePathAndName, "w") or die("Unable to create file ".$filePathAndName);
         fwrite($newFile, $compressed);
         fclose($newFile);

      } 
      catch (Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
      }

      return $compressed; 
   }


   // Open a file and return its contents.
   public static function getFileContents(bool $encodeBase64, string $filename, string $filePath) {

      $handle = null;
      $fileData = null;
   
      if (!str_ends_with($filePath, '/')) { $filePath = $filePath.'/'; }

      // Concatenate the path and filename.
      $filePathAndName = $filePath.$filename;

      try {
         // Get a file handle and read its contents.
         $handle = fopen($filePathAndName, "r");
         $fileData = fread($handle, filesize($filePathAndName));
   
      } catch (\Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
   
      } finally {
         if ($handle != null) { fclose($handle); }
      }
   
      if ($fileData == null) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid file ".$filename." in path ".$filePath);
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



