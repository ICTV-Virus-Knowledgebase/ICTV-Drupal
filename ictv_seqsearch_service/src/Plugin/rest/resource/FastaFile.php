<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Utils;


class FastaFile {

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
      if (strlen($fasta) < 1) { throw new \InvalidArgumentException("Invalid FASTA parameter"); }

      $filename = trim($filename);
      if (strlen($filename) < 1) { throw new \InvalidArgumentException("Invalid filename parameter"); }

      $this->fasta = $fasta;
      $this->filename = $filename;
      $this->isValid = $isValid;
      $this->recordCount = $recordCount;
   }


   // Create a FASTA file in the job's input directory.
   public static function createInputFile(FastaFile $file, string $inputPath): bool {

      if (!$file) { throw new \InvalidArgumentException("Unable to create input file: Invalid file parameter"); }
      if (!$file->isValid) { throw new \InvalidArgumentException("Unable to create input file: File is invalid"); }
      if (Utils::isnullOrEmpty($inputPath)) { throw new \InvalidArgumentException("Unable to create input file: Invalid input path"); }

      // The full path of the new file in the input directory.
      $filePath = $inputPath.DIRECTORY_SEPARATOR.$file->filename;

      try {
         // Create an alias for the file system service.
         $fileSystem = \Drupal::service("file_system");

         // Create the file
         $fileID = $fileSystem->saveData($file->fasta, $filePath, FileSystemInterface::EXISTS_REPLACE);

         // Update the file permissions.
         if (!$fileSystem->chmod($filePath, 0644)) {
            throw new \Exception("Unable to change permissions on file ".$filename);
         }
      }
      catch (\FileException $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return false;
      }
      finally {
         // TODO: Any cleanup?
      }

      return true;
   }

}