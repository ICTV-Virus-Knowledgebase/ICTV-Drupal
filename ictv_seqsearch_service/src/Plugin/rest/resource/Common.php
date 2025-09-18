<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\FastaRecord;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Utils;


class Common {

   // A regex for valid amino acids (proteins) in a FASTA sequence.
   public static string $FASTA_AA_REGEX = "/^[ACDEFGHIKLMNPQRSTVWY]+$/i";

   // A regex for valid nucleotides in a FASTA sequence.
   public static string $FASTA_NT_REGEX = "/^[ACGTURYSWKMBDHVN\.\-]+$/i";

   // The name of the parent module.
   public static string $MODULE_NAME = "ictv_seqsearch_service";


   
   /**
    * Decode data from Base64URL (http://base64.guru/developers/php/examples/base64url)
    * @param string $data
    * @param boolean $strict
    * @return boolean|string
    */
   public static function base64url_decode($data, $strict = false) {

      // Convert Base64URL to Base64 by replacing "-" with "+" and "_" with "/".
      $b64 = strtr($data, '-_', '+/');

      // Decode Base64 string and return the original data
      return base64_decode($b64, $strict);
   }
   

   /**
    * Encode data to Base64URL (http://base64.guru/developers/php/examples/base64url)
    * @param string $data
    * @return boolean|string
    */
   public static function base64url_encode($data) {
      
      // Encode $data to a Base64 string.
      $b64 = base64_encode($data);

      // Make sure you get a valid result. Otherwise, return FALSE.
      if ($b64 === false) { return false; }

      // Convert Base64 to Base64URL by replacing "+" with "-" and "/" with "_".
      $url = strtr($b64, '+/', '-_');

      // Remove padding characters from the end of line and return the Base64URL result.
      return rtrim($url, '=');
   }


   /**
    * Create a temp directory, copy the output files to it, and create a zip file from the temp directory.
    */
   public static function copyOutputFilesAndZip(string $jobPath, string $jobUID, string $outputPath) {

      // Validate input parameters.
      if (strlen($jobPath) < 1) { throw new \Exception("Error in copyAndZipJobDirectory: Invalid job path parameter"); }
      if (strlen($jobUID) < 1) { throw new \Exception("Error in copyAndZipJobDirectory: Invalid job UID parameter"); }
      if (strlen($outputPath) < 1) { throw new \Exception("Error in copyAndZipJobDirectory: Invalid output path parameter"); }

   
      // Get the path of the system's tmp directory.
      $tempBase = sys_get_temp_dir();

      \Drupal::logger(Common::$MODULE_NAME)->info("temp base = {$tempBase}");

      // Create a job-specific directory name.
      $directoryName = Common::getZipFileDirectoryName($jobUID);
      
      // Add the directory name to the temp directory name.
      $newDirectory = $tempBase.DIRECTORY_SEPARATOR.$directoryName;

      $fileSystem = \Drupal::service("file_system");
      if (!$fileSystem) { throw new \Exception("Invalid file system reference"); }

      // Create the job directory.
      if (!$fileSystem->prepareDirectory($newDirectory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         $errorMessage = "Unable to create temp directory {$newDirectory}";
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         throw new \Exception($errorMessage);
      }

      \Drupal::logger(Common::$MODULE_NAME)->info("Created directory {$newDirectory}");

      // Get all files in the output directory.
      $files = scandir($outputPath);

      if (!str_ends_with($outputPath, DIRECTORY_SEPARATOR)) { $outputPath .= DIRECTORY_SEPARATOR; }

      // We will compare the total number of files to the number of successfully copied files.
      $copyCount = 0;
      $fileCount = count($files);
      
      // Copy files from the output directory to the temp job directory.
      foreach ($files as $file) {

         // Skip special dirs
         if ($file === "." || $file === "..") { continue; }

         $sourceFile = $outputPath.$file;
         $targetFile = $newDirectory.DIRECTORY_SEPARATOR.$file;

         // Only copy regular files
         if (is_file($sourceFile)) {

            // Ignore gzipped files
            if (str_ends_with($sourceFile, ".gz")) { continue; }

            if (copy($sourceFile, $targetFile)) { $copyCount += 1; }
         }
      }

      $zipFilePath = $outputPath.$directoryName.".zip";

      // Create the zip file in the output directory.
      Common::createZipFromDirectory($newDirectory, $zipFilePath);

      // Delete the temp directory.
      Common::deleteDirectory($newDirectory);
   }


   /**
    * Open the file specified by $filename and $filePath, compress it using zlib, save the compressed file
    * in $filePath, and return the compressed data.
    */
   public static function createCompressedFile(string $filename, string $filePath) {

      // Validate the filename.
      if (Utils::isNullOrEmpty($filename)) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid filename: ".$filename);
         return null;
      }

      // Validate the file path.
      if (Utils::isNullOrEmpty($filePath)) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid file path: ".$filePath);
         return null;
      }

      // Has the file already been compressed?
      if (str_ends_with($filename, ".gz")) {
         \Drupal::logger(Common::$MODULE_NAME)->error("File ".$filePath.$filename." is already compressed.");
         return null;
      }

      // TODO: This will be unnecessary when the output folder is removed from the JSON values.
      if (str_starts_with($filename, "tax_out/")) { $filename = substr($filename, strlen("tax_out/"));  }

      // Make sure the file path ends with a slash.
      if (!str_ends_with($filePath, "/")) { $filePath = $filePath."/"; }

      try {
         // Open the file and retrieve its contents (without base64 encoding).
         $contents = Common::getFileContents(false, $filename, $filePath);
               
         // The name of the compressed file we are about to create.
         $gzFilename = $filename.".gz";
         
         $gzFullPath = $filePath.$gzFilename;

         // Compress using gzip encoding.
         $gzContents = zlib_encode($contents, ZLIB_ENCODING_GZIP);
         if ($gzContents === FALSE) {
            \Drupal::logger(Common::$MODULE_NAME)->error("Compression failed for file ".$gzFullPath);
            return null;
         }

         // Create and save the new compressed file.
         $newFile = fopen($gzFullPath, "w") or die("Unable to create file ".$gzFullPath);
         fwrite($newFile, $gzContents);
         fclose($newFile);
      } 
      catch (Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
      }
   }


   /**
    * Create a zip file of the job directory (courtesy of Claude.ai).
    */
   public static function createZipFromDirectory($sourceDir, $zipFilePath) {

      // Initialize archive object
      $zip = new \ZipArchive();
      $result = $zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
      
      if ($result !== TRUE) { throw new \Exception("Cannot create zip file: " . $result); }
      
      // Create recursive directory iterator
      $iterator = new \RecursiveIteratorIterator(
         new \RecursiveDirectoryIterator($sourceDir, \RecursiveDirectoryIterator::SKIP_DOTS),
         \RecursiveIteratorIterator::SELF_FIRST
      );
      
      foreach ($iterator as $file) {

         $filePath = $file->getRealPath();
         $relativePath = substr($filePath, strlen($sourceDir) + 1);
         
         if ($file->isDir()) {

            // Add the directory
            $zip->addEmptyDir($relativePath);

         } elseif ($file->isFile()) {

            // Does it have a file extension we're ignoring?
            if ($file->getExtension() == "gz") { continue; }

            // Add the file
            $zip->addFile($filePath, $relativePath);
         }
      }
      
      // Close and save
      $zip->close();
      
      return file_exists($zipFilePath);
   }

   /**
    * Decode a Base64URL-encoded filename that has a record number suffix an underscore and the word "seq" followed by a 4 digit record number.
    */
   public static function decodeFilenameFromBase64URL(string $encodedFilename): string {
      
      // Trim and validate the encoded filename.
      $encodedFilename = trim($encodedFilename);
      if (strlen($encodedFilename) < 1) { return ""; }
      
      $basename = null;
      $extension = null;

      // The index of the last dot.
      $lastDotIndex = strrpos($encodedFilename, ".");

      // Get the file extension.
      if ($lastDotIndex && $lastDotIndex > -1) {
         $basename = substr($encodedFilename, 0, $lastDotIndex);
         $extension = substr($encodedFilename, $lastDotIndex);
      } else {
         $basename = $encodedFilename;
         $extension = "";
      }

      // Does the basename end with a suffix of the form "_seqNNNN" where NNNN is a 4 digit number?
      /*if (preg_match("/_seq\d{4}$/", $basename)) {

         // Remove the suffix.
         $basename = substr($basename, 0, strlen($basename) - 8);
      }*/

      return Common::base64url_decode($basename).$extension;
   }


   /**
    * Delete the specified directory (courtesy of Claude.ai).
    */
   private static function deleteDirectory($dir) {
        
      if (!is_dir($dir)) { return; }
        
      $iterator = new \RecursiveIteratorIterator(
         new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
      
      foreach ($iterator as $file) {
         if ($file->isDir()) {
            rmdir($file->getRealPath());
         } else {
            unlink($file->getRealPath());
         }
      }
        
      rmdir($dir);
   }

   /**
    * Encode a filename using Base64URL encoding and append a suffix based on the record number.
    */ 
   public static function encodeFilenameAsBase64URL(string $filename): string {
      
      $filename = trim($filename);
      if (strlen($filename) < 1) { return ""; }
      
      $basename = null;
      $extension = null;

      // The index of the last dot.
      $lastDotIndex = strrpos($filename, ".");

      // Get the file extension.
      if ($lastDotIndex && $lastDotIndex > -1) {
         $basename = substr($filename, 0, $lastDotIndex);
         $extension = substr($filename, $lastDotIndex);
      } else {
         $basename = $filename;
         $extension = "";
      }
      
      return Common::base64url_encode($basename).$extension;
   }

   /**
    * Generate a suffix for the basename based on the record number.
    * The suffix will be an underscore and the word "seq" followed by a 4 digit record number.
    */
   public static function generateFastaBasenameSuffix(int $recordNumber): string {
      
      $digits = "";

      if ($recordNumber < 1000) { 
         if ($recordNumber >= 100) { 
            $digits = "0"; 
         } else if ($recordNumber >= 10) { 
            $digits = "00"; 
         } else { 
            $digits = "000"; 
         }
      }

      $digits .= strval($recordNumber);

      return "_seq".$digits;
   }


   /**
    * Open a file and return its contents.
    */
   public static function getFileContents(bool $encodeBase64, string $filename, string $filePath) {

      $handle = null;
      $fileData = null;
   
      if (!str_ends_with($filePath, '/')) { $filePath = $filePath.'/'; }

      // Concatenate the path and filename.
      $filePathAndName = $filePath.$filename;

      try {
         // Open the file and read its contents.
         $handle = fopen($filePathAndName, "r");
         if ($handle === false) {
            \Drupal::logger(Common::$MODULE_NAME)->error("Unable to open file ".$filePathAndName);
            return null;
         }
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

   
   /**
    * Return the name of the job directory that will be added to a zip file for download by the user.
    */
   public static function getZipFileDirectoryName(string $jobUID) {
      return "TaxaBLAST_".$jobUID;
   }

   /**
    * Lookup the user UID associated with this job UID.
    */
   public static function lookupJobUserUID(Connection $dbConnection, string $jobUID) {

      // TODO: validate the connection parameter.

      if (Utils::isEmptyElseTrim($jobUID)) { throw new Exception("Invalid job UID parameter"); }

      // Generate SQL to lookup the job's user UID.
      $sql = "SELECT user_uid FROM job WHERE `uid` = '{$jobUID}' LIMIT 1;";

      // Execute the query and process the results.
      $result = $dbConnection->query($sql);
      $userUID = $result->fetchField(0);

      return $userUID;
   }


   // Validate a FASTA file's contents and filename.
   public static function validateFASTA(string $fasta, string $filename, int &$invalidCount, int &$recordCount): bool {

      $invalidCount = 0;
      $isValid = true;
      $recordCount = 0;
   
      $fasta = trim($fasta);
      if (strlen($fasta) < 1) { return false; }

      if (strlen($filename) < 1) { return false; }

      $header = null;
      $sequenceLines = [];

      $lines = preg_split('/\r\n|\r|\n/', $fasta);

      foreach ($lines as $line) {

         $line = trim($line);
         if ($line === "") continue;

         if ($line[0] === ">") {

            $recordNumber += 1;

            // If we have a previous record, validate it.
            if ($header !== null) {

               $recordCount += 1;

               if (!Common::validateFastaRecord($header, $sequenceLines)) {
                  $isValid = false;
                  $invalidCount += 1;
               }
            }

            $header = substr($line, 1);  // remove '>'
            $sequenceLines = [];

         } else {

            // NOTE: We shouldn't have to initialize this array here, so this is just in case.
            if ($sequenceLines == null) { $sequenceLines = []; }

            // Append the sequence line.
            array_push($sequenceLines, $line);
         }
      }

      // Is there a last record to validate?
      if ($header !== null) { 
         $recordNumber += 1;
         if (!Common::validateFastaRecord($header, $sequenceLines)) {
            $isValid = false;
            $invalidCount += 1;
         }
      }

      return $isValid;
   }

   // Validate a FASTA record's header and sequence lines.
   public static function validateFastaRecord(string $header, array $sequenceLines): bool {

      $isValid = true;

      // TODO: Validate the header line.

      // Validate the sequence lines.
      foreach ($sequenceLines as $line) {

         if (strlen($line) < 1) continue;

         // Are there any bases that aren't a nucleotide or amino acid?
         if (!preg_match(Common::$FASTA_AA_REGEX, $line) && !preg_match(Common::$FASTA_NT_REGEX, $line)) {
            $isValid = false;
            break;
         }
      }

      return $isValid;
   }

}
