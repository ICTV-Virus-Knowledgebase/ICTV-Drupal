<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_proposal_service\Plugin\rest\resource\Terms\JobStatus;
use Psr\Log\LoggerInterface;


class JobService {

    // The path where job directories are created.
    public string $jobsPath;

    // The connection to the ictv_apps database.
    protected Connection $connection;

    /**
     * Provides helpers to operate on files and stream wrappers.
     *
     * @var \Drupal\Core\File\FileSystemInterface
     */
    protected FileSystemInterface $fileSystem;



    public function __construct(Connection $connection, string $jobsPath) {
        $this->connection = $connection;
        $this->fileSystem = \Drupal::service("file_system");
        $this->jobsPath = $jobsPath;
    }



    // Create the job directory and subdirectories.
    public function createDirectories(string $jobUID, string $userUID) {

        // Create a job directory name using the job UID and user UID, and return its full path.
        $path = $this->getJobPath($jobUID, $userUID);
        
        // Create a directory for the job.
        if (!$this->fileSystem->prepareDirectory($path, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create job directory");
            return null;
        }

        //---------------------------------------------------------------------------------------------------------------
        // The proposalsTest subdirectory
        //---------------------------------------------------------------------------------------------------------------
        $proposalsTest = $path."/proposalsTest";

        // Create the directory
        if (!$this->fileSystem->prepareDirectory($proposalsTest, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create proposalsTest subdirectory");
            return null;
        }

        // Update the permissions
        if (!$this->fileSystem->chmod($proposalsTest, 777)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to change permissions on proposalsTest subdirectory");
            return null;
        }

        //---------------------------------------------------------------------------------------------------------------
        // The results subdirectory
        //---------------------------------------------------------------------------------------------------------------
        $results = $path."/results";

        // Create the directory
        if (!$this->fileSystem->prepareDirectory($results, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to create results subdirectory");
            return null;
        }

        // Update the permissions
        if (!$this->fileSystem->chmod($results, 777)) {
            \Drupal::logger('ictv_proposal_service')->error("Unable to change permissions on results subdirectory");
            return null;
        }

        // Return the full path of where the proposal files will be stored.
        return $proposalsTest;
    }


    // Create a file under the specified path (job directory).
    public function createFile(string $data_, string $filename_, string $path_) {

        // Info:
        // https://drupal.stackexchange.com/questions/290701/how-do-i-programmatically-create-a-file-and-write-it-in-the-private-folder 
        // https://api.drupal.org/api/drupal/includes%21file.inc/group/file/7.x

        // The file identifier to return.
        $fileID = null;

        try {
            $fileID = $this->fileSystem->saveData($data_, $path_."/".$filename_, FileSystemInterface::EXISTS_REPLACE);
        }
        catch (FileException $e) {
            \Drupal::logger('ictv_proposal_service')->error($e->getMessage());
        }

        return $fileID;
    }


    /**
     * Creates a job record in the database.
     * Returns the new job's unique ID.
     */
    public function createJob(string $filename, string $userEmail, string $userUID) {

        $jobUID = null;

        // Generate SQL to call the "createJob" stored procedure and return the job UID.
        $sql = "CALL createJob('{$filename}', '{$userEmail}', {$userUID});";

        $query = $this->connection->query($sql);
        $result = $query->fetchAll();
        if ($result && $result[0] !== null) {
            $jobUID = $result[0]->jobUID;
        }

        return $jobUID;
    }


    // The job directory name will combine the user UID and job UID.
    public function getJobPath(string $jobUID, string $userUID) {

        // The job directory name will combine the user UID and job UID.
        return $this->jobsPath."/".$userUID."_".$jobUID;
    }


    // Get all jobs created by the specified user.
    public function getJobs(string $userEmail, string $userUID) {

        $jobs = [];

        // Generate the SQL
        $sql = "SELECT * 
                FROM v_job 
                WHERE user_uid = {$userUID}
                AND user_email = '{$userEmail}'
                ORDER BY created_on DESC";

        // Execute the query and process the results.
        $query = $this->connection->query($sql);
        $result = $query->fetchAll();
        if ($result) {

            foreach ($result as $job) {

                array_push($jobs, array(
                    "id" => $job->id,
                    "completedOn" => $job->completed_on,
                    "createdOn" => $job->created_on,
                    "failedOn" => $job->failed_on,
                    "filename" => $job->filename,
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


    /*public function getProposalFile(string $jobUID, string $userUID) {

        // TODO: should we confirm the job in the database first?

        // https://stackoverflow.com/questions/14011021/how-to-download-a-base64-encoded-image
        $path = $this->getJobPath($jobUID, $userUID);


    }*/

    // Update a job's status, possibly adding a message if the status is "failed".
    // TODO: after upgrading the dev environment to 9.5, make status an enum.
    public function updateJob(string $jobUID, string $message, string $status, string $userUID) {

        // TODO: the updateJob stored procedure needs to be included in CreateIctvAppsDB.sql!!!

        if ($message == null || $message == "") {
            $message = "NULL";
        } else {
            $message = "'{$message}'";
        }

        // Generate SQL to call the "updateJob" stored procedure.
        $sql = "CALL updateJob('{$jobUID}', {$message}, '{$status}', '{$userUID}');";

        $query = $this->connection->query($sql);
        $result = $query->execute();

        // TODO: should we validate the result?
    }

}