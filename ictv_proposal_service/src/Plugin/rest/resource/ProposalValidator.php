<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_proposal_service\Plugin\rest\resource\ProposalFileSummary;
use Drupal\ictv_common\Utils;


class ProposalValidator {

   // The contents of stdout and stderr will be written to these files.
   public static string $stdErrorFilename = "stderr.txt";
   public static string $stdOutFilename = "stdout.txt";

   
   public static function runValidation(string $proposalsPath, string $resultsPath, string $scriptName, string $workingDirectory) {

      // Declare variables used in the try/catch block.
      $exitCode = 0;
      $jobStatus = null;
      $stdError = null;
      $stdOut = null;
      $fileSummaries;
      $totals;

      $descriptorspec = array(
         0 => array("pipe", "r"), // Read from stdin (not used)
         1 => array("pipe", "w"), // Write to stdout
         2 => array("pipe", "w")  // Write to stderr
      );
      
      // Generate the command to be run.
      $command = "docker run ".
         "-v \"{$proposalsPath}:/proposalsTest\":ro ".
         "-v \"{$resultsPath}:/results\" ".
         $scriptName." ".
         "/merge_proposal_zips.R -v ";

      try {
         $process = proc_open($command, $descriptorspec, $pipes, $workingDirectory);

         // Validate the process
         if (!is_resource($process)) { throw new Exception("Process is not a resource"); }

         // $pipes now looks like this:
         // 0 => writeable handle connected to child stdin (we aren't using stdin)
         // 1 => readable handle connected to child stdout
         // 2 => writeable handle connected to child stderr

         // Get stdout
         $stdOut = stream_get_contents($pipes[1]);
         fclose($pipes[1]);

         // Get stderror
         $stdError = stream_get_contents($pipes[2]);
         fclose($pipes[2]);

         // It is important that you close any pipes before calling proc_close in order to avoid a deadlock.
         $exitCode = proc_close($process);

         // An exit code of 1 indicates that an error occurred in the process.
         if ($exitCode !== 0) { throw new \Exception("Invalid exit code"); }

         // If "execution terminated" is found in stdout, this indicates an error.
         if (str_contains(strtolower($stdError), "execution terminated")) { throw new \Exception("Execution was terminated"); }
         
         // If "# COMPLETED" is not found in stdout, there was a problem.
         if (!str_contains(strtolower($stdOut), "# completed")) { throw new \Exception("#COMPLETED was not found in stdout"); }

         // If we have gotten this far, set the job status to "pending" ("pending complete validation").
         $jobStatus = JobStatus::pending;

         // Parse the summary TSV file for proposal filenames and their status counts (file summaries).
         $fileSummaries = ProposalFileSummary::getFileSummaries($resultsPath);
         if (!$fileSummaries || sizeof($fileSummaries) < 1) { throw new \Exception("File summaries are invalid"); }

      } 
      catch (Exception $e) {

         $jobStatus = JobStatus::crashed;

         if ($e) { 
            if (isset($stdError) && $stdError !== '') { $stdError = $stdError . "; "; }
            $stdError = $stdError.$e->getMessage(); 
         }

         \Drupal::logger('ictv_proposal_service')->error("An error occurred in ProposalValidator: ".$stdError);
      }
      
      if ($jobStatus == null) { $jobStatus = JobStatus::crashed; } 

      // If stdout isn't empty, write it to a text file in the working directory.
      $stdOutFile = fopen($resultsPath.$stdOutFilename, "w");
      if ($stdOutFile !== false) {
         fwrite($stdOutFile, $stdOut);
         fclose($stdOutFile);
      }
      
      // If stderr isn't empty, write it to a text file in the working directory.
      $stdErrorFile = fopen($resultsPath.$stdErrorFilename, "w");
      if ($stdErrorFile !== false) {
         fwrite($stdErrorFile, $stdError);
         fclose($stdErrorFile);
      }
      
      return array(
         "command" => $command,
         "fileSummaries" => $fileSummaries,
         "jobStatus" => $jobStatus,
         "stdError" => $stdError
      );
   }

};



/*

validate_proposals % docker run -it ictv_proposal_processor /merge_proposal_zips.R

Options:
    -v, --verbose
            Print extra output

    -q, --quiet
            Print no output

    -d, --debug
            Call browser() on data error [default "FALSE"]

    --noInfo
            Supress INFO level warnings from output [default "TRUE"]

    -c, --useCache
            Load .RData cache in refDir [default "FALSE"]

    -u, --updateCache
            Write .RData cache in refDir after processings all proposals in proposalDir [default "FALSE"]

    --msl
            Write resulting MSL to load_msl.sql and msl.tsv [default "FALSE"]

    -i PROPOSALSDIR, --proposalsDir=PROPOSALSDIR
            Directory to scan for YYYY.###SC.*.xlsx proposal files [default "proposalsTest"]

    -o OUTDIR, --outDir=OUTDIR
            Directory to write outputs to [default "results"]

    -r REFDIR, --refDir=REFDIR
            Directory from which read current MSL and CV data from [default "current_msl"]

    --mslTsv=MSLTSV
            Output file, in outDir, for resulting MSL w/o IDs (for diff) [default "msl.tsv"]

    --mslLoadSql=MSLLOADSQL
            Output file, in outDir, for SQL to load new MSL into db [default "msl_load.sql"]

    --sqlInsertBatch=SQLINSERTBATCH
            Number of rows of data per SQL INSERT line in outDir/mslLoadSql file [default "200"]

    --taxnodeIdDelta=TAXNODEIDDELTA
            Amount to increment taxnode_ids by to create a new MSL [default "100000"]

    --dbRanks=DBRANKS
            Reference file listing allowable ranks [default "taxonomy_level.txt"]

    --dbMolecules=DBMOLECULES
            Reference filelisting allowable genomic molecules [default "taxonomy_molecule.txt"]

    --dbTaxa=DBTAXA
            Reference file listing all historic taxa [default "taxonomy_node_export.txt"]

    --cvTemplate=CVTEMPLATE
            Template proposal xlsx, used to load CVs [default "TP_Template_Excel_module_2023_v2.xlsx"]

    --cvTemplateSheet=CVTEMPLATESHEET
            Template proposal xlsx, used to load CVs [default "Menu Items (Do not change)"]

    --vmr=VMR
            VMR to check for accession re-use [default "VMR_21-221122_MSL37.xlsx"]

    --templateURL=TEMPLATEURL
            URL for out-of-date template message [default https://ictv.global/taxonomy/templates]

    --cacheFile=CACHEFILE
            Filename for refDir/cache [default ".RData"]

    --xlsxSupplPat=XLSXSUPPLPAT
            Input files (in proposalDir/) containing this pattern in filename are ignored [default "_Suppl."]

    --xlsxFnameMode=XLSXFNAMEMODE
            Filename format for prposal xlsx files: 'final' (no '.v#') or 'draft' (YYYY.###A.v#.')[default "draft"]

    --newMslName=NEWMSLNAME
            Root node name for new MSL [default "YYYY"]

    --newMslNotes=NEWMSLNOTES
            Description for the new MSL for database loading [default "Provisional EC ##, Online meeting, July YYYY; Email ratification March YYYY (MSL ###)"]

    -h, --help
            Show this help message and exit

*/
