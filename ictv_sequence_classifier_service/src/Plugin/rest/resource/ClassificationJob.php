<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\Common;
use Drupal\Core\Database\Connection;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;


class ClassificationJob {


   // Add file contents to a Classification Job.
   public static function addFile(array $classificationJob, bool $encodeBase64, string $fileKey, string $filename, string $filePath) {

      if ($classificationJob == null) { return null; }

      if (Utils::isNullOrEmpty($fileKey)) { 
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid fileKey in addFile()");
         return $classificationJob;
      }

      if (Utils::isNullOrEmpty($filename)) { 
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid filename in addFile()");
         return $classificationJob;
      }

      if (Utils::isNullOrEmpty($filePath)) { 
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid file path in addFile()");
         return $classificationJob;
      }

      // Open the file and retrieve its contents.
      $contents = getFileContents($encodeBase64, $filename, $filePath);
      if ($contents == null) {
         \Drupal::logger(Common::$MODULE_NAME)->error("Invalid file contents (empty) in addFile()");
         return $classificationJob;
      }

      if ($classificationJob["files"] == null || count($classificationJob["files"]) < 1) { $classificationJob["files"] = []; }

      $classificationJob["files"][$fileKey] = $contents;

      return $classificationJob;
   }


   // Return an Classification Job "object" (nested arrays) from a row of database results.
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
            \Drupal::logger('ictv_sequence_classifier_service')->error("JSON data is invalid after conversion in fromArray");
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


   // Retrieve a job and return it as a Classification Job "object" (nested arrays).
   public static function getJobAsJSON(Connection $connection, string $jobUID, string $userEmail, string $userUID) {

      // Validate input parameters
      if (Utils::isNullOrEmpty($jobUID)) { throw new \Exception("Invalid job UID in getJob()"); }
      if (Utils::isNullOrEmpty($userEmail)) { throw new \Exception("Invalid user email in getJob()"); }
      if (Utils::isNullOrEmpty($userUID)) { throw new \Exception("Invalid user UID in getJob()"); }

      // Populate the stored procedure's parameters.
      $parameters = [":jobType" => JobType::sequence_classification->value, ":jobUID" => $jobUID, ":userEmail" => $userEmail, ":userUID" => $userUID];

      // Generate SQL to call the "getClassifiedSequences" stored procedure.
      $sql = "CALL getClassifiedSequences(:jobType, :jobUID, :userEmail, :userUID);";

      try {
         // Run the query
         $result = $connection->query($sql, $parameters);
         if (!$result) { return null; }
      } 
      catch (Exception $e) {
         \Drupal::logger('ictv_sequence_classifier_service')->error($e->getMessage());
         return null;
      }

      // Get (what should be) the single row.
      $row = $result->fetchAssoc();
      if (!$row) { return null; }

      return ClassificationJob::fromArray($row);
   }

}