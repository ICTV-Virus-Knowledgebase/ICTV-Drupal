<?php

namespace Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource;

use Drupal\ictv_virus_name_lookup_service\Plugin\rest\resource\SearchResult;

/**
 * Class IctvResult
 *
 * A subset of data from a SearchResult that represents a single ICTV result.
 * 
 */
class IctvResult {

   public ?string $exemplar;

   public ?string $family;

   public ?string $genbankAccession;

   public ?string $genus;

   public $matches;

   public ?int $mslRelease;

   public ?string $name;

   public ?string $rankName;

   public ?string $subfamily;
   
   public ?string $subgenus;

   public ?int $taxnodeID;


   // C-tor
   public function __construct(?int $mslRelease_, ?string $name_, ?string $rankName_, ?int $taxnodeID_,
      ?string $family_, ?string $subfamily_, ?string $genus_, ?string $subgenus_, ?string $exemplar_, ?string $genbankAccession_) {

      $this->exemplar = $exemplar_;
      $this->family = $family_;
      $this->genbankAccession = $genbankAccession_;
      $this->genus = $genus_;
      $this->mslRelease = $mslRelease_;
      $this->name = $name_;
      $this->rankName = $rankName_;
      $this->subfamily = $subfamily_;
      $this->subgenus = $subgenus_;
      $this->taxnodeID = $taxnodeID_;
      $this->matches = [];
   }


   /**
    * {@inheritdoc}
    */
    public function normalize() {
      return [
         "exemplar" => $this->exemplar,
         "family" => $this->family,
         "genbankAccession" => $this->genbankAccession,
         "genus" => $this->genus,
         "mslRelease" => $this->mslRelease,
         "name" => $this->name,
         "rankName" => $this->rankName,
         "subfamily" => $this->subfamily,
         "subgenus" => $this->subgenus,
         "taxnodeID" => $this->taxnodeID,
         "matches" => $this->matches
      ];
   }
}