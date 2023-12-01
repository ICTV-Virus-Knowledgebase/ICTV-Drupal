<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;


class ProposalFileSummary {

    // The proposal filename.
    public string $filename;

    // Counts for each status type.
    public int $errors;
    public int $notes;
    public int $successes;
    public int $warnings;

    // Summary file (TSV) column indices
    public static int $COLUMN_SUBCOMMITTEE = 0;
    public static int $COLUMN_CODE = 1;
    public static int $COLUMN_DOCX = 2;
    public static int $COLUMN_XLSX = 3;
    public static int $COLUMN_ROW = 4;
    public static int $COLUMN_CHANGE = 5;
    public static int $COLUMN_RANK = 6;
    public static int $COLUMN_TAXON = 7;
    public static int $COLUMN_LEVEL = 8;
    public static int $COLUMN_ERROR = 9;
    public static int $COLUMN_MESSAGE = 10;
    public static int $COLUMN_NOTES = 11;


    // C-tor
    public function __construct(string $filename = null) {
        $this->errors = 0;
        $this->filename = $filename;
        $this->notes = 0;
        $this->successes = 0;
        $this->warnings = 0;
    }

    
    // Parse the summary TSV file for proposal filenames and their status counts.
    public static function getFileSummaries(string $resultsPath) {

        // A collection of ProposalFileSummary objects by file.
        $fileSummaries = array();

        // The file handle
        $handle = NULL;

        try {
            // Open the file
            // TODO: abstract this filename into a centralized location.
            $handle = fopen($resultsPath."/QC.summary.tsv", "r");
            if (!$handle) { throw new \Exception("Error in ProposalFileSummary.getFileSummaries: Unable to open QC.summary.tsv"); }

            $lineNumber = -1;

            // Iterate over every line in the file.
            while ($line = fgets($handle)) {
            
               $lineNumber = $lineNumber + 1;

               // Skip the first line of column headers.
               if ($lineNumber < 1) { continue; }

               // Split the line by tab delimiters.
               $columns = explode("\t", $line);
               if (!$columns || sizeof($columns) < 10) { continue; }

               // Get and validate the spreadsheet filename column.
               $filename = $columns[ProposalFileSummary::$COLUMN_XLSX];
               if (Utils::isEmptyElseTrim($filename)) { $filename = "NA"; }

               // Get and validate the status (level) column.
               $status = $columns[ProposalFileSummary::$COLUMN_LEVEL];
               if (Utils::isEmptyElseTrim($status)) { continue; } 
               
               // Convert the status to lowercase.
               $status = strtolower($status);
               
               $fileSummary = null;
               
               // Look for the filename's summary in the array and create one if it doesn't exist.
               if (array_key_exists($filename, $fileSummaries)) { $fileSummary = $fileSummaries[$filename]; }
               if (!$fileSummary) { $fileSummary = new ProposalFileSummary($filename); }

               // Increment this status' count.
               $fileSummary->incrementCount($status);

               // Replace the summary in the array.
               $fileSummaries[$filename] = $fileSummary;
            }
        }
        catch (\Exception $e) {
            throw new \Exception("Error in ProposalFileSummary.getFileSummaries: ".$e->getMessage());
        }
        finally {
            if ($handle) { fclose($handle); }
        }

        return $fileSummaries;
    }


   // Increment the count of the specified status.
   public function incrementCount(string $status) {

      switch ($status) {
         case "error":
               $this->errors = $this->errors + 1;
               break;
         case "info":
               $this->notes = $this->notes + 1;
               break;
         case "success":
               $this->successes = $this->successes + 1;
               break;
         case "warning":
               $this->warnings = $this->warnings + 1;
               break;
         default: 
               throw new \Exception("Unhandled status ".$status);
      }
   }
}