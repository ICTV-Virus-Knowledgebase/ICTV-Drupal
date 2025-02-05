<?php

namespace Drupal\ictv_curated_name_service\Plugin\rest\resource\models;


class CuratedName {

   public ?string $comments;

   public ?string $createdBy;

   public ?string $createdOn;

   public ?string $division;

   public ?int $ictvID;

   public ?int $ictvTaxnodeID;

   public ?int $id;

   public ?bool $isValid;

   public ?string $name;

   public ?string $nameClass;

   public ?string $rankName;

   public ?string $taxonomyDB;

   public ?int $taxonomyID;

   public ?string $type;

   public ?string $uid;

   public ?int $versionID;

   


   // C-tor
   public function __construct(string $comments = NULL, string $createdBy = NULL, string $createdOn = NULL, string $division = NULL,  
      int $ictvID = NULL, int $ictvTaxnodeID = NULL, int $id = NULL, bool $isValid = NULL, string $name = NULL, string $nameClass = NULL, 
      string $rankName = NULL, string $taxonomyDB = NULL, int $taxonomyID = NULL, $type = NULL, $uid = NULL, int $versionID = NULL) { 

      $this->comments = $comments;
      $this->createdBy = $createdBy;
      $this->createdOn = $createdOn;
      $this->division = $division;
      $this->ictvID = $ictvID;
      $this->ictvTaxnodeID = $ictvTaxnodeID;
      $this->id = $id;
      $this->isValid = $isValid;
      $this->name = $name;
      $this->nameClass = $nameClass;
      $this->rankName = $rankName;
      $this->taxonomyDB = $taxonomyDB;
      $this->taxonomyID = $taxonomyID;
      $this->type = $type;
      $this->uid = $uid;
      $this->versionID = $versionID;
   }


   // Create an object instance from an associative array.
   public static function fromArray(array $data): CuratedName {

      $instance = new self();
   
      $instance->comments = $data["comments"];
      $instance->createdBy = $data["created_by"];
      $instance->createdOn = $data["created_on"];
      $instance->division = $data["division"];
      $instance->ictvID = $data["ictv_id"];
      $instance->ictvTaxnodeID = $data["ictv_taxnode_id"];
      $instance->id = $data["id"];
      $instance->isValid = $data["is_valid"];
      $instance->name = $data["name"];
      $instance->nameClass = $data["name_class"];
      $instance->rankName = $data["rank_name"];
      $instance->taxonomyDB = $data["taxonomy_db"];
      $instance->taxonomyID = $data["taxonomy_id"];
      $instance->type = $data["type"];
      $instance->uid = $data["uid"];
      $instance->versionID = $data["version_id"];

      return $instance;
   }

   
   public function normalize() {
      return [
         "comments" => $this->comments,
         "createdBy" => $this->createdBy,
         "createdOn" => $this->createdOn,
         "division" => $this->division,
         "ictvID" => $this->ictvID,
         "ictvTaxnodeID" => $this->ictvTaxnodeID,
         "id" => $this->id,
         "isValid" => $this->isValid,
         "name" => $this->name,
         "nameClass" => $this->nameClass,
         "rankName" => $this->rankName,
         "taxonomyDB" => $this->taxonomyDB,
         "taxonomyID" => $this->taxonomyID,
         "type" => $this->type,
         "uid" => $this->uid,
         "versionID" => $this->versionID
      ];
   }

}







