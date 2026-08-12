<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

use Drupal\ictv_taxablast_service\Plugin\rest\resource\Common;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Utils;


class TaxaBLAST {

   // The contents of stdout and stderr will be written to these files.
   public static string $stdErrorFilename = "taxablast_stderr.txt";
   public static string $stdOutFilename = "taxablast_stdout.txt";


   // Run TaxaBLAST from the Docker image.
   public static function runSearch(string $dockerContainer, string $inputPath, int $maxHSPS, int $maxTargetSeqs, string $outputPath, 
      string $scriptName, string $task, string $workingDirectory): JobStatus {

      if (mb_strlen($dockerContainer) < 1) { throw new \Exception("Invalid docker container parameter in runSearch"); }
      if (!is_int($maxHSPS) || $maxHSPS < 1) { throw new \Exception("Invalid maxHSPS parameter in runSearch"); }
      if (!is_int($maxTargetSeqs) || $maxTargetSeqs < 1) { throw new \Exception("Invalid maxTargetSeqs parameter in runSearch"); }
      if (mb_strlen($task) < 1) { throw new \Exception("Invalid task parameter in runSearch"); }

      // Declare variables used below.
      $exitCode = 0;
      $jobStatus = null;
      $stdError = null;
      $stdOut = null;

      $descriptorspec = array(
         0 => array("pipe", "r"), // Read from stdin (not used)
         1 => array("pipe", "w"), // Write to stdout
         2 => array("pipe", "w")  // Write to stderr
      );
      
      // Generate the command to be run. 
      // Note that the "-decode" argument assumes that the input file basenames have been encoded as base64URL  
      // with a sequence number suffix appended, followed by the original file's extension.
      $command = "docker run -v \"{$inputPath}:/seq_in\" -v \"{$outputPath}:/tax_out\" {$dockerContainer} {$scriptName} -decode -max_hsps {$maxHSPS} -max_target_seqs {$maxTargetSeqs} -task {$task}";

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
      catch (\Throwable $e) {

         $jobStatus = JobStatus::error;

         if ($e) { 
            $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
            if (isset($stdError) && $stdError !== '') { $stdError = $stdError . "; "; }
            $stdError = $stdError.$errorMessage; 
         }

         \Drupal::logger(Common::$MODULE_NAME)->error("An error occurred in TaxaBLAST: ".$stdError);
      }

      if ($jobStatus == null) { $jobStatus = JobStatus::crashed; } 

      // If stdout isn't empty, write it to a text file in the output directory.
      $stdOutFile = fopen($outputPath."/".TaxaBLAST::$stdOutFilename, "w");
      if ($stdOutFile !== false) {
         fwrite($stdOutFile, $stdOut);
         fclose($stdOutFile);
      }
      
      // If stderr isn't empty, write it to a text file in the output directory.
      $stdErrorFile = fopen($outputPath."/".TaxaBLAST::$stdErrorFilename, "w");
      if ($stdErrorFile !== false) {
         fwrite($stdErrorFile, $stdError);
         fclose($stdErrorFile);
      }

      // Add errors to the Drupal log.
      if ($stdError) { \Drupal::logger(Common::$MODULE_NAME)->error("Errors in ".$outputPath.": ".$stdError); }

      return $jobStatus;
   }
};


