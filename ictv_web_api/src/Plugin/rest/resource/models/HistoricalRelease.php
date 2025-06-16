<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class HistoricalRelease {
   
   public ?string $releaseRankNames;
   public ?string $releaseTitle;
   public ?string $releaseYear;

 
   public static function fromArray(array $d): self {

      $o = new self();

      $o->releaseRankNames = $d['release_rank_names'] ?? null;
      $o->releaseTitle     = $d['release_title'] ?? null;
      $o->releaseYear      = $d['release_year'] ?? null;

      return $o;
   }

   public function normalize(): array {
      return [
         'releaseRankNames' => $this->releaseRankNames,
         'releaseTitle'     => $this->releaseTitle,
         'releaseYear'      => $this->releaseYear,
      ];
   }
}