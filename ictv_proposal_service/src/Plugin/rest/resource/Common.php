<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Psr\Log\LoggerInterface;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;

class Common {

   // The name of the proposal service module.
   public static string $MODULE_NAME = "ictv_proposal_service";


   /**
    * Creates an input file under the specified job path and input subdirectory.
    * Returns the new input file's identifier (currently not used).
    */
   public static function createInputFile(string $data, string $filename, string $inputPath) {

      // The file identifier to return.
      $fileID = null;

      $filePath = $inputPath.DIRECTORY_SEPARATOR.$filename;

      // Create an alias for the file system service.
      $fileSystem = \Drupal::service("file_system");

      try {
         // Create the file
         $fileID = $fileSystem->saveData($data, $filePath, FileSystemInterface::EXISTS_REPLACE);

         // Update the permissions
         if (!$fileSystem->chmod($filePath, 0644)) {
            \Drupal::logger(Common::$MODULE_NAME)->error("Unable to change permissions on file ".$filename);
            return null;
         }
      }
      catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
      }

      return $fileID;
   }
 
   /**
    * Creates a job record in the database.
    * Returns the new job's ID and UID.
    */
   public static function createJob(Connection $connection, ?string $jobName, string $userEmail, string $userUID): array {

      $jobID = "";
      $jobUID = "";

      if (Utils::isEmptyElseTrim($jobName)) { $jobName = null; }

      // Populate the stored procedure's parameters.
      $parameters = [":jobName" => $jobName, ":jobType" => JobType::proposal_validation->value, ":userEmail" => $userEmail, ":userUID" => $userUID];

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

      return [
         "jobID" => $jobID,
         "jobUID" => $jobUID
      ];
   }

   /**
    * Creates a job file record in the database.
    */
   public static function createJobFile(Connection $connection, string $filename, int $jobID, int $uploadOrder): bool {

      try {
         // Populate the stored procedure's parameters.
         $parameters = [":fileName" => $filename, ":jobID" => $jobID, ":uploadOrder" => $uploadOrder];

         // Generate SQL to call the "createJobFile" stored procedure.
         $sql = "CALL createJobFile(:fileName, :jobID, :uploadOrder);";

         // Run the query
         $query = $connection->query($sql, $parameters);
         if (!$query) { return false; }
         
         // Get the result.
         $result = $query->fetchAssoc();
         if (!$result) { return false; }

      } catch (\Throwable $e) {
         $errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         \Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
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
         throw new \Exception("Unable to create job directory ".$jobPath);
      }

      // The full path of the input subdirectory
      $inputPath = $jobPath.DIRECTORY_SEPARATOR.$inputDirName;

      // Create the input subdirectory
      if (!$fileSystem->prepareDirectory($inputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         throw new \Exception("Unable to create {$inputDirName} subdirectory");
      }

      // The full path of the output subdirectory.
      $outputPath = Common::getOutputPath($jobsPath, $jobUID, $outputDirName);

      // Create the output subdirectory.
      if (!$fileSystem->prepareDirectory($outputPath, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
         throw new \Exception("Unable to create {$outputDirName} subdirectory");
      }

      // Return the full path of the new job directory.
      return $jobPath;
   }

   // Return the job folder's input subdirectory.
   public static function getInputPath(string $inputDirName, string $jobsPath, string $jobUID): string {

      // Validate input parameters
      if (Utils::isNullOrEmpty($inputDirName)) { throw new \InvalidArgumentException("Invalid input directory name parameter"); }
      if (Utils::isNullOrEmpty($jobsPath)) { throw new \InvalidArgumentException("Invalid jobs path parameter"); }
      if (Utils::isNullOrEmpty($jobUID)) { throw new \InvalidArgumentException("Invalid job UID parameter"); }
      
      // Return the full path of the input subdirectory.
      return $jobsPath.DIRECTORY_SEPARATOR.$jobUID.DIRECTORY_SEPARATOR.$inputDirName;
   }

   
   // Return an array containing the output file contents, a new filename, and the jobUID.
   public static function getOutputFile(string $filename, string $jobUID, string $outputFilePrefix, string $outputPath) {

      if (Utils::isNullOrEmpty($outputFilePrefix)) { $outputFilePrefix = ""; }

      $filePath = $outputPath.DIRECTORY_SEPARATOR.$filename;

      // Load the file
      $handle = null;
      $fileData = null;

      try {
         // Get a file handle and read its contents.
         $handle = fopen($filePath, "r");
         $fileData = fread($handle, filesize($filePath));

      } catch (\Throwable $e) {
         //$errorMessage = method_exists($e, "getMessage") ? $e->getMessage() : get_class($e);
         //\Drupal::logger(Common::$MODULE_NAME)->error($errorMessage);
         throw $e;

      } finally {
         if ($handle != null) { fclose($handle); }
      }

      if ($fileData == null) { throw new \Exception("Unable to read file ".$filename." for job ".$jobUID); }

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
      $newFilename = $outputFilePrefix."_".$jobUID.$extension;
      
      return array(
         "filename" => $newFilename,
         "file" => $encodedData,
         "jobUID" => $jobUID 
      );
   }

   // Return the job folder's output subdirectory.
   public static function getOutputPath(string $jobsPath, string $jobUID, string $outputDirName): string {

      // Validate input parameters
      if (Utils::isNullOrEmpty($jobsPath)) { throw new \InvalidArgumentException("Invalid jobs path parameter"); }
      if (Utils::isNullOrEmpty($jobUID)) { throw new \InvalidArgumentException("Invalid job UID parameter"); }
      if (Utils::isNullOrEmpty($outputDirName)) { throw new \InvalidArgumentException("Invalid output directory name parameter"); }

      // Return the full path of the output subdirectory.
      return $jobsPath.DIRECTORY_SEPARATOR.$jobUID.DIRECTORY_SEPARATOR.$outputDirName;
   }

   /**
    * Safely trim a string, returning an empty string if the input is null or empty.
    */
   public static function safeTrim(string|null $str): string {
      if (!$str) { return ""; }
      $str = trim($str);
      if (mb_strlen($str) < 1) { return ""; }
      return $str;
   }

   // Update the job record in the database.
   public static function updateJob(Connection $connection, string $errorMessage, string $jobUID, JobStatus $status, string $userUID) {

      // Populate the stored procedure's parameters.
      $parameters = [":status" => $status->value, ":errorMessage" => $errorMessage, ":jobUID" => $jobUID, ":userUID" => $userUID];

      // Generate SQL to call the "updateJob" stored procedure.
      $sql = "CALL updateJob(:status, :errorMessage, :jobUID, :userUID);";

      $query = $connection->query($sql, $parameters);
      $result = $query->fetchAll();
   }
}
