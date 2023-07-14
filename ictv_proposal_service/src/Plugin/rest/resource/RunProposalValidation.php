#!/usr/bin/php
<?php

/**
   * Run the proposal validation script and update the database with the results.
   *
   * The following are the command line arguments that are expected by this script:
   * 
   * @param string $dbName
   *   (required) The name of the MySQL database (probably "ictv_apps").
   *
   * @param string $drupalRoot
   *   (required) The path of the Drupal installation (Ex. "/var/www/drupal/site").
   *
   * @param string $jobUID
   *   (required) The job's unique alphanumeric identifier (UUID).
   *
   * @param string $jobPath
   *   (required) The job's filesystem path.
   *
    * @param string $proposalsPath
   *   (required) The location of the proposal file(s).
   *
   * @param string $resultsPath
   *   (required) The location where result files will be created.
   *
   * @param string $userUID
   *   (required) The user's unique numeric identifier.
   *
   */

use Drupal\Core\DrupalKernel;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_proposal_service\Plugin\rest\resource\JobService;
use Drupal\ictv_proposal_service\Plugin\rest\resource\JobStatus;
use Drupal\ictv_proposal_service\Plugin\rest\resource\ProposalValidator;
use Symfony\Component\HttpFoundation\Request;
use Drupal\ictv_proposal_service\Plugin\rest\resource\SummaryFile;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;

// The contents of this log will be written to log.txt at the end.
$log = "";

// Moving the scope of this variable.
$resultsPath = "";

// The name of the validator script.
$scriptName = "curtish/ictv_proposal_processor";

try {
    //-------------------------------------------------------------------------------------------------------
    // Get and validate command line arguments.
    //-------------------------------------------------------------------------------------------------------

    // Store command line arguments in $_GET.
    parse_str(implode('&', array_slice($argv, 1)), $_GET);

    // Get and validate the command line arguments.
    $dbName = $_GET["dbName"];
    if (!$dbName) { throw new Exception("Invalid dbName parameter"); }

    $drupalRoot = $_GET["drupalRoot"];
    if (!$drupalRoot) { throw new Exception("Invalid drupalRoot parameter"); }

    $jobUID = $_GET["jobUID"];
    if (!$jobUID) { throw new Exception("Invalid jobUID parameter"); }

    $jobPath = $_GET["jobPath"];
    if (!$jobPath) { throw new Exception("Invalid jobPath parameter"); }

    $proposalsPath = $_GET["proposalsPath"];
    if (!$proposalsPath) { throw new Exception("Invalid proposalsPath parameter"); }

    $resultsPath = $_GET["resultsPath"];
    if (!$resultsPath) { throw new Exception("Invalid resultsPath parameter"); }

    $userUID = $_GET["userUID"];
    if (!$userUID) { throw new Exception("Invalid userUID parameter"); }



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

    require_once 'core/includes/schema.inc';

    // Return to the original working directory.
    chdir($cwd);

    \Drupal::logger('ictv_proposal_service')->info("executing RunProposalValidation in {$cwd}");

    //-------------------------------------------------------------------------------------------------------
    // Get a connection to the ictv_apps database.
    //-------------------------------------------------------------------------------------------------------
    $connection = \Drupal\Core\Database\Database::getConnection("default", $dbName);
    if (!$connection) { throw new Exception("The database connection is invalid or null."); }

    //-------------------------------------------------------------------------------------------------------
    // Validate the proposal(s)
    //-------------------------------------------------------------------------------------------------------
    $result = ProposalValidator::runValidation($proposalsPath, $resultsPath, $scriptName, $jobPath);

    $jobStatus = $result["jobStatus"];
    if (!$jobStatus) { throw new Exception("Result.jobStatus is invalid"); }

    // Validate the validation result object.
    $summaries = $result["summaries"];
    if (!$summaries || sizeof($summaries) < 1) { throw new Exception("Result.summaries is invalid"); }

    $stdError = $result["stdError"];
    if ($stdError) {
        // TODO: How should we report a std error? Update the job record?
        \Drupal::logger('ictv_proposal_service')->error($userUID."_".$jobUID.": ".$stdError);
    }

    $totals = $result["totals"];
    if (!$totals) { throw new Exception("Result.totals is invalid"); }

    // Create a job summary message using the total counts.
    $jobMessage = ProposalSummary::createMessage($totals);

    //-------------------------------------------------------------------------------------------------------
    // Update the job record in the database.
    //-------------------------------------------------------------------------------------------------------
    $jobID = JobService::updateJob($connection, $jobUID, $jobMessage, $jobStatus, $userUID); 

    //-------------------------------------------------------------------------------------------------------
    // Update the job_file records for all proposal files.
    //-------------------------------------------------------------------------------------------------------
    foreach ($summaries as $summary) {

        // Update a job file based on the contents of the summary TSV file.
        JobService::updateJobFile($connection, $jobID, $summary);
    }

    fwrite(STDOUT, "Validation is complete");

    $log = "Validation is complete";

} catch (Exception $e) {

    $errorMessage = null;
    if ($e) { 
        $errorMessage = $e->getMessage(); 
    } else {
        $errorMessage = "Unspecified error";
    }

    $log = $errorMessage;

    fwrite(STDERR, $errorMessage);
    exit(1);

} finally {
    \Drupal::logger('ictv_proposal_service')->info("in finally, resultsPath = {$resultsPath}");
    $fileID = \Drupal::service("file_system")->saveData($log, $resultsPath."/log.txt", FileSystemInterface::EXISTS_REPLACE);
}


?>
