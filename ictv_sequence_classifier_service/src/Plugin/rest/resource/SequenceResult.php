<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;

use Drupal\ictv_sequence_classifier_service\Plugin\rest\resource\ResultStatus;


class SequenceResult {

   public array $classificationLineage; // "classification_lineage"
   /*{
       "realm": "HelloRealm",
       "family": "BigFamily",
       "genus": "WorldGenus",
       "species": "WorldGenus specius"
   }*/

   public string $classificationRank; // "classification_rank"

   public string $inputSequenceName; // "input_seq"

   public ResultStatus $status; // "status"

   


   // Method to populate the object from an associative array
   public static function fromArray(array $data): SequenceResult {
      $instance = new self();
      
      $instance->$classificationLineage = $data["classification_lineage"];
      $instance->$classificationRank = $data["classification_rank"];
      $instance->$inputSequenceName = $data["input_seq"];
      $instance->$status = $data["status"];

      /*foreach ($data['objectArray'] as $objData) {
          $instance->addObject(new SomeObject($objData['name'], $objData['value']));
      }*/
      return $instance;
   }
   
}