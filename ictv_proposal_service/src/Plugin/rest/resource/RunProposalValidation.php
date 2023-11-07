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
use Drupal\ictv_proposal_service\Plugin\rest\resource\ProposalFileSummary;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;


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
    if (!$dbName) { throw new \Exception("Invalid dbName parameter"); }

    $drupalRoot = $_GET["drupalRoot"];
    if (!$drupalRoot) { throw new \Exception("Invalid drupalRoot parameter"); }

    $jobUID = $_GET["jobUID"];
    if (!$jobUID) { throw new \Exception("Invalid jobUID parameter"); }

    $jobPath = $_GET["jobPath"];
    if (!$jobPath) { throw new \Exception("Invalid jobPath parameter"); }

    $proposalsPath = $_GET["proposalsPath"];
    if (!$proposalsPath) { throw new \Exception("Invalid proposalsPath parameter"); }

    $resultsPath = $_GET["resultsPath"];
    if (!$resultsPath) { throw new \Exception("Invalid resultsPath parameter"); }

    $userUID = $_GET["userUID"];
    if (!$userUID) { throw new \Exception("Invalid userUID parameter"); }


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

    \Drupal::logger('ictv_proposal_service')->info("Inside RunProposalValidation.php before getting db connection");

    //-------------------------------------------------------------------------------------------------------
    // Get a connection to the ictv_apps database.
    //-------------------------------------------------------------------------------------------------------
    $connection = \Drupal\Core\Database\Database::getConnection("default", $dbName);
    if (!$connection) { throw new \Exception("The database connection is invalid or null."); }

    //-------------------------------------------------------------------------------------------------------
    // Validate the proposal(s)
    //-------------------------------------------------------------------------------------------------------
    $result = ProposalValidator::runValidation($proposalsPath, $resultsPath, $scriptName, $jobPath);

    // Validate the validation result object and its properties.
    if (!$result || !$result["jobStatus"]) { throw new \Exception("Invalid validation result"); }
    
    $jobStatus = $result["jobStatus"];
    if (!$jobStatus) { throw new \Exception("Result.jobStatus is invalid"); }

    $fileSummaries = $result["fileSummaries"];
    if (!$fileSummaries || sizeof($fileSummaries) < 1) { throw new \Exception("Result.fileSummaries is invalid"); }

    $stdError = $result["stdError"];
    if ($stdError) { \Drupal::logger('ictv_proposal_service')->error($userUID."_".$jobUID.": ".$stdError); }

    
    //-------------------------------------------------------------------------------------------------------
    // Update the job_file records for all proposal files.
    //-------------------------------------------------------------------------------------------------------
    foreach ($fileSummaries as $fileSummary) {

        if (!$fileSummary) { 
            \Drupal::logger('ictv_proposal_service')->error("Unable to update job_file: Invalid file summary"); 
            continue;
        }

        // Update a job file based on the contents of the summary TSV file.
        $sql = "CALL updateJobFile(".
            "{$fileSummary->errors}, ".
            "'{$fileSummary->filename}', ".
            "{$fileSummary->notes}, ".
            "'{$jobUID}', ".
            "{$fileSummary->success}, ".
            "{$fileSummary->warning} ".
        ")";

        $fileQuery = $connection->query($sql);
        $fileResult = $fileQuery->execute();
        // TODO: validate the result?
    }

    //-------------------------------------------------------------------------------------------------------
    // Update the job record in the database.
    //-------------------------------------------------------------------------------------------------------
    JobService::updateJob($connection, $stdError, $jobUID, $jobStatus, $userUID); 

    \Drupal::logger('ictv_proposal_service')->info("After updateJob in RunProposalValidation.php");

    fwrite(STDOUT, "Validation is complete");

} catch (Exception $e) {

    $errorMessage = "Unspecified error";
    if ($e) { $errorMessage = $e->getMessage(); }

    fwrite(STDERR, $errorMessage);
    exit(1);
}

?>
