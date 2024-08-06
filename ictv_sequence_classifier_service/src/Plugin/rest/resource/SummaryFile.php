<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_common\Utils;


class SummaryFile {

    // The summary file's name.
    public string $filename = "/QC.summary.tsv";

    // Counts for each status type.
    public int $errors;
    public int $notes;
    public int $successes;
    public int $warnings;

    // Summary file (TSV) column indices
    /* 
    
    TODO: what are the columns in the sequence classifier file?

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
    */


    // C-tor
    public function __construct(string $filename = null) {
        
        if (!Utils.isNullOrEmpty($filename)) { $this->filename = $filename; }

        $this->errors = 0;
        $this->notes = 0;
        $this->successes = 0;
        $this->warnings = 0;
    }

    
    // Parse the summary TSV file.
    public static function getSummaries(string $summaryPath) {

        // A collection of SummaryFile objects by file.
        $summaries = array();

        // The file handle
        $handle = NULL;

        try {
            // Open the summary file
            $handle = fopen($summaryPath.$filename, "r");
            if (!$handle) { throw new \Exception("Error in SummaryFile.getSummaries: Unable to open QC.summary.tsv"); }

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
               $summaryFilename = "TODO"; // $columns[ResultSummary::$COLUMN_XLSX];
               if (Utils::isEmptyElseTrim($summaryFilename)) { $summaryFilename = "NA"; }

               // Get and validate the status (level) column.
               $status = "TODO"; // $columns[ProposalFileSummary::$COLUMN_LEVEL];
               if (Utils::isEmptyElseTrim($status)) { continue; } 
               
               // Convert the status to lowercase.
               $status = strtolower($status);
               
               $summaryFile = null;
               
               // Look for the summary filename in the array and create one if it doesn't exist.
               if (array_key_exists($summaryFilename, $summaries)) { $summaryFile = $summaries[$filename]; }
               if (!$summaryFile) { $summaryFile = new SummaryFile($summaryFilename); }

               // Increment this status' count.
               $summaryFile->incrementCount($status);

               // Replace the summary in the array.
               $summaries[$summaryFilename] = $summaryFile;
            }
        }
        catch (\Exception $e) {
            throw new \Exception("Error in SummaryFile.getSummaries: ".$e->getMessage());
        }
        finally {
            if ($handle) { fclose($handle); }
        }

        return $summaries;
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