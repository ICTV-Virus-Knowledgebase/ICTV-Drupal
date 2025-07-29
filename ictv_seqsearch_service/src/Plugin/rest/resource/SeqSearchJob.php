<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\Database\Connection;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;


class SeqSearchJob {

   // Create an invalid SeqSearch Job "object" (nested arrays) to return when a job is not found or is invalid.
   public static function createInvalidJob(string $jobName, string $message, JobStatus $status, string $jobUID) {

      // TODO: Validate input parameters?

      $createdOn = null; // TODO: get current datetime as string.
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
   }


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


   // Retrieve a job and return it as a SeqSearch Job "object" (nested arrays). Note that job.data is initially a  
   // serialized (and encoded) JSON string that the fromArray method deserializes as nested arrays. Job.data is then
   // replaced by these nested arrays.
   public static function getJob(Connection $connection, string $jobUID, string $userEmail, string $userUID) {

      // Validate input parameters
      if (Utils::isNullOrEmpty($jobUID)) { throw new \Exception("Invalid job UID in getJob()"); }
      if (Utils::isNullOrEmpty($userEmail)) { throw new \Exception("Invalid user email in getJob()"); }
      if (Utils::isNullOrEmpty($userUID)) { throw new \Exception("Invalid user UID in getJob()"); }

      // Populate the stored procedure's parameters.
      $parameters = [":jobType" => JobType::sequence_search->value, ":jobUID" => $jobUID, ":userEmail" => $userEmail, ":userUID" => $userUID];

      // Generate SQL to call the "getSeqSearchResults" stored procedure.
      $sql = "CALL getSeqSearchResults(:jobType, :jobUID, :userEmail, :userUID);";

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

}