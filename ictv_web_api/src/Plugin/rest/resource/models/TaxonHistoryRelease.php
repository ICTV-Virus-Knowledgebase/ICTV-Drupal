<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class TaxonHistoryRelease {
  public string $rankNames;
  public int    $releaseNumber;
  public string $title;
  public int    $treeID;
  public string $year;

  public static function fromArray(array $d): self {
    $o = new self();
    $o->rankNames     = $d['rank_names'];
    $o->releaseNumber = (int)$d['release_number'];
    $o->title         = $d['release_title'];
    $o->treeID        = (int)$d['tree_id'];
    $o->year          = $d['year'];
    return $o;
  }

  public function normalize(): array {
    return [
      'rankNames'     => $this->rankNames,
      'releaseNumber' => $this->releaseNumber,
      'title'         => $this->title,
      'treeID'        => $this->treeID,
      'year'          => $this->year,
    ];
  }
}