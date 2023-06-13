<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

class SummaryFile {


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
    

    public static function getSummaryData(string $resultsPath) {

        //$testfilename = $resultsPath."/QC.summary.tsv";
        //\Drupal::logger('ictv_proposal_service')->info("in getSummaryData filename = {$testfilename}");

        // Counts of level types found in the summary file.
        $errorCount = 0;
        $infoCount = 0;
        $warningCount = 0;

        // The file handle
        $handle = NULL;

        // A text summary with error and warning counts.
        $summary = "";

        try {
            // Open the file
            $handle = fopen($resultsPath."/QC.summary.tsv", "r");
            
            // Iterate over every line in the file.
            while ($line = fgets($handle)) {
            
                //\Drupal::logger('ictv_proposal_service')->info("line = ".$line);
                //\Drupal::logger('ictv_proposal_service')->info("first tab index = ".stripos($line, "\t"));

                // Split the line by tab characters.
                $columns = explode("\t", $line);
                if (!$columns || sizeof($columns) < 10) {
                    //\Drupal::logger('ictv_proposal_service')->error("Error in SummaryFile.getSummaryData: No columns found in line of text");
                    continue;
                }

                $level = $columns[SummaryFile::$COLUMN_LEVEL];

                switch (trim($level)) {
                    case "ERROR":
                        $errorCount = $errorCount + 1;
                        break;
                    case "INFO":
                        $infoCount = $infoCount + 1;
                        break;
                    case "WARNING":
                        $warningCount = $warningCount + 1;
                        break;
                    default:
                        break;       
                }
            }
        }
        catch (Exception $e) {
            \Drupal::logger('ictv_proposal_service')->error("Error in SummaryFile.getSummaryData: " . $e->getMessage());
            $errorCount = $errorCount + 1;
        }
        finally {
            if ($handle) { fclose($handle); }
        }

        // Add an error count if errors were found.
        if ($errorCount == 1) {
            $summary = $summary."1 error";
        } else if ($errorCount > 1) {
            $summary = $summary."{$errorCount} errors";
        }

        // Add a warning count if warnings were found.
        if ($warningCount == 1) {
            if (strlen($summary) > 1) { $summary = $summary.", "; }
            $summary = $summary."1 warning";

        } else if ($warningCount > 1) {
            if (strlen($summary) > 1) { $summary = $summary.", "; }
            $summary = $summary."{$warningCount} warnings";
        }


        \Drupal::logger('ictv_proposal_service')->info("summary = {$summary} and warningCount = {$warningCount}");

        $summaryData[] = array(
            "errors" => $errorCount,
            "info" => $infoCount,
            "summary" => $summary,
            "warnings" => $warningCount 
        );

        \Drupal::logger('ictv_proposal_service')->info("returning from getSummaryData");

        return $summaryData;
    }

    
}

