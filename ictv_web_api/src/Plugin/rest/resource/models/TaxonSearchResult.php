<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

// Helpers
use Drupal\ictv_web_api\helpers\TaxonomyHelper;
use Drupal\ictv_web_api\helpers\Common;

class TaxonSearchResult {

   public ?int $displayOrder;

   public ?int $ictvID;

   public ?string $lineage;

   // Populate via process()
   public ?string $lineageHTML;

   // Populate via process()
   public ?string $name;

   public ?int $parentTaxnodeID;

   public ?string $rankName;

   public ?int $releaseNumber;

   public ?string $searchText;

   public ?int $taxnodeID;

   public ?string $taxnodeLineage;

   public ?int $treeID;

   public ?string $treeName;


   // This is called after filling the object from DB row to set lineageHTML and name.
   public function process(): void {

      // If lineage is not empty, call formatLineage(...) 
      if (!empty($this->lineage)) {
         $tempName = null; // reference param

         $this->lineageHTML = Common::formatLineage(
            $this->lineage,
            Common::LINEAGE_RESULT_DELIMITER, // " &#8250; "
            $this->searchText,
            Common::LINEAGE_DB_DELIMITER,     // ">"
            $tempName
         );
      
         $this->name = $tempName;
      }
   }


   // Method to populate the object from an associative array
   public static function fromArray(array $data): TaxonSearchResult {

      $instance = new self();
   
      $instance->displayOrder = $data["display_order"];
      $instance->ictvID = $data["ictv_id"];
      $instance->lineage = $data["lineage"];
      $instance->parentTaxnodeID = $data["parent_taxnode_id"];
      $instance->rankName = $data["rank_name"];
      $instance->releaseNumber = $data["release_number"];
      $instance->searchText = $data["search_text"];
      $instance->taxnodeID = $data["taxnode_id"];
      $instance->taxnodeLineage = $data["taxnode_lineage"];
      $instance->treeID = $data["tree_id"];
      $instance->treeName = $data["tree_name"];

      return $instance;
   }

   public function normalize() {
      return [
         "displayOrder" => $this->displayOrder,
         "ictvID" => $this->ictvID,
         "lineage" => $this->lineage,
         "lineageHTML"  => $this->lineageHTML,
         "name" => $this->name,
         "parentTaxnodeID" => $this->parentTaxnodeID,
         "rankName" => $this->rankName,
         "releaseNumber" => $this->releaseNumber,
         "searchText" => $this->searchText,
         "taxnodeID" => $this->taxnodeID,
         "taxnodeLineage" => $this->taxnodeLineage,
         "treeID" => $this->treeID,
         "treeName" => $this->treeName
      ];
   }

}