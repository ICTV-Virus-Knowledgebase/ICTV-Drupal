#!/usr/bin/php
<?php

/**
 * 
 * Run the SeqSearch script and update the database with the results.
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
 *  @param string $jobsPath
 *    (required) The job's filesystem path.
 * 
 *  @param string $jobUID
 *    (required) The job's unique alphanumeric identifier (UUID).
 * 
 *  @param string $jsonFilename
 *    (required) The JSON results file.
 * 
 *  @param string $outputPath
 *    (required) The location where result files will be created.
 * 
 *  @param string $scriptName
 *    (required) The Docker script to run.
 * 
 *  @param string $userUID
 *    (required) The user's unique numeric identifier.
 * 
*/

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\DrupalKernel;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_seqsearch_service\Plugin\rest\resource\SequenceSearch;
use Symfony\Component\HttpFoundation\Request;
use Drupal\ictv_common\Utils;


try {
   //-------------------------------------------------------------------------------------------------------
   // Get and validate command line arguments.
   //-------------------------------------------------------------------------------------------------------

   // Store command line arguments in $_GET.
   parse_str(implode('&', array_slice($argv, 1)), $_GET);

   // Get and validate the command line arguments.
   $dbName = $_GET["dbName"];
   if (!$dbName) { throw new \Exception("Invalid dbName parameter"); }

   $drupalRoot = $_GET["drupalRoot"];
   if (!$drupalRoot) { throw new \Exception("Invalid drupalRoot parameter"); }

   $inputPath = $_GET["inputPath"];
   if (!$inputPath) { throw new \Exception("Invalid inputPath parameter"); }

   $jobsPath = $_GET["jobsPath"];
   if (!$jobsPath) { throw new \Exception("Invalid jobsPath parameter"); }

   $jobUID = $_GET["jobUID"];
   if (!$jobUID) { throw new \Exception("Invalid jobUID parameter"); }

   $jsonFilename = $_GET["jsonFilename"];
   if (!$jsonFilename) { throw new \Exception("Invalid jsonFilename parameter"); }

   $outputPath = $_GET["outputPath"];
   if (!$outputPath) { throw new \Exception("Invalid outputPath parameter"); }

   $scriptName = $_GET["scriptName"];
   if (!$scriptName) { throw new \Exception("Invalid scriptName parameter"); }

   $userUID = $_GET["userUID"];
   if (!$userUID) { throw new \Exception("Invalid userUID parameter"); }


   $errorMessage = "";

   // Get the current directory so we can return to it.
   $cwd = getcwd();

   // Navigate to the Drupal root directory.
   chdir($drupalRoot); 

   //-------------------------------------------------------------------------------------------------------
   // Initialize an instance of Drupal.
   //-------------------------------------------------------------------------------------------------------
   $autoloader = require_once 'autoload.php';

   $request = Request::createFromGlobals();

   $kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');

   $kernel->boot();

   // Return to the original working directory.
   chdir($cwd);

   // Get the relative path of this module.
   $moduleHandler = \Drupal::service('module_handler');
   $modulePath = $moduleHandler->getModule(Common::$MODULE_NAME)->getPath();

   // Combine the paths to get the full path of the directory containing the PHP script.
   $workingDirectory = $drupalPath."/".$modulePath."/src/Plugin/rest/resource";

   //-------------------------------------------------------------------------------------------------------
   // Get a connection to the ictv_apps database.
   //-------------------------------------------------------------------------------------------------------
   $connection = \Drupal\Core\Database\Database::getConnection("default", $dbName);
   if (!$connection) { throw new \Exception("The database connection is invalid or null."); }

   //-------------------------------------------------------------------------------------------------------
   // Run the sequence search script. A job status should be returned.
   //-------------------------------------------------------------------------------------------------------
   $jobStatus = SequenceSearch::runSearch($inputPath, $outputPath, $scriptName, $workingDirectory);

   //-------------------------------------------------------------------------------------------------------
   // Update the job's job_file records.
   //-------------------------------------------------------------------------------------------------------
   try {
      // Try to load the tax_results.json file
      if (file_exists($outputPath."/".$jsonFilename)) {

         $jsonString = file_get_contents($outputPath."/".$jsonFilename);

         // Decode the JSON string into a PHP object
         $json = json_decode($jsonString);
         if ($json === null) { throw new \Exception("Invalid ".$jsonFilename." file "); }

         if ($json->data === null || $json->data->files === null) { throw new \Exception("No files were found"); }

         foreach($json->data->files as $file) {

            $fileStatus = JobStatus::error;

            if ($file->errors === null || count($file->errors) < 1) {
               $fileStatus = JobStatus::complete;
            }

            // Update the job file record.
            $sql = "UPDATE job_file SET 
               status_tid = (SELECT id FROM term WHERE full_key = 'job_status.".$fileStatus->value."') 
               WHERE job_id = (SELECT id FROM job WHERE uid = '".$jobUID."' LIMIT 1) 
               AND name = '".$file->name."';";

            $fileQuery = $connection->query($sql);
            $fileResult = $fileQuery->execute();
         }
      }

   } catch (Exception $e) {

      $errorMessage = $e->getMessage();

      // Update the log with the error message.
      \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());

      // Update the job's job_files as unsuccessful.
      $sql = "UPDATE job_file SET 
         status_tid = (SELECT id FROM term WHERE full_key = 'job_status.".JobStatus::error->value."') 
         WHERE job_id = (SELECT id FROM job WHERE uid = '".$jobUID."' LIMIT 1);";

      $fileQuery = $connection->query($sql);
      $fileResult = $fileQuery->execute();
   }

   //-------------------------------------------------------------------------------------------------------
   // Update the job record in the database.
   //-------------------------------------------------------------------------------------------------------
   JobService::updateJob($connection, $errorMessage, $jobUID, $jobStatus, $userUID); 

   fwrite(STDOUT, "Processing is complete");

} catch (Exception $e) {

   $errorMessage = "Unspecified error";
   if ($e) { $errorMessage = $e->getMessage(); }

   // Write the error message to stderr.
   fwrite(STDERR, $errorMessage);

   // Display an error in the Drupal log.
   \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage); 

   exit(1);
}

?>
