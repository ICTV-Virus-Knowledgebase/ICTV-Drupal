<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

use Drupal\ictv_web_api\helpers\Common;

class HistoricalRelease {
   
   public ?int $isCurrent;
   public ?int $isVisible;
   public ?string $rankNames;
   public ?int $releaseNumber;
   public ?string $title;
   public ?string $year;


   public static function fromArray(array $d): self {

      $o = new self();

      $o->isCurrent = Common::getIntParameter($d, "release_is_current") ?? 0;
      $o->isVisible = Common::getIntParameter($d, "release_is_visible") ?? 1;
      $o->rankNames = $d["release_rank_names"] ?? null;
      $o->releaseNumber = Common::getIntParameter($d, "release_number") ?? null;
      $o->title = $d["release_title"] ?? null;
      $o->year = $d["release_year"] ?? null;

      return $o;
   }

   public function normalize(): array {
      return [
         "isCurrent" => $this->isCurrent == 1,
         "isVisible" => $this->isVisible == 1,
         "rankNames" => $this->rankNames,
         "releaseNumber" => $this->releaseNumber,
         "title" => $this->title,
         "year" => $this->year
      ];
   }
}