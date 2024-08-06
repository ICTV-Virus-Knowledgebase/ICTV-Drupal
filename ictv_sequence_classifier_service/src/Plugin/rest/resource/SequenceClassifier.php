<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\ClassificationResults;
use Drupal\ictv_common\JobStatus;
use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\SummaryFile;
use Drupal\ictv_common\Utils;


class SequenceClassifier {


   // Load the JSON file containing the classification results.
   public static function loadJsonResults(string $filename): ClassificationResults {

      if (Utils::isNullOrEmpty($filename)) { throw new \Exception("Unable to load JSON results: Invalid filename"); }

      // Read the JSON file
      $jsonString = file_get_contents($filename);

      // Decode the JSON data into an associative array
      $jsonData = json_decode($jsonString, true);

      // Create an instance of ClassificationResults and populate it with the JSON data.
      return ClassificationResults::fromArray($jsonData);
   }


   /* Here are some details Curtis provided about the command:


   sudo docker run -v ./out:/tax_out curtish/ictv_sequence_classifier:latest -h

         usage: classify_sequence [-h] [-verbose] [-indir INDIR] [-outdir OUTDIR]
                         [-json JSON]
 
         options:
         -h, --help      show this help message and exit
         -verbose        print details during run
         -indir INDIR    directory for fasta files with NUCLEOTIDE seqeunces to
                           classify
         -outdir OUTDIR  output directory for tax_results.json
         -json JSON      output json filename

   */
  
   /*
   // TODO: this needs to be overhauled from its proposal service predecessor.
   public static function runClassifier(string $proposalsPath, string $resultsPath, string $scriptName, string $workingDirectory) {

      // Declare variables used in the try/catch block.
      $result = null;
      $jobStatus = null;
      $stdError = null;
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

         if (is_resource($process)) {
               // $pipes now looks like this:
               // 0 => writeable handle connected to child stdin
               // 1 => readable handle connected to child stdout
               // 2 => writeable handle connected to child stderr

               // Note: We're not using the stdin pipe.

               // Get stdout
               $result = stream_get_contents($pipes[1]);
               fclose($pipes[1]);

               // Get stderror
               $stdError = stream_get_contents($pipes[2]);
               fclose($pipes[2]);

               // It is important that you close any pipes before calling proc_close in order to avoid a deadlock.
               proc_close($process);

               // In this case "pending complete validation".
               $jobStatus = JobStatus::$pending;

         } else {
               $jobStatus = JobStatus::$crashed;
               $stdError = "Process is not a resource";
         }

         if ($jobStatus != JobStatus::$crashed) {

               // Parse the summary TSV file for proposal filenames and their status counts (file summaries).
               $fileSummaries = ProposalFileSummary::getFileSummaries($resultsPath);
   
               // If no file summaries were found, return a job status of "crashed".
               if (!$fileSummaries || sizeof($fileSummaries) < 1) { $jobStatus = JobStatus::$crashed; }
         }
      } 
      catch (Exception $e) {

         $jobStatus = JobStatus::$crashed;

         if ($e) { 
               if (isset($stdError) && $stdError !== '') { $stdError = $stdError . "; "; }
               $stdError = $stdError.$e->getMessage(); 
         }

         \Drupal::logger('ictv_proposal_service')->error("An error occurred in ProposalValidator: ".$stdError);
      }

      if ($jobStatus == null) { $jobStatus = JobStatus::$crashed; } 

      return array(
         "command" => $command,
         "fileSummaries" => $fileSummaries,
         "jobStatus" => $jobStatus,
         "stdError" => $stdError
      );
   }*/

};


