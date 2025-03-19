<?php

namespace Drupal\ictv_common\Jobs;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Psr\Log\LoggerInterface;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;


// A class to handle job and job_file records.
class JobService {

   // The path where job directories are created.
   public string $jobsPath;

   /**
    * Provides helpers to operate on files and stream wrappers.
    *
    * @var \Drupal\Core\File\FileSystemInterface
    */
   protected FileSystemInterface $fileSystem;

   protected LoggerInterface $logger;

   // Directory names for subdirectories of the job directory (with defaults).
   protected string $inputDirName = "input";
   protected string $outputDirName = "output";

   protected string $parentModule;


   /**
    * Constructs an ICTV JobService object.
    *
    * @param string $jobsPath
    *    The filesystem location where user job files are maintained.
    *
    * @param \Psr\Log\LoggerInterface $logger
    *    A logger instance.
    *
    * @param string $parentModule
    *    The name of the module that is using this job service.
    *
    * @param string $inputDirName
    *    The subdirectory (under a user-specific job directory) for input files (which are generally uploaded).
    *
    * @param string $outputDirName
    *    The subdirectory (under a user-specific job directory) for output files.
    */
   public function __construct(string $jobsPath, LoggerInterface $logger, string $parentModule, string $inputDirName = null, string $outputDirName = null) {

      if (Utils::isEmptyElseTrim($jobsPath)) { throw new Exception("Invalid job path parameter"); }
      $this->jobsPath = $jobsPath;

      $this->logger = $logger;

      if (Utils::isEmptyElseTrim($parentModule)) { throw new Exception("Invalid parent module parameter"); }
      $this->parentModule = $parentModule;

      if (!Utils::isEmptyElseTrim($inputDirName)) { $this->inputDirName = $inputDirName; };
      if (!Utils::isEmptyElseTrim($outputDirName)) { $this->outputDirName = $outputDirName; };

      $this->fileSystem = \Drupal::service("file_system");
   }


   // Create the job directory and subdirectories.
   public function createDirectories(string $jobUID, string $userUID) {

      // Create a job directory name using the job UID and user UID, and return its full path.
      $jobPath = $this->getJobPath($jobUID, $userUID);
      
      // Create a directory for the job.
      if (!$this->fileSystem->prepareDirectory($jobPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         \Drupal::logger($this->parentModule)->error("Unable to create job directory");
         return '';
      }

      // The full path of the input subdirectory.
      $inputPath = $jobPath."/".$this->inputDirName;

      // Create the input subdirectory.
      if (!$this->fileSystem->prepareDirectory($inputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         \Drupal::logger($this->parentModule)->error("Unable to create {$this->inputDirName} subdirectory");
         return '';
      }

      // The full path of the output subdirectory.
      $outputPath = $jobPath."/".$this->outputDirName;

      // Create the output subdirectory.
      if (!$this->fileSystem->prepareDirectory($outputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         \Drupal::logger($this->parentModule)->error("Unable to create {$this->outputDirName} subdirectory");
         return '';
      }

      // Return the full path of the job directory.
      return $jobPath;
   }

   
   /**
    * Creates a job record in the database.
    * Returns the new job's ID and UID.
    */
   public function createJob(Connection $connection, ?int &$jobID, ?string $jobName, JobType $jobType,  
      ?string &$jobUID, string $userEmail, string $userUID) {

      $jobID = null;
      $jobUID = null;

      if (Utils::isEmptyElseTrim($jobName)) {
         $jobName = "NULL";
      } else {
         $jobName = "'{$jobName}'";
      }

      // Generate SQL to call the "createJob" stored procedure and return the job ID and UID.
      $sql = "CALL createJob({$jobName}, '{$jobType->value}', '{$userEmail}', '{$userUID}');";

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

   /**
    * Creates an input file under the specified path (job directory).
    * Returns the new input file's UID.
    */
    public function createInputFile(string $data, string $filename, string $jobPath) {

        $fileNameAndPath = $jobPath."/".$this->inputDirName."/".$filename;

        // The file identifier to return.
        $fileID = null;

        try {
            // Create the file
            $fileID = $this->fileSystem->saveData($data, $fileNameAndPath, FileSystemInterface::EXISTS_REPLACE);

            // Update the permissions
            if (!$this->fileSystem->chmod($fileNameAndPath, 0644)) {
                \Drupal::logger($this->parentModule)->error("Unable to change permissions on file ".$filename);
                return null;
            }
        }
        catch (\FileException $e) {
            \Drupal::logger($this->parentModule)->error($e->getMessage());
        }

        return $fileID;
    }


    // Use the job path to generate the path of the input subdirectory.
   public function getInputPath(string $jobPath) {
      $inputPath = $jobPath."/".$this->inputDirName;
      return $inputPath;
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
   public function getJobs(Connection $connection, JobType $jobType, string $userEmail, string $userUID) {

      // Generate SQL to return JSON for each of the user's jobs.
      $sql = "CALL getJobs('{$jobType->value}', '{$userEmail}', '{$userUID}');";

      // Execute the query and process the results.
      $result = $connection->query($sql);
      $jobsJSON = $result->fetchField(0);

      return $jobsJSON;
   }


   // Return an array containing the output file contents, a new filename, and the jobUID.
   public function getOutputFile(string $filename, string $jobUID, string $outputFilePrefix, string $userUID) {

      // TODO: should we validate the job against the database first?

      $jobPath = $this->getJobPath($jobUID, $userUID);

      // Use the job path to generate the path of the output subdirectory.
      $outputPath = $this->getOutputPath($jobPath);

      $fileID = $outputPath."/".$filename;

      // Load the file
      $handle = null;
      $fileData = null;

      try {
         // Get a file handle and read its contents.
         $handle = fopen($fileID, "r");
         $fileData = fread($handle, filesize($fileID));

      } catch (\Exception $e) {
         \Drupal::logger($this->parentModule)->error($e->getMessage());
         return null;

      } finally {
         if ($handle != null) { fclose($handle); }
      }

      if ($fileData == null) {
         \Drupal::logger($this->parentModule)->error("Invalid file ".$filename." in job ".$jobUID);
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
      
      if (Utils::isNullOrEmpty($outputFilePrefix)) {
         $outputFilePrefix = "";
      } else {
         $outputFilePrefix = $outputFilePrefix.".";
      }

      // We will return a new filename that includes the job UID and user UID.
      $newFilename = $outputFilePrefix.$userUID."_".$jobUID.$extension;
      
      return array(
         "filename" => $newFilename,
         "file" => $encodedData,
         "jobUID" => $jobUID 
      );
   }


   // Use the job path to generate the path of the output subdirectory.
   public function getOutputPath(string $jobPath) {
      $outputPath = $jobPath."/".$this->outputDirName;
      return $outputPath;
   }


   // Populate job.json for the specified job, and job_file.json for all of the job's job_files.
   public function populateJobJSON(Connection $connection, int $jobID) {

      // Generate SQL
      $sql = "CALL populateJobJSON({$jobID});";

      // Execute the query and process the results.
      $result = $connection->query($sql);

      return $result;
   }


   // Update the job record in the database.
   public static function updateJob(Connection $connection, string $errorMessage, string $jobUID, JobStatus $status, string $userUID) {

      if (Utils::isEmptyElseTrim($errorMessage)) {
         $errorMessage = "NULL";
      } else {
         $errorMessage = "'{$errorMessage}'";
      }

      // Generate SQL to call the "updateJob" stored procedure.
      $sql = "CALL updateJob('{$status->value}', {$errorMessage}, '{$jobUID}', '{$userUID}');";

      $query = $connection->query($sql);
      $result = $query->fetchAll();
   }

}