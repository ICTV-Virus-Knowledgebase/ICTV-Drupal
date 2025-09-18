<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;


class SeqSearchJob {

   /**
    * Creates a job record in the database.
    * Returns the new job's ID and UID.
    */
   public static function createJob(Connection $connection, ?int &$jobID, ?string $jobName, ?string &$jobUID, string $userEmail, string $userUID): bool {

      $jobID = null;
      $jobUID = null;

      if (Utils::isEmptyElseTrim($jobName)) { $jobName = null; }

      // Populate the stored procedure's parameters.
      $parameters = [":jobName" => $jobName, ":jobType" => JobType::sequence_search->value, ":userEmail" => $userEmail, ":userUID" => $userUID];

      // Generate SQL to call the "createJob" stored procedure and return the job ID and UID.
      $sql = "CALL createJob(:jobName, :jobType, :userEmail, :userUID);";

      // Run the query
      $query = $connection->query($sql, $parameters);
      if (!$query) { return false; }
      
      // Get the result.
      $result = $query->fetchAssoc();
      if (!$result) { return false; }

      $jobID = $result["jobID"];
      $jobUID = $result["jobUID"];

      return true;
   }


   /**
    * Creates a job file record in the database.
    */
   public static function createJobFileRecord(Connection $connection, string $fileName, int $jobID, int $uploadOrder): bool {

      try {
         // Populate the stored procedure's parameters.
         $parameters = [":fileName" => $fileName, ":jobID" => $jobID, ":uploadOrder" => $uploadOrder];

         // Generate SQL to call the "createJobFile" stored procedure.
         $sql = "CALL createJobFile(:fileName, :jobID, :uploadOrder);";

         // Run the query
         $query = $connection->query($sql, $parameters);
         if (!$query) { return false; }
         
         // Get the result.
         $result = $query->fetchAssoc();
         if (!$result) { return false; }

      } catch (\Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return false;
      }

      return true;
   }


   /**
    * Create the job directory and subdirectories.
    *
    * @param string $inputDirName   The input directory name (from the config file)
    * @param string $jobsPath       The parent directory where job folders are created (from the config file)
    * @param string $jobUID         A job's unique identifier (UUID)
    * @param string $outputDirName  The output directory name (from the config file)
    * @return string                The full path of the newly-created job folder
    */
   public static function createJobFolder(string $inputDirName, string $jobsPath, string $jobUID, string $outputDirName): string {

      // Validate input parameters
      if (Utils::isNullOrEmpty($inputDirName)) { throw new \InvalidArgumentException("Invalid input directory name parameter"); }
      if (Utils::isNullOrEmpty($jobsPath)) { throw new \InvalidArgumentException("Invalid jobs path parameter"); }
      if (Utils::isNullOrEmpty($jobUID)) { throw new \InvalidArgumentException("Invalid job UID parameter"); }
      if (Utils::isNullOrEmpty($outputDirName)) { throw new \InvalidArgumentException("Invalid output directory name parameter"); }

      // Create an alias for the file system service.
      $fileSystem = \Drupal::service("file_system");

      // The new job directory path.
      $jobPath = $jobsPath.DIRECTORY_SEPARATOR.$jobUID;
      
      // Create the job directory
      if (!$fileSystem->prepareDirectory($jobPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         throw new \Exception("Unable to create the job directory");
      }

      // The full path of the input subdirectory
      $inputPath = $jobPath.DIRECTORY_SEPARATOR.$inputDirName;

      // Create the input subdirectory
      if (!$fileSystem->prepareDirectory($inputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         throw new \Exception("Unable to create {$inputDirName} subdirectory");
      }

      // The full path of the output subdirectory.
      $outputPath = $jobPath.DIRECTORY_SEPARATOR.$outputDirName;

      // Create the output subdirectory.
      if (!$fileSystem->prepareDirectory($outputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         throw new \Exception("Unable to create {$outputDirName} subdirectory");
      }

      // Return the full path of the new job directory.
      return $jobPath;
   }
   

   /*
   // Create an invalid SeqSearch Job "object" (nested arrays) to return when a job is not found or is invalid.
   public static function createInvalidJob(string $jobName, string $message, JobStatus $status, string $jobUID) {

      // TODO: Validate input parameters?

      // TODO: get current datetime as string or let the DB provide defaults?
      $createdOn = null; 
      $endedOn = null; 

      return [
         "createdOn" => $createdOn,
         "data" => null,
         "endedOn" => $endedOn,
         "files" => null,
         "name" => $jobName,
         "message" => $message,
         "status" => $status->value,
         "uid" => $jobUID
      ];
   }*/


   // Return a SeqSearch Job "object" (nested arrays) from a row of database results.
   public static function fromArray(array $row) {

      if ($row == null) { return null; }

      // Get and validate columns in the row.
      $createdOn = $row["created_on"];
      if (Utils::isNullOrEmpty($createdOn)) { $createdOn = ""; }

      $endedOn = $row["ended_on"];
      if (Utils::isNullOrEmpty($endedOn)) { $endedOn = ""; }

      $message = $row["message"];
      if (Utils::isNullOrEmpty($message)) { $message = ""; }

      $name = $row["name"];
      if (Utils::isNullOrEmpty($name)) { $name = ""; }

      $strStatus = $row["status"];
      $status = JobStatus::tryFrom($strStatus);
      if ($status == null) { $status = JobStatus::error; }

      $uid = $row["uid"];
      if (Utils::isNullOrEmpty($uid)) { return null; }


      // The deserialized JSON.
      $data = null;

      $json = $row["json"];
      if (!Utils::isNullOrEmpty($json)) { 

         // Convert the JSON from hexadecimal back to a string.
         $json = hex2bin($json);

         // Convert the JSON to nested arrays.
         $data = json_decode($json, true);
         if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            \Drupal::logger('ictv_seqsearch_service')->error("JSON data is invalid after conversion in fromArray");
         }
      }

      return [
         "createdOn" => $createdOn,
         "data" => $data,
         "endedOn" => $endedOn,
         "files" => null,
         "name" => $name,
         "message" => $message,
         "status" => $status->value,
         "uid" => $uid
      ];
   }


   // Get the job and result metadata generated by SeqSearch.
   public static function getJob(Connection $connection, string $jobUID) {

      // Validate input parameters
      if (Utils::isNullOrEmpty($jobUID)) { throw new \Exception("Invalid job UID in getJob()"); }

      // Populate the stored procedure's parameters.
      $parameters = [":jobType" => JobType::sequence_search->value, ":jobUID" => $jobUID];

      // Generate SQL to call the "getSeqSearchJob" stored procedure.
      $sql = "CALL getSeqSearchJob(:jobType, :jobUID);";

      try {
         // Run the query
         $result = $connection->query($sql, $parameters);
         if (!$result) { return null; }
      } 
      catch (Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
      }

      // Get (what should be) the single row.
      $row = $result->fetchAssoc();
      if (!$row) { return null; }

      return SeqSearchJob::fromArray($row);
   }


   // Search a user's TaxaBLAST jobs.
   public static function searchJobs(Connection $connection, ?string $searchText, string $userUID) {

      // Validate input parameters
      if (Utils::isNullOrEmpty($userUID)) { throw new \Exception("Invalid user UID in searchJobs()"); }

      // Populate the stored procedure's parameters.
      $parameters = [":jobType" => JobType::sequence_search->value, ":searchText" => $searchText, ":userUID" => $userUID];

      // Generate SQL to call the "searchTaxaBlastJobs" stored procedure.
      $sql = "CALL searchTaxaBlastJobs(:jobType, :searchText, :userUID);";

      try {
         // Run the query
         $rows = $connection->query($sql, $parameters)->fetchAll(\PDO::FETCH_ASSOC);
         if (!$rows) { return null; }
      } 
      catch (Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
      }

      $jobs = [];

      // Iterate over the result rows and populate the jobs array.
      foreach($rows as $row) {

         $job = SeqSearchJob::fromArray($row);
         array_push($jobs, $job);
      }

      return $jobs;
   }


   // Update the job's JSON 
   public static function updateJobJSON(Connection $connection, ?int $jobID, ?string $jobUID, 
      ?string $json, ?string $message, JobStatus $status) {

      try {
         // Populate the stored procedure's parameters.
         $parameters = [
            ":jobID" => $jobID, 
            ":jobUID" => $jobUID, 
            ":json" => $json, 
            ":message" => $message,
            ":status" => $status->value
         ];

         // Generate SQL to call the stored procedure.
         $sql = "CALL updateJobJSON(:jobID, :jobUID, :json, :message, :status)";

         // Run the query
         $result = $connection->query($sql, $parameters);
         if (!$result) { return null; }

      } catch (\Exception $e) {
         \Drupal::logger(Common::$MODULE_NAME)->error($e->getMessage());
         return null;
      }
   }

}