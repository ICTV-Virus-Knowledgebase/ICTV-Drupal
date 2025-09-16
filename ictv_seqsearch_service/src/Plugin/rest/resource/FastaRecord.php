<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Utils;


class FastaRecord {

   // The identifier after '>' up to first whitespace.
   public ?string $id = null;

   // Is the record valid?
   public bool $isValid = true;

   // Any remaining text on the header line after the id.
   public ?string $description = null;

   // The name of the original FASTA file.
   public ?string $originalFilename = null;

   // The record number in the original FASTA file (1-based).
   public int $recordNumber = 1;

   // An array of sequence lines.
   public array $sequenceLines = [];


   // C-tor
   public function __construct(string $header, string $originalFilename, array $sequenceLines, int $recordNumber = 1) {

      // Validate the input parameters.
      $header = trim($header);
      if (strlen($header) < 1) { throw new \InvalidArgumentException("Invalid FASTA header parameter"); }

      if (strlen($originalFilename) < 1) { throw new \InvalidArgumentException("Invalid original filename parameter"); }

      if (count($sequenceLines) < 1) { throw new \InvalidArgumentException("Invalid FASTA sequence lines parameter"); }

      // Split the header into id and description.
      $firstSpace = strpos($header, ' ');
      if ($firstSpace === false) {
         $this->id = $header;
         $this->description = null;
      } else {
         $this->id = substr($header, 0, $firstSpace);
         $this->description = trim(substr($header, $firstSpace + 1));
      }

      $this->originalFilename = $originalFilename;
      $this->recordNumber = $recordNumber;
      $this->sequenceLines = $sequenceLines;

      if (count($this->sequenceLines) < 1) { 
         $this->isValid = false;

      } else {

         // validate the sequence lines.
         foreach ($this->sequenceLines as $line) {

            if (strlen($line) < 1) continue;

            // Are there any characters/bases that aren't a nucleotide or amino acid?
            if (!preg_match(Common::$FASTA_AA_REGEX, $line) && !preg_match(Common::$FASTA_NT_REGEX, $line)) {
               $isValid = false;
               break;
            }
         }
      }
   }


   // Create a FASTA file in the job's input directory.
   public static function createInputFile(string $filename, string $inputPath, FastaRecord $record): bool {

      if (Utils::isNullOrEmpty($filename)) { throw new \InvalidArgumentException("Unable to create input file: Invalid filename parameter"); }

      // The full path of the new file in the input directory.
      $filePath = $inputPath.DIRECTORY_SEPARATOR.$filename;

      try {
         // Get the FASTA string.
         $fasta = $record->getFASTA();
         if (Utils::isNullOrEmpty($fasta)) { throw new \Exception("Unable to create input file: Invalid FASTA in file {$filename}"); }

         // Create an alias for the file system service.
         $fileSystem = \Drupal::service("file_system");

         // Create the file
         $fileID = $fileSystem->saveData($fasta, $filePath, FileSystemInterface::EXISTS_REPLACE);

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


   // Export the FASTA record as a string.
   public function getFASTA(): string {

      $fasta = ">" . $this->id;
      if (!\is_null($this->description) && strlen($this->description) > 0) {
         $fasta .= " " . $this->description;
      }
      $fasta .= "\n" . implode("\n", $this->sequenceLines) . "\n";

      return $fasta;
   }


   // A generator that parses a FASTA string and returns a FastaRecord object for every record/sequence it finds.
   public static function getFastaRecords(string $fasta, string $filename) {
      
      $fasta = trim($fasta);
      if (strlen($fasta) < 1) { return null; }
      if (strlen($filename) < 1) { return null; }

      $header = null;
      $sequenceLines = [];

      $lines = preg_split('/\r\n|\r|\n/', $fasta);

      foreach ($lines as $line) {

         $line = trim($line);
         if ($line === "") continue;

         if ($line[0] === ">") {

            // If we have a previous record, yield it.
            if ($header !== null) { yield new FastaRecord($header, $filename, $sequenceLines, true); }

            $header = substr($line, 1);  // remove '>'
            $sequenceLines = [];

         } else {

            // NOTE: We shouldn't have to initialize this array here, so this is just in case.
            if ($sequenceLines == null) { $sequenceLines = []; }

            // Append the sequence line.
            array_push($sequenceLines, $line);
         }
      }
      
      // Yield the last record
      if ($header !== null) { yield new FastaRecord($header, $filename, $sequenceLines, true); }
   }

}

