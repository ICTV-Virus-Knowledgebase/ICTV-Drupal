<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class HistoricalRelease {
   
   public ?int $isAbolished;
   public ?int $isCurrent;
   public ?int $isSelected;
   public ?int $Mods;
   public ?string $rankNames;
   public ?int $releaseNumber;
   public ?string $title;
   public ?string $year;


   public static function fromArray(array $d): self {

      $o = new self();

      $o->isAbolished  = isset($d["release_is_abolished"]) ? (int)$d["release_is_abolished"] : 0;
      $o->isCurrent    = isset($d["release_is_current"]) ? (int)$d["release_is_abolished"] : 0;
      $o->isSelected   = isset($d["release_is_selected"]) ? (int)$d["release_is_selected"] : 0;
      $o->mods         = isset($d["release_mods"]) ? (int)$d["release_mods"] : 0;
      $o->rankNames    = $d["release_rank_names"] ?? null;
      $o->releaseNumber = $d["msl_release_number"] ?? null;
      $o->title        = $d["release_title"] ?? null;
      $o->year          = $d["release_year"] ?? null;

      return $o;
   }

   public function normalize(): array {
      return [
         "isAbolished" => $this->isAbolished == 1,
         "isCurrent" => $this->isCurrent == 1,
         "isSelected" => $this->isSelected == 1,
         "mods" => $this->mods,
         "rankNames" => $this->rankNames,
         "releaseNumber" => $this->releaseNumber,
         "title" => $this->title,
         "year" => $this->year
      ];
   }
}