<?php

namespace Drupal\ictv_seqsearch_service\Plugin\rest\resource;

use Drupal\ictv_seqsearch_service\Plugin\rest\resource\Common;
use Drupal\Core\Database\Connection;
use Drupal\ictv_common\Jobs\JobService;
use Drupal\ictv_common\Types\JobStatus;
use Drupal\ictv_common\Types\JobType;
use Drupal\ictv_common\Utils;


class SeqSearchJob {


   // Open files referenced in the job results and add them to the job object (nested array).
   public static function addResultFiles(string $filePath, array $job) {

      // If there are no results, return the job unmodified.
      if ($job == null || $job["data"] == null || $job["data"]["results"] == null) { return $job; }

      // How many results are available?
      $resultCount = count($job["data"]["results"]);

      // Iterate over all results.
      for ($r=0; $r<$resultCount; $r++) {

         // Get the next result and validate it.
         $result = $job["data"]["results"][$r];
         if ($result == null) { continue; }

         $csvFilename = $result["blast_csv"];
         if (!Utils::isNullOrEmpty($csvFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $csvFilename, $filePath);
            
            // Populate the "csv_file" attribute.
            if (!Utils::isNullOrEmpty($contents)) { $job["data"]["results"][$r]["csv_file"] = $contents; }
         }

         $htmlFilename = $result["blast_html"];
         if (!Utils::isNullOrEmpty($htmlFilename)) { 
            
            // Open the file and retrieve its contents.
            $contents = Common::getFileContents(true, $htmlFilename, $filePath);
            
            // Populate the "html_file" attribute.
            if (!Utils::isNullOrEmpty($contents)) { $job["data"]["results"][$r]["html_file"] = $contents; }
         }
      }

      return $job;
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


   // Retrieve a job and return it as a SeqSearch Job "object" (nested arrays).
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
         \Drupal::logger('ictv_seqsearch_service')->error($e->getMessage());
         return null;
      }

      // Get (what should be) the single row.
      $row = $result->fetchAssoc();
      if (!$row) { return null; }

      return ClassificationJob::fromArray($row);
   }

}