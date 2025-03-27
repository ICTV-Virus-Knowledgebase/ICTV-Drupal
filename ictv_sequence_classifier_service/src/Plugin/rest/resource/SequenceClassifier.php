<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\Common;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Utils;


class SequenceClassifier {

   // The contents of stdout and stderr will be written to these files.
   public static string $stdErrorFilename = "stderr.txt";
   public static string $stdOutFilename = "stdout.txt";


   // Run the ictv_sequence_classifier from the docker image.
   public static function runClassifier(string $inputPath, string $jsonFilename, string $outputPath, 
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
      $command = "docker run -v \"{$inputPath}:/seq_in\" -v \"{$outputPath}:/tax_out\" ".$scriptName." -v ";  // NOTE: seq_in\" previously ended in :ro

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

         \Drupal::logger(Common::$MODULE_NAME)->error("An error occurred in SequenceClassifier: ".$stdError);
      }

      if ($jobStatus == null) { $jobStatus = JobStatus::crashed; } 

      // If stdout isn't empty, write it to a text file in the output directory.
      $stdOutFile = fopen($outputPath."/".SequenceClassifier::$stdOutFilename, "w");
      if ($stdOutFile !== false) {
         fwrite($stdOutFile, $stdOut);
         fclose($stdOutFile);
      }
      
      // If stderr isn't empty, write it to a text file in the output directory.
      $stdErrorFile = fopen($outputPath."/".SequenceClassifier::$stdErrorFilename, "w");
      if ($stdErrorFile !== false) {
         fwrite($stdErrorFile, $stdError);
         fclose($stdErrorFile);
      }

      return $jobStatus;
   }

   /* 
   
   Here are some details Curtis provided about the command:

   Test code for running the container: https://github.com/ICTV-Virus-Knowledgebase/VMR_to_BlastDB/blob/cbdeb5822a0bf415f046f9de70fdb69f7acff6bb/docker_run.sh#L15

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

   IN_DIR:  seq_in
   OUT_DIR: tax_out
   OUT_JSON: tax_results.json

   */
};


