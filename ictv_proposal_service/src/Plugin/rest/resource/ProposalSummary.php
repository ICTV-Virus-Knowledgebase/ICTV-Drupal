<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;


class ProposalSummary {

    // Counts for each status type.
    public int $error;
    public int $info;
    public int $success;
    public int $warning;

    // An optional filename.
    public string|null $filename;

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
        $this->error = 0;
        $this->filename = $filename;
        $this->info = 0;
        $this->success = 0;
        $this->warning = 0;
    }


    // Use the proposal summary's status counts to generate message text.
    public static function createMessage(ProposalSummary $summary): string {

        $message = "";

        // Generate error text
        if ($summary->error == 1) {
            $message = $message."1 error";
        } else if ($summary->error > 1) {
            $message = $message."{$summary->error} errors";
        }
   
        // Generate success text
        if ($summary->success == 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."1 success";

        } else if ($summary->success > 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."{$summary->success} successes";
        }

        // Generate warning text
        if ($summary->warning == 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."1 warning";

        } else if ($summary->warning > 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."{$summary->warning} warnings";
        }

        // Generate notes text
        if ($summary->info == 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."1 note";

        } else if ($summary->info > 1) {
            if (strlen($message) > 0) { $message = $message.", "; }
            $message = $message."{$summary->info} notes";
        }

        return $message;
    }

    // Parse the summary TSV file for proposal filenames and their summaries (status counts).
    public static function getProposalSummaries(string $resultsPath, array &$summaries, ProposalSummary &$totals) {

        // A collection of ProposalSummary objects by file.
        if (!$summaries) { $summaries = array(); }

        // Total counts-by-status for all proposal files.
        if (!$totals) { $totals = new ProposalSummary(); }

        // The file handle
        $handle = NULL;

        try {
            // Open the file
            // TODO: abstract this filename into a centralized location.
            $handle = fopen($resultsPath."/QC.summary.tsv", "r");
            if (!$handle) { throw new \Exception("Unable to open QC.summary.tsv"); }

            $lineNumber = -1;

            // Iterate over every line in the file.
            while ($line = fgets($handle)) {
            
                $lineNumber = $lineNumber + 1;

                // Skip the first line of column headers.
                if ($lineNumber < 1) { continue; }

                // Split the line by tab characters.
                $columns = explode("\t", $line);
                if (!$columns || sizeof($columns) < 10) { continue; }

                // Get and validate the spreadsheet filename column.
                $filename = $columns[ProposalSummary::$COLUMN_XLSX];
                if (Utils::isEmptyElseTrim($filename)) { $filename = "NA"; }

                // Get and validate the status (level) column.
                $status = $columns[ProposalSummary::$COLUMN_LEVEL];
                if (Utils::isEmptyElseTrim($status)) { continue; } 
                
                // Convert the status to lowercase.
                $status = strtolower($status);
                
                // Look for the filename's summary in the array and create one if it doesn't exist.
                $summary = $summaries[$filename];
                if (!$summary) { $summary = new ProposalSummary($filename); }

                // Increment this status' count.
                $summary->increment($status);

                // Replace the summary in the array.
                $summaries[$filename] = $summary;

                // Update the total status counts.
                $totals->increment($status);
            }
        }
        catch (\Exception $e) {
            throw new \Exception("Error in ProposalSummary.getProposalSummaries: " . $e->getMessage());
        }
        finally {
            if ($handle) { fclose($handle); }
        }
    }

    // Increment the count of the specified status.
    public function increment(string $status) {

        switch ($status) {
            case "error":
                $this->error = $this->error + 1;
                break;
            case "info":
                $this->info = $this->info + 1;
                break;
            case "success":
                $this->success = $this->success + 1;
                break;
            case "warning":
                $this->warning = $this->warning + 1;
                break;
            default: 
                throw new \Exception("Unhandled status ".$status);
        }
    }
}