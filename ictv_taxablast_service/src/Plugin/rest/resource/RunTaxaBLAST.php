#!/usr/bin/php
<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

use Drupal\ictv_taxablast_service\Plugin\rest\resource\Common;
use Drupal\Core\DrupalKernel;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\TaxaBLAST;
use Drupal\ictv_taxablast_service\Plugin\rest\resource\TaxaBlastJob;
use Symfony\Component\HttpFoundation\Request;
use Drupal\ictv_common\Utils;

/**
 * 
 * Run the TaxaBLAST script and update the database with the results.
 *
 *  The following are the command line arguments that are expected by this script:
 * 
 *  @param string $dbName
 *    (required) The name of the MySQL database (probably "ictv_apps").
 * 
 *  @param string $drupalRoot
 *    (required) The path of the Drupal installation (Ex. "/var/www/drupal/site").
 * 
 *  @param string $inputPath
 *    (required) The location of the FASTA file(s).
 *  
 *  @param string $jobUID
 *    (required) The job's unique alphanumeric identifier (UUID).
 * 
 *  @param string $jsonFilename
 *    (required) The JSON results file.
 * 
 *  @param int $maxHSPS
 *    The maximum number of HSPs to return per query sequence.
 * 
 *  @param int $maxTargetSeqs
 *    The maximum number of target sequences to return per query sequence.
 * 
 *  @param string $outputPath
 *    (required) The location where result files will be created.
 * 
 *  @param string $scriptName
 *    (required) The Docker script to run.
 * 
 *  @param string $task
 *    The BLAST task to use. Valid values are "blastn", "megablast", and "dc-megablast".
 * 
 *  @param string $userUID
 *    (required) The user's unique numeric identifier.
 * 
*/

try {
   //-------------------------------------------------------------------------------------------------------
   // Get and validate command line arguments.
   //-------------------------------------------------------------------------------------------------------

   // Store command line arguments in $_GET.
   parse_str(implode('&', array_slice($argv, 1)), $_GET);

   // Get and validate the command line arguments.
   $dbName = $_GET["dbName"];
   if (!$dbName) { throw new \Exception("Invalid dbName parameter"); }

   $dockerContainer = $_GET["dockerContainer"];
   if (!$dockerContainer) { throw new \Exception("Invalid dockerContainer parameter"); }

   $drupalRoot = $_GET["drupalRoot"];
   if (!$drupalRoot) { throw new \Exception("Invalid drupalRoot parameter"); }

   $inputPath = $_GET["inputPath"];
   if (!$inputPath) { throw new \Exception("Invalid inputPath parameter"); }

   $jobUID = $_GET["jobUID"];
   if (!$jobUID) { throw new \Exception("Invalid jobUID parameter"); }

   $jsonFilename = $_GET["jsonFilename"];
   if (!$jsonFilename) { throw new \Exception("Invalid jsonFilename parameter"); }

   $maxHSPS = $_GET["maxHSPS"];
   if (!$maxHSPS || !is_numeric($maxHSPS) || (int)$maxHSPS < 1) { throw new \Exception("Invalid maxHSPS parameter"); }
   $maxHSPS = (int)$maxHSPS;

   $maxTargetSeqs = $_GET["maxTargetSeqs"];
   if (!$maxTargetSeqs || !is_numeric($maxTargetSeqs) || (int)$maxTargetSeqs < 1) { throw new \Exception("Invalid maxTargetSeqs parameter"); }
   $maxTargetSeqs = (int)$maxTargetSeqs;
   
   $outputPath = $_GET["outputPath"];
   if (!$outputPath) { throw new \Exception("Invalid outputPath parameter"); }

   $scriptName = $_GET["scriptName"];
   if (!$scriptName) { throw new \Exception("Invalid scriptName parameter"); }

   $task = $_GET["task"];
   if (mb_strlen($task) < 1) { throw new \Exception("Invalid task parameter"); }

   $userUID = $_GET["userUID"];
   if (!$userUID) { throw new \Exception("Invalid userUID parameter"); }


   // Variables that will be used below and need initial values.
   $connection = NULL;
   $drupalInitialized = false;
   $errorMessage = "";
   $jobID = NULL;
   $jobStatus = NULL;
   $jobStatusValue = "error";
   $jsonForSQL = NULL;
   $message = NULL; // TODO: Is this needed?

   // Get the current directory so we can return to it.
   $cwd = getcwd();

   // Navigate to the Drupal root directory.
   chdir($drupalRoot); 

   //-------------------------------------------------------------------------------------------------------
   // Initialize a minimal instance of Drupal.
   //-------------------------------------------------------------------------------------------------------
   try {
      $autoloader = require_once 'autoload.php';

      $request = \Symfony\Component\HttpFoundation\Request::create('/');
      $kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');

      $kernel->boot();
      $drupalInitialized = true;

   } catch (\Throwable $initError) {
      $initErrorMessage = method_exists($initError, "getMessage") ? $initError->getMessage() : get_class($initError);
      fwrite(STDERR, "Drupal initialization failed: " . $initErrorMessage);
      exit(1);
   }

   // If the kernel was not successfully initialized, write the error to stderr.
   if (!class_exists("\Drupal\Core\DrupalKernel")) { 
      fwrite(STDERR, "Drupal could not be initialized");
      exit(1); 
   }

   // Now that Drupal has been initialized, validate the task parameter.
   if (!in_array($task, Common::$VALID_BLAST_TASKS)) { throw new \Exception("Invalid BLAST task parameter '".$task."'"); }

   // Return to the original working directory.
   chdir($cwd);

   // Get the relative path of this module.
   $moduleHandler = \Drupal::service('module_handler');
   $modulePath = $moduleHandler->getModule(Common::$MODULE_NAME)->getPath();

   // Combine the paths to get the full path of the directory containing the PHP script.
   $workingDirectory = $drupalRoot."/".$modulePath."/src/Plugin/rest/resource";

   //-------------------------------------------------------------------------------------------------------
   // Get a connection to the ictv_apps database.
   //-------------------------------------------------------------------------------------------------------
   $connection = \Drupal\Core\Database\Database::getConnection("default", $dbName);
   if (!$connection) { throw new \Exception("The database connection is invalid or null."); }

   //-------------------------------------------------------------------------------------------------------
   // Run the TaxaBLAST script and return a job status.
   //-------------------------------------------------------------------------------------------------------
   $jobStatus = TaxaBLAST::runSearch($dockerContainer, $inputPath, $maxHSPS, $maxTargetSeqs, $outputPath, $scriptName, $task, $workingDirectory);
   $jobStatusValue = $jobStatus->value;
   
   // TODO: Delete the input files after TaxaBLAST completes.

   if ($jobStatus !== JobStatus::complete) { 
      throw new \Exception("TaxaBLAST exited with status \"".$jobStatusValue."\""); 
   }

   // Open and read the JSON file that should've been generated by TaxaBLAST.
   $json = file_get_contents($outputPath."/".$jsonFilename);

   if (!$json) { 
      $jobStatus = JobStatus::error;
      $jobStatusValue = $jobStatus->value;
      throw new \Exception("Error reading the JSON results file: ".$jsonFilename);
   }

   // Convert the JSON text into a Taxonomy result (nested array).
   $taxResult = json_decode($json, true);
   if ($taxResult === null && json_last_error() !== JSON_ERROR_NONE) {
      $jobStatus = JobStatus::error;
      $jobStatusValue = $jobStatus->value;
      throw new \Exception("JSON data is invalid after conversion: ".json_last_error_msg());
   }

   // Create a copy of the JSON encoded as hexadecimal.
   $jsonForSQL = bin2hex($json);

   // Update the job's JSON and status.
   TaxaBlastJob::updateJobJSON($connection, $jobID, $jobUID, $jsonForSQL, $message, $jobStatus);

   // Get the job directory/path using the output path (one level below the job directory)
   $jobPath = dirname($outputPath);

   // Gzip all CSV and HTML result files in the output directory.
   $outputDirectory = new \DirectoryIterator($outputPath);
   foreach ($outputDirectory as $fileInfo) {

      if (!$fileInfo->isFile()) { continue; }

      // We're only interested in CSV and HTML files.
      $ext = strtolower($fileInfo->getExtension());
      if ($ext !== "csv" && $ext !== "html") { continue; }

      // Get the filename 
      $filename = $fileInfo->getFilename();

      // If the compressed file does not already exist, create it.
      if (!file_exists($outputPath.'/'.$filename.".gz")) { 
         Common::createCompressedFile($filename, $outputPath); 
      }
   }

   // Zip the contents of the job directory and save in the output subdirectory.
   //Common::copyOutputFilesAndZip($jobPath, $jobUID, $outputPath);

   try {
      // Is the "files" attribute valid?
      if (empty($taxResult['files'])) { throw new \Exception("The taxonomy result JSON does not have a \"files\" attribute."); }

      // Update the job's job_file database record(s).
      foreach($taxResult['files'] as $file) {

         if ($file === null || Utils::isNullOrEmpty($file["filename"])) {
            \Drupal::logger("ictv_taxablast_service")->error($errorMessage);
         }

         $parameters = [
            ':filename' => $file["filename"],
            ':jobStatus' => "job_status.".$jobStatusValue, 
            ':jobUID' => $jobUID
         ];

         // Update the job file record.
         $sql = "
            UPDATE job_file SET status_tid = (
               SELECT id FROM term WHERE full_key = :jobStatus LIMIT 1
            ) 
            WHERE job_id = (
               SELECT id FROM job WHERE uid = :jobUID LIMIT 1
            ) 
            AND filename = :filename 
         ";

         $connection->query($sql, $parameters);
      }  
      
   } catch (\Throwable $ex) {

      $errorMessage = method_exists($ex, "getMessage") ? $ex->getMessage() : get_class($ex);

      // Update the log with the error message.
      \Drupal::logger("ictv_taxablast_service")->error($errorMessage);

      // Update the job's job_files as unsuccessful.
      $sql = "
         UPDATE job_file SET status_tid = (
            SELECT id FROM term WHERE full_key = 'job_status.error'
         ) 
         WHERE job_id = (
            SELECT id FROM job WHERE uid = '".$jobUID."' LIMIT 1
         )";

      $connection->query($sql);
   }
   
} catch (\Throwable $e) {

   $jobStatusValue = "error";

   $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);

   // Write the error message to stderr.
   fwrite(STDERR, $errorMessage);

   // If Drupal was initialized, display an error in the Drupal log.
   if ($drupalInitialized && class_exists("\Drupal\Core\DrupalKernel")) {
      \Drupal::logger("ictv_taxablast_service")->error($errorMessage);
   }

   if (mb_strlen($jobUID) > 0 && $drupalInitialized && $connection !== NULL) {

      if ($jobStatus === null) { $jobStatus = JobStatus::error; }

      // Update the job's JSON and status.
      TaxaBlastJob::updateJobJSON($connection, $jobID, $jobUID, $jsonForSQL, $errorMessage, $jobStatus);

   } elseif ($drupalInitialized) {
      \Drupal::logger("ictv_taxablast_service")->error("Invalid jobUID in RunTaxaBLAST.php");
   }

   exit(1);
}

?>