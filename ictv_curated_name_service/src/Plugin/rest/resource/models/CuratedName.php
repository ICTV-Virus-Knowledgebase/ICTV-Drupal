<?php

namespace Drupal\ictv_curated_name_service\Plugin\rest\resource\models;


class CuratedName {

   public ?string $createdBy;

   public ?string $createdOn;

   public ?string $division;

   public ?int $divisionTID;

   public ?int $ictvID;

   public ?int $ictvTaxnodeID;

   public int $id;

   public bool $isValid;

   public string $name;

   public ?string $nameClass;

   public ?int $nameClassTID;

   public ?string $rankName;

   public ?int $rankNameTID;

   public ?string $taxonomyDB;

   public ?int $taxonomyDbTID;

   public ?int $taxonomyID;

   public ?int $versionID;

   



   // C-tor
   public function __construct(string $createdBy = NULL, string $createdOn = NULL, string $division = NULL, int $divisionTID = NULL, 
      int $ictvID = NULL, int $ictvTaxnodeID = NULL, int $id = NULL, bool $isValid = NULL, string $name = NULL,  
      string $nameClass = NULL, int $nameClassTID = NULL, string $rankName = NULL, int $rankNameTID = NULL, string $taxonomyDB = NULL, 
      int $taxonomyDbTID = NULL, int $taxonomyID = NULL, int $versionID = NULL) { 

      $this->createdBy = $createdBy;
      $this->createdOn = $createdOn;
      $this->division = $division;
      $this->divisionTID = $divisionTID;
      $this->ictvID = $ictvID;
      $this->ictvTaxnodeID = $ictvTaxnodeID;
      $this->id = $id;
      $this->isValid = $isValid;
      $this->name = $name;
      $this->nameClass = $nameClass;
      $this->nameClassTID = $nameClassTID;
      $this->rankName = $rankName;
      $this->rankNameTID = $rankNameTID;
      $this->taxonomyDB = $taxonomyDB;
      $this->taxonomyDbTID = $taxonomyDbTID;
      $this->taxonomyID = $taxonomyID;
      $this->versionID = $versionID;
   }


   // Method to populate the object from an associative array
   public static function fromArray(array $data): CuratedName {

      $instance = new self();
   
      $instance->createdBy = $data["created_by"];
      $instance->createdOn = $data["created_on"];
      $instance->division = $data["division"];
      $instance->divisionTID = $data["division_tid"];
      $instance->ictvID = $data["ictv_id"];
      $instance->ictvTaxnodeID = $data["ictv_taxnode_id"];
      $instance->id = $data["id"];
      $instance->isValid = $data["is_valid"];
      $instance->name = $data["name"];
      $instance->nameClass = $data["name_class"];
      $instance->nameClassTID = $data["name_class_tid"];
      $instance->rankName = $data["rank_name"];
      $instance->rankNameTID = $data["rank_name_tid"];
      $instance->taxonomyDB = $data["taxonomy_db"];
      $instance->taxonomyDbTID = $data["taxonomy_db_tid"];
      $instance->taxonomyID = $data["taxonomy_id"];
      $instance->versionID = $data["version_id"];

      return $instance;
   }

   
   public function normalize() {
      return [
         "createdBy" => $this->createdBy,
         "createdOn" => $this->createdOn,
         "division" => $this->division,
         "divisionTID" => $this->divisionTID,
         "ictvID" => $this->ictvID,
         "ictvTaxnodeID" => $this->ictvTaxnodeID,
         "id" => $this->id,
         "isValid" => $this->isValid,
         "name" => $this->name,
         "nameClass" => $this->nameClass,
         "nameClassTID" => $this->nameClassTID,
         "rankName" => $this->rankName,
         "rankNameTID" => $this->rankNameTID,
         "taxonomyDB" => $this->taxonomyDB,
         "taxonomyDbTID" => $this->taxonomyDbTID,
         "taxonomyID" => $this->taxonomyID,
         "versionID" => $this->versionID
      ];
   }

}







