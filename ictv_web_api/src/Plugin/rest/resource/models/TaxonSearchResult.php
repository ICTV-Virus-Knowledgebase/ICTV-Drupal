<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

// Helpers
use Drupal\ictv_web_api\helpers\TaxonomyHelper;
use Drupal\ictv_web_api\helpers\Common;

class TaxonSearchResult {

   public ?int $displayOrder;

   public ?int $ictvID;

   public ?int $jsonID;

   public ?string $jsonLineage;

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



   // C-tor
   public function __construct(?int $displayOrder = NULL, ?int $ictvID = NULL, ?string $lineage = NULL, ?string $name = NULL, 
      ?int $parentTaxnodeID = NULL, ?string $rankName = NULL, ?int $releaseNumber = NULL, ?string $searchText = NULL, ?int $taxnodeID = NULL, 
      ?string $taxnodeLineage = NULL, ?int $treeID = NULL, ?string $treeName = NULL) {

      $this->displayOrder = $displayOrder;
      $this->ictvID = $ictvID;
      $this->jsonID = $jsonID;
      $this->jsonLineage = $jsonLineage;
      $this->lineage = $lineage;
      $this->lineageHTML = $lineageHTML;
      $this->name = $name;
      $this->parentTaxnodeID = $parentTaxnodeID;
      $this->rankName = $rankName;
      $this->releaseNumber = $releaseNumber;
      $this->searchText = $searchText;
      $this->taxnodeID = $taxnodeID;
      $this->taxnodeLineage = $taxnodeLineage;
      $this->treeID = $treeID;
      $this->treeName = $treeName;
   }

   // This is called after filling the object from DB row, 
   // to replicate "process()" in C# that sets lineageHTML + name
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
      $instance->jsonID = $data["json_id"]; 
      $instance->jsonLineage = $data["json_lineage"]; 
      $instance->lineage = $data["lineage"];
      $instance->name = $data["name"];
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
         "jsonID" => $this->jsonID,
         "jsonLineage" => $this->jsonLineage,
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