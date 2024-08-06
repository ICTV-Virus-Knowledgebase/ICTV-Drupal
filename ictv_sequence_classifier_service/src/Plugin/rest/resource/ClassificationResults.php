<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\SequenceResult;


class ClassificationResults {

   public string $inputDirectory;

   public string $programName;

   public array $results;

   public string $version;


   // Method to populate the object from an associative array
   public static function fromArray(array $data): ClassificationResults {
      $instance = new self();
      
      $instance->$inputDirectory = $data["input_dir"];
      $instance->$programName = $data["program_name"];
      $instance->$version = $data["version"];

      $instance->$results = [];

      foreach ($data["results"] as $resultArray) {
         $sequenceResult = SequenceResult::fromArray($resultArray);
         array_push($instance->$results, $sequenceResult);
      }

      return $instance;
   }

}