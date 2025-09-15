<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

class FastaRecord {

   // A regex for valid amino acids (proteins) in a FASTA sequence.
   public static string $FASTA_AA_REGEX = "/^[ACDEFGHIKLMNPQRSTVWY]+$/i";

   // A regex for valid nucleotides in a FASTA sequence.
   public static string $FASTA_NT_REGEX = "/^[ACGTURYSWKMBDHVN\.\-]+$/i";


   // The identifier after '>' up to first whitespace.
   public ?string $id = null;

   // Is the record valid?
   public bool $isValid = true;

   // Any remaining text on the header line after the id.
   public ?string $description = null;

   // The name of the original FASTA file.
   public ?string $originalFilename = null;

   // An array of sequence lines.
   public array $sequenceLines = [];


   // C-tor
   public function __construct(string $header, string $originalFilename, array $sequenceLines, bool $validate = true) {

      // Validate the input parameters.
      $header = trim($header);
      if (strlen($header) < 1) {
         $this->isValid = false;
         throw new \InvalidArgumentException("Invalid FASTA header"); 
      }

      if (strlen($originalFilename) < 1) {
         $this->isValid = false;
         throw new \InvalidArgumentException("Invalid original filename"); 
      }

      if (count($sequenceLines) < 1) { 
         $this->isValid = false;
         throw new \InvalidArgumentException("Invalid FASTA sequence"); 
      }

      // Parse the header into id and description.
      $firstSpace = strpos($header, ' ');
      if ($firstSpace === false) {
         $this->id = $header;
         $this->description = null;
      } else {
         $this->id = substr($header, 0, $firstSpace);
         $this->description = trim(substr($header, $firstSpace + 1));
      }

      $this->originalFilename = $originalFilename;

      $this->sequenceLines = $sequenceLines;

      if ($validate) {
         $this->isValid = FastaRecord::validateSequence($this->sequenceLines);
      }
   }

   // Validate the bases in the sequence lines.
   public static function validateSequence(array $sequenceLines): bool {
      
      $isValid = true;

      foreach ($sequenceLines as $line) {
         if (strlen($line) < 1) continue;
         if (!preg_match(FastaRecord::$FASTA_AA_REGEX, $line) && !preg_match(FastaRecord::$FASTA_NT_REGEX, $line)) {
            $isValid = false;
            break;
         }
      }

      return $isValid;
   }
}

