<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;

use Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource\SearchResult;

class IctvResult {

   public $matches;

   public ?int $mslRelease;

   public ?string $name;

   public ?string $rankName;

   public ?int $taxnodeID;

   // C-tor
   public function __construct(?int $mslRelease_, ?string $name_, ?string $rankName_, ?int $taxnodeID_) {
      $this->mslRelease = $mslRelease_;
      $this->name = $name_;
      $this->rankName = $rankName_;
      $this->taxnodeID = $taxnodeID_;
      $this->matches = [];
   }


   /**
    * {@inheritdoc}
    */
    public function normalize() {
      return [
         "mslRelease" => $this->mslRelease,
         "name" => $this->name,
         "rankName" => $this->rankName,
         "taxnodeID" => $this->taxnodeID,
         "matches" => $this->matches
      ];
   }
}