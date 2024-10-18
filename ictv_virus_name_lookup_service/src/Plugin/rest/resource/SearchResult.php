<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;


class SearchResult {

   // How many characters were different between the search text and match?
   public float $accuracyScore;

   // The NCBI division (phages, viruses)
   public string $division;
         
   // Prefer virus and phage results over anything else.
   public float $divisionScore;

   // Were the first characters of the search text and match the same?
   public int $firstCharacterMatch;

   // Prefer results that have an ICTV taxnode ID.
   public int $hasTaxnodeID;

   public ?int $ictvTaxnodeID;

   // Is this an exact match?
   public int $isExactMatch;

   // Is this a valid taxon (not obsolete)?
   public int $isValid;

   // How much did the search text's length differ from the match's length?
   public float $sizeScore;

   // The matching name
   public string $name;

   // The name class/type, inspired by NCBI name class.
   public string $nameClass;
   public float $nameClassScore;

   public ?string $parentTaxonomyDB;
   public ?int $parentTaxonomyID;

   public string $rankName;

   // Ranks found in ICTV, VMR, and NCBI Taxonomy (virus and phage divisions only).
   // Prefer lower ranks over higher ranks.
   public float $rankScore;

   public string $taxonomyDB;

   // Taxonomy databases in order of preference.
   public float $taxonomyDbScore;

   public int $taxonomyID;
   public int $versionID;
   

   // C-tor
   public function __construct() {

      // Provide defaults for all member variables.
      $this->accuracyScore = 0;
      $this->division = "";
      $this->divisionScore = 0;
      $this->firstCharacterMatch = 0;
      $this->hasTaxnodeID = 0;
      $this->ictvTaxnodeID = 0;
      $this->isExactMatch = 0;
      $this->isValid = 0;
      $this->sizeScore = 0;
      $this->name = "";
      $this->nameClass = "";
      $this->nameClassScore = 0;
      $this->parentTaxonomyDB = "";
      $this->parentTaxonomyID = 0;
      $this->rankName = "";
      $this->rankScore = 0;
      $this->taxonomyDB = "";
      $this->taxonomyDbScore = 0;
      $this->taxonomyID = 0;
      $this->versionID = -1;
   }

   // Method to populate the object from an associative array
   public static function fromArray(array $data): SearchResult {

      $instance = new self();
      
      $instance->accuracyScore = $data["accuracy_score"];
      $instance->division = $data["division"];
      $instance->divisionScore = $data["division_score"];
      $instance->firstCharacterMatch = $data["first_character_match"];
      $instance->hasTaxnodeID = $data["has_taxnode_id"];
      $instance->ictvTaxnodeID = $data["ictv_taxnode_id"];
      $instance->isExactMatch = $data["is_exact_match"];
      $instance->isValid = $data["is_valid"];
      $instance->sizeScore = $data["size_score"];
      $instance->name = $data["name"];
      $instance->nameClass = $data["name_class"];
      $instance->nameClassScore = $data["name_class_score"];
      $instance->parentTaxonomyDB = $data["parent_taxonomy_db"];
      $instance->parentTaxonomyID = $data["parent_taxonomy_id"];
      $instance->rankName = $data["rank_name"];
      $instance->rankScore = $data["rank_score"];
      $instance->taxonomyDB = $data["taxonomy_db"];
      $instance->taxonomyDbScore = $data["taxonomy_db_score"];
      $instance->taxonomyID = $data["taxonomy_id"];
      $instance->versionID = $data["version_id"];
      
      return $instance;
   }


   /**
    * {@inheritdoc}
    */
   public function normalize() {
      return [
         "accuracyScore" => $this->accuracyScore,
         "division" => $this->division,
         "divisionScore" => $this->divisionScore,
         "firstCharacterMatch" => $this->firstCharacterMatch,
         "hasTaxnodeID" => $this->hasTaxnodeID,
         "ictvTaxnodeID" => $this->ictvTaxnodeID,
         "isExactMatch" => $this->isExactMatch,
         "isValid" => $this->isValid,
         "sizeScore" => $this->sizeScore,
         "name" => $this->name,
         "nameClass" => $this->nameClass,
         "nameClassScore" => $this->nameClassScore,
         "parentTaxonomyDB" => $this->parentTaxonomyDB,
         "parentTaxonomyID" => $this->parentTaxonomyID,
         "rankName" => $this->rankName,
         "rankScore" => $this->rankScore,
         "taxonomyDB" => $this->taxonomyDB,
         "taxonomyDbScore" => $this->taxonomyDbScore,
         "taxonomyID" => $this->taxonomyID,
         "versionID" => $this->versionID
      ];
   }

}