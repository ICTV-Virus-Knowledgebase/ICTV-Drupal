<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Psr\Log\LoggerInterface;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Utils;


class JobService {

    // The path where job directories are created.
    public string $jobsPath;

    /**
     * Provides helpers to operate on files and stream wrappers.
     *
     * @var \Drupal\Core\File\FileSystemInterface
     */
    protected FileSystemInterface $fileSystem;

    // Directory names for subdirectories of the job directory.
    protected string $proposalsDirectory = "proposalsTest";
    protected string $resultsDirectory = "results";

    // This will be the prefix of the validation summary filename that's returned to the user.
    public string $validationSummaryPrefix = "ictv-proposal-file-results";


    // C-tor
    public function __construct(string $jobsPath) {
        $this->fileSystem = \Drupal::service("file_system");
        $this->jobsPath = $jobsPath;
    }



    // Create the job directory and subdirectories.
    public function createDirectories(string $jobUID, string $userUID) {

        // Create a job directory name using the job UID and user UID, and return its full path.
        $jobPath = $this->getJobPath($jobUID, $userUID);
        
        // Create a directory for the job.
        if (!$this->fileSystem->prepareDirectory($jobPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create job directory");
            return '';
        }

        //---------------------------------------------------------------------------------------------------------------
        // The proposalsTest subdirectory
        //---------------------------------------------------------------------------------------------------------------
        $proposalsPath = $jobPath."/".$this->proposalsDirectory;

        // Create the directory
        if (!$this->fileSystem->prepareDirectory($proposalsPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create proposals subdirectory");
            return '';
        }

        //---------------------------------------------------------------------------------------------------------------
        // The results subdirectory
        //---------------------------------------------------------------------------------------------------------------
        $resultsPath = $jobPath."/".$this->resultsDirectory;

        // Create the directory
        if (!$this->fileSystem->prepareDirectory($resultsPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create results subdirectory");
            return '';
        }

        // Return the full path of the job directory.
        return $jobPath;
    }

    
    /**
     * Creates a job record in the database.
     * Returns the new job's ID and UID.
     */
    public function createJob(Connection $connection, int|null &$jobID, string|null $jobName, string|null &$jobUID, 
        string $userEmail, string $userUID) {

        $jobID = null;
        $jobUID = null;

        if (Utils::isEmptyElseTrim($jobName)) {
            $jobName = "NULL";
        } else {
            $jobName = "'{$jobName}'";
        }

        // Generate SQL to call the "createJob" stored procedure and return the job ID and UID.
        $sql = "CALL createJob({$jobName}, '{$userEmail}', {$userUID});";

        $query = $connection->query($sql);
        $result = $query->fetchAll();
        if ($result && $result[0] !== null) {
            $jobID = $result[0]->jobID;
            $jobUID = $result[0]->jobUID;
        }

        return;
    }

    /**
     * Creates a job file record in the database.
     * Returns the new job file's UID.
     */
    public function createJobFile(Connection $connection, string $fileName, int $jobID, int $uploadOrder) {

        $jobFileUID = null;

        // Generate SQL to call the "createJobFile" stored procedure.
        $sql = "CALL createJobFile('{$fileName}', {$jobID}, {$uploadOrder});";

        // Run the stored procedure and retrieve the job file UID that's returned.
        $query = $connection->query($sql);
        $result = $query->fetchAll();
        if ($result && $result[0] !== null) {
            $jobFileUID = $result[0]->jobFileUID;
        }

        return $jobFileUID;
    }


    // Create the proposal file under the specified path (job directory).
    public function createProposalFile(string $data, string $filename, string $jobPath) {

        $fileNameAndPath = $jobPath."/".$this->proposalsDirectory."/".$filename;

        // The file identifier to return.
        $fileID = null;

        try {
            // Create the file
            $fileID = $this->fileSystem->saveData($data, $fileNameAndPath, FileSystemInterface::EXISTS_REPLACE);

            // Update the permissions
            if (!$this->fileSystem->chmod($fileNameAndPath, 777)) {
                \Drupal::logger('ictv_proposal_service')->error("Unable to change permissions on file ".$filename);
                return null;
            }
        }
        catch (FileException $e) {
            \Drupal::logger('ictv_proposal_service')->error($e->getMessage());
        }

        return $fileID;
    }


    // The job directory name will combine the user UID and job UID.
    public function getJobPath(string $jobUID, string $userUID) {

        // The job directory name will combine the user UID and job UID.
        $jobPath = $this->jobsPath."/".$userUID."_".$jobUID;

        return $jobPath;
    }


    /** 
     * Get all jobs created by the specified user.
     */ 
    public function getJobs(Connection $connection, string $userEmail, string $userUID) {

        $jobs = [];

        // Generate the SQL
        $sql = "SELECT * 
                FROM v_job 
                WHERE user_uid = {$userUID}
                AND user_email = '{$userEmail}'
                ORDER BY created_on DESC";

        // Execute the query and process the results.
        $query = $connection->query($sql);
        $result = $query->fetchAll();
        if ($result) {

            foreach ($result as $job) {

                array_push($jobs, array(
                    "id" => $job->id,
                    "completedOn" => $job->completed_on,
                    "createdOn" => $job->created_on,
                    "failedOn" => $job->failed_on,
                    "jobName" => $job->name,
                    "jobUID" => $job->uid,
                    "message" => $job->message,
                    "status" => $job->status,
                    "type" => $job->type,
                    "uid" => $job->uid,
                    "userEmail" => $job->user_email,
                    "userUID" => $job->user_uid
                ));  
            }
        }

        return $jobs;
    }


    // Use the job path to generate the path of the proposals subdirectory.
    public function getProposalsPath(string $jobPath) {
        $proposalsPath = $jobPath."/".$this->proposalsDirectory;
        return $proposalsPath;
    }


    // Use the job path to generate the path of the results subdirectory.
    public function getResultsPath(string $jobPath) {
        $resultsPath = $jobPath."/".$this->resultsDirectory;
        return $resultsPath;
    }


    // Return an array containing the validation summary file contents, a new filename, and the jobUID.
    public function getValidationSummary(string $filename, string $jobUID, string $userUID) {

        // TODO: should we confirm the job in the database first?

        $jobPath = $this->getJobPath($jobUID, $userUID);

        // Use the job path to generate the path of the results subdirectory.
        $resultsPath = $this->getResultsPath($jobPath);

        $fileID = $resultsPath."/".$filename;

        // Load the file
        $handle = null;
        $fileData = null;

        try {
            // Get a file handle and read its contents.
            $handle = fopen($fileID, "r");
            $fileData = fread($handle, filesize($fileID));

        } catch (Exception $e) {
            \Drupal::logger('ictv_proposal_service')->error($e->getMessage());
            return null;

        } finally {
            if ($handle != null) { fclose($handle); }
        }

        if ($fileData == null) {
            \Drupal::logger('ictv_proposal_service')->error("File data is null");
            return null;
        }

        // Encode the file contents as base64.
        $encodedData = base64_encode($fileData);

        // The index of the last dot.
        $lastDotIndex = strrpos($filename, ".");

        // Get the file extension.
        if ($lastDotIndex && $lastDotIndex > -1) {
            $extension = substr($filename, $lastDotIndex);
        } else {
            // Testing...
            $extension = ".error";
        }
        
        // We will return a new filename that includes the job UID and user UID.
        $newFilename = $this->validationSummaryPrefix.".".$userUID."_".$jobUID.$extension;
        
        return array(
            "filename" => $newFilename,
            "file" => $encodedData,
            "jobUID" => $jobUID 
        );
    }


    // Update a job's status, message, and either completed_on or failed_on.
    // TODO: after upgrading the dev environment to 9.5, make status an enum.
    // TODO: the updateJob stored procedure needs to be included in CreateIctvAppsDB.sql!!!
    public static function updateJob(Connection $connection, string $jobUID, string $message, string $status, string $userUID) {

        $jobID = 0;

        if (Utils::isEmptyOrTrim($message)) {
            $message = "NULL";
        } else {
            $message = "'{$message}'";
        }

        // Generate SQL to call the "updateJob" stored procedure.
        $sql = "CALL updateJob('{$jobUID}', {$message}, '{$status}', '{$userUID}');";

        $query = $connection->query($sql);
        $result = $query->fetchAll();
        if ($result && $result[0] !== null) {
            $jobID = $result[0]->jobID;
        }

        return $jobFileUID;
    }


    // Update a job file based on the contents of the summary TSV file.
    public static function updateJobFile(Connection $connection, int $jobID, ProposalSummary $summary) {

        // Validate the filename
        if (Utils::isEmptyOrTrim($summary->filename)) { throw new Error("Unable to update job file: Invalid filename"); }

        // Use the summary counts to determine the status.
        $status = JobStatus::$valid;
        if ($summary->error > 0 || $summary->warning > 0) { $status = JobStatus::$invalid; }

        // Create a message containing a list of status counts.
        $message = ProposalSummary::createMessage($summary);

        // Generate SQL to call the "updateJobFile" stored procedure.
        $sql = "CALL updateJobFile(".
            "{$summary->error}, ".
            "{$summary->info}, ".
            "'{$summary->filename}', ".
            "{$jobID}, ".
            "'{$status}', ".
            "'{$message}', ".
            "{$summary->success}, ".
            "{$summary->warning} ".
        ")";

        $query = $connection->query($sql);
        $result = $query->execute();

        // TODO: should we validate the result?
    }

}