<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class HistoricalRelease {
   
   public ?int $hasAbolished;
   public ?int $hasCurrent;
   public ?int $hasSelected;
   public ?int $mods;
   public ?string $rankNames;
   public ?int $releaseNumber;
   public ?int $taxaCount;
   public ?string $title;
   public ?string $year;


   public static function fromArray(array $d): self {

      $o = new self();

      $o->hasAbolished  = isset($d["release_has_abolished"]) ? (int)$d["release_has_abolished"] : 0;
      $o->hasCurrent    = isset($d["release_has_current"]) ? (int)$d["release_has_current"] : 0;
      $o->hasSelected   = isset($d["release_has_selected"]) ? (int)$d["release_has_selected"] : 0;
      $o->mods         = isset($d["release_mods"]) ? (int)$d["release_mods"] : 0;
      $o->rankNames    = $d["release_rank_names"] ?? null;
      $o->releaseNumber = isset($d["msl_release_number"]) ? (int)$d["msl_release_number"] : null;
      $o->taxaCount     = isset($d["release_taxa_count"]) ? (int)$d["release_taxa_count"] : null;
      $o->title        = $d["release_title"] ?? null;
      $o->year          = isset($d["release_year"]) ? (int)$d["release_year"] : null;

      return $o;
   }

   public function normalize(): array {
      return [
         "hasAbolished" => $this->hasAbolished == 1,
         "hasCurrent" => $this->hasCurrent == 1,
         "hasSelected" => $this->hasSelected == 1,
         "mods" => $this->mods,
         "rankNames" => $this->rankNames,
         "releaseNumber" => $this->releaseNumber,
         "taxaCount" => $this->taxaCount,
         "title" => $this->title,
         "year" => $this->year
      ];
   }
}