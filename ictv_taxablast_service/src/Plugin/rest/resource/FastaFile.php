<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

use Drupal\ictv_taxablast_service\Plugin\rest\resource\Common;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Utils;


class FastaFile {

   // The base64url encoded version of the filename.
   public ?string $encodedFilename = null;

   // The contents of the FASTA file.
   public ?string $fasta = null;

   // The name of the FASTA file.
   public ?string $filename = null;
   
   // Is the file valid?
   public bool $isValid = false;

   // The number of records in the FASTA file.
   public int $recordCount = 0;


   // C-tor
   public function __construct(string $fasta, string $filename, bool $isValid, int $recordCount) {

      // Validate the input parameters.
      $fasta = trim($fasta);
      if (mb_strlen($fasta) < 1) { throw new \InvalidArgumentException("Invalid FASTA parameter"); }

      $filename = trim($filename);
      if (mb_strlen($filename) < 1) { throw new \InvalidArgumentException("Invalid filename parameter"); }

      $this->encodedFilename = Common::encodeFilenameAsBase64URL($filename);
      $this->fasta = $fasta;
      $this->filename = $filename;
      $this->isValid = $isValid;
      $this->recordCount = $recordCount;
   }


   // Create a FASTA file in the job's input directory.
   public static function createInputFile(FastaFile $file, string $inputPath, bool $encodeFilename = true): bool {

      if (!$file) { throw new \InvalidArgumentException("Unable to create input file: Invalid file parameter"); }
      if (!$file->isValid) { throw new \InvalidArgumentException("Unable to create input file: File is invalid"); }
      if (Utils::isNullOrEmpty($inputPath)) { throw new \InvalidArgumentException("Unable to create input file: Invalid input path"); }

      // Use the input file's filename.
      $filename = $file->filename;

      // Should we encode the filename as base64url?
      if ($encodeFilename) { 
         $filename = $file->encodedFilename;
      } else {
         $filename = $file->filename;
      }

      // The full path of the new file in the input directory.
      $filePath = $inputPath.DIRECTORY_SEPARATOR.$filename;

      try {
         // Create an alias for the file system service.
         $fileSystem = \Drupal::service("file_system");

         // Create the file
         $fileID = $fileSystem->saveData($file->fasta, $filePath, FileExists::Replace);

         // Update the file permissions.
         if (!$fileSystem->chmod($filePath, 0644)) {
            throw new \Exception("Unable to change permissions on file ".$filename);
         }
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         return false;
      }
      finally {
         // TODO: Any cleanup?
      }

      return true;
   }

}