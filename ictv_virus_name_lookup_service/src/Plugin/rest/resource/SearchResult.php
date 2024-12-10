<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;


class SearchResult {

   // The NCBI division (phages, viruses)
   public string $division;
         
   // Prefer virus and phage results over anything else.
   public float $divisionScore;

   // Does the first character of the search text match the first character of the matching name?
   public int $firstCharacterMatch;

   // Does the matching taxon have an associated ICTV result?
   public int $hasTaxnodeID;

   // A scientific name corresponding to an NCBI taxon name with a different name class. The scientific name is what matches an ICTV taxon.
   public ?string $intermediateName;
   public ?string $intermediateRank;

   // Is this an exact match?
   public int $isExactMatch;

   // Is this a valid taxon (not obsolete)?
   public int $isValid;

   // How much did the search text's length differ from the match's length?
   public float $lengthDifference;

   // The matching name
   public string $name;

   // The name class/type, inspired by NCBI name class.
   public string $nameClass;
   //public float $nameClassScore;

   // This will be calculated after the search result has been populated.
   //public int $orderedPairCount;

   // The match's taxonomic rank.
   public string $rankName;

   // How recent is the ICTV result?
   public ?float $recentResultScore;

   // How relevant is this search result?
   public ?float $relevanceScore;

   // ICTV results
   public ?int $resultMslRelease;
   public ?string $resultName;
   public ?string $resultRankName;
   public ?int $resultTaxnodeID;

   // The overall score (calculated after the search result has been populated).
   public float $score;

   // The match's taxonomy database
   public string $taxonomyDB;

   // Taxonomy databases in order of preference.
   public float $taxonomyDbScore;

   // The match's unique identifier in its taxonomy database.
   public int $taxonomyID;

   // The version of the match (for ICTV this is MSL release number).
   public int $versionID;
   

   // C-tor
   public function __construct() {

      // Provide defaults for all member variables.
      $this->division = "";
      $this->divisionScore = 0;
      $this->firstCharacterMatch = 0;
      $this->hasTaxnodeID = 0;
      $this->intermediateName = "";
      $this->intermediateRank = "";
      $this->isExactMatch = 0;
      $this->isValid = 0;
      $this->lengthDifference = 0;
      $this->name = "";
      $this->nameClass = "";
      //$this->nameClassScore = 0;
      $this->rankName = "";
      $this->recentResultScore = 0;
      $this->relevanceScore = 0;
      $this->resultMslRelease = 0;
      $this->resultName = "";
      $this->resultRankName = "";
      $this->resultTaxnodeID = 0;
      $this->score = 0;
      $this->taxonomyDB = "";
      $this->taxonomyDbScore = 0;
      $this->taxonomyID = 0;
      $this->versionID = -1;
   }

   // Method to populate the object from an associative array
   public static function fromArray(array $data): SearchResult {

      $instance = new self();
      
      $instance->division = $data["division"];
      $instance->divisionScore = $data["division_score"];
      $instance->firstCharacterMatch = $data["first_character_match"];
      $instance->hasTaxnodeID = $data["has_taxnode_id"];
      $instance->intermediateName = $data["intermediate_name"];
      $instance->intermediateRank = $data["intermediate_rank"];
      $instance->isExactMatch = $data["is_exact_match"];
      $instance->isValid = $data["is_valid"];
      $instance->lengthDifference = $data["length_difference"];
      $instance->name = $data["name"];
      $instance->nameClass = $data["name_class"];
      //$instance->nameClassScore = $data["name_class_score"];
      $instance->rankName = $data["rank_name"];
      $instance->recentResultScore = $data["recent_result_score"];
      $instance->relevanceScore = $data["relevance_score"];
      $instance->resultMslRelease = $data["result_msl_release"];
      $instance->resultName = $data["result_name"];
      $instance->resultRankName = $data["result_rank_name"];
      $instance->resultTaxnodeID = $data["result_taxnode_id"];
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
         "division" => $this->division,
         "divisionScore" => $this->divisionScore,
         "firstCharacterMatch" => $this->firstCharacterMatch,
         "hasTaxnodeID" => $this->hasTaxnodeID,
         "intermediateName" => $this->intermediateName,
         "intermediateRank" => $this->intermediateRank,
         "isExactMatch" => $this->isExactMatch,
         "isValid" => $this->isValid,
         "lengthDifference" => $this->lengthDifference,
         "name" => $this->name,
         "nameClass" => $this->nameClass,
         //"nameClassScore" => $this->nameClassScore,
         "rankName" => $this->rankName,
         "recentResultScore" => $this->recentResultScore,
         "relevanceScore" => $this->relevanceScore,
         "resultMslRelease" => $this->resultMslRelease,
         "resultName" => $this->resultName,
         "resultRankName" => $this->resultRankName,
         "resultTaxnodeID" => $this->resultTaxnodeID,
         "score" => $this->score,
         "taxonomyDB" => $this->taxonomyDB,
         "taxonomyDbScore" => $this->taxonomyDbScore,
         "taxonomyID" => $this->taxonomyID,
         "versionID" => $this->versionID
      ];
   }

}