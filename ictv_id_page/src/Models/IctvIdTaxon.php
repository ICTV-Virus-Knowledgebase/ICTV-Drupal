<?php

namespace Drupal\ictv_id_page\Models;


class IctvIdTaxon {

   public ?string $lineage;
   public ?int $mslReleaseNum;
   public ?string $name;
   public ?string $rankName;
   public ?int $taxnodeID;

   // C-tor
   public function __construct() {

      // Provide defaults for all member variables.
      $this->lineage = "";
      $this->mslReleaseNum = 0;
      $this->name = "";
      $this->rankName = "";
      $this->taxnodeID = 0;
   }
   

   // Method to populate the object from an associative array
   public static function fromArray(array $data): IctvIdTaxon {

      $instance = new self();
      
      $instance->lineage = $data["lineage"];
      $instance->mslReleaseNum = $data["msl_release_num"];
      $instance->name = $data["name"];
      $instance->rankName = $data["rank_name"];
      $instance->taxnodeID = $data["taxnode_id"];

      return $instance;
   }


   /**
    * {@inheritdoc}
    */
   public function normalize() {
      return [
         "lineage" => $this->lineage,
         "mslReleaseNum" => $this->mslReleaseNum,
         "name" => $this->name,
         "rankName" => $this->rankName,
         "taxnodeID" => $this->taxnodeID
      ];
   }


}