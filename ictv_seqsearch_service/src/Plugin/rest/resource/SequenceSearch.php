<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Utils;


class SequenceSearch {

   // The contents of stdout and stderr will be written to these files.
   public static string $stdErrorFilename = "stderr.txt";
   public static string $stdOutFilename = "stdout.txt";


   // Run the ictv_sequence_classifier from the docker image.
   public static function runSearch(string $inputPath, string $jsonFilename, string $outputPath, 
      string $scriptName, string $workingDirectory): JobStatus {

      // Declare variables used below.
      $exitCode = 0;
      $jobStatus = null;
      $jsonText;
      $stdError = null;
      $stdOut = null;

      $descriptorspec = array(
         0 => array("pipe", "r"), // Read from stdin (not used)
         1 => array("pipe", "w"), // Write to stdout
         2 => array("pipe", "w")  // Write to stderr
      );
      
      // Generate the command to be run.
      $command = "docker run -v \"{$inputPath}:/seq_in\" -v \"{$outputPath}:/tax_out\" ".$scriptName." -v ";

      try {
         $process = proc_open($command, $descriptorspec, $pipes, $workingDirectory);

         if (is_resource($process)) {
            
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
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
            if ($exitCode !== 0) { 
               $jobStatus = JobStatus::error;
            } else {
               $jobStatus = JobStatus::complete;
            }

         } else {
            $jobStatus = JobStatus::crashed;
            $stdError = "Process is not a resource";
         }
      } 
      catch (Exception $e) {

         $jobStatus = JobStatus::error;

         if ($e) { 
            if (isset($stdError) && $stdError !== '') { $stdError = $stdError . "; "; }
            $stdError = $stdError.$e->getMessage(); 
         }

         \Drupal::logger(Common::$MODULE_NAME)->error("An error occurred in SequenceSearch: ".$stdError);
      }

      if ($jobStatus == null) { $jobStatus = JobStatus::crashed; } 

      // If stdout isn't empty, write it to a text file in the output directory.
      $stdOutFile = fopen($outputPath."/".SequenceSearch::$stdOutFilename, "w");
      if ($stdOutFile !== false) {
         fwrite($stdOutFile, $stdOut);
         fclose($stdOutFile);
      }
      
      // If stderr isn't empty, write it to a text file in the output directory.
      $stdErrorFile = fopen($outputPath."/".SequenceSearch::$stdErrorFilename, "w");
      if ($stdErrorFile !== false) {
         fwrite($stdErrorFile, $stdError);
         fclose($stdErrorFile);
      }

      return $jobStatus;
   }
};


