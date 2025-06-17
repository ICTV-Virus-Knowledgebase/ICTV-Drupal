<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class HistoricalRelease {

  /* ---- properties that the JS bundle expects ---- */
  public ?int    $treeID        = null;
  public ?int    $releaseNumber = null;
  public ?string $rankNames     = null;
  public ?string $title         = null;
  public ?string $year          = null;

  /**
   * Map database row → object.
   * Make sure the SQL result set has *these* aliases:
   *   release_number, rank_names, title, year
   */

  public static function fromArray(array $d): self {

    $o = new self();

    $o->treeID        = isset($d['tree_id']) ? (int) $d['tree_id'] : null;
    $o->releaseNumber = isset($d['msl_release_num']) ? (int) $d['msl_release_num'] : null;
    $o->rankNames     = $d['release_rank_names']   ?? null;
    $o->title         = $d['release_title']        ?? null;
    $o->year          = $d['release_year']         ?? null;

    return $o;
  }

  /** Return the shape the front-end needs */
  public function normalize(): array {
    return [
      'rankNames'     => $this->rankNames,
      'releaseNumber' => $this->releaseNumber,
      'title'         => $this->title,
      'treeID'        => $this->treeID,
      'year'          => $this->year
    ];
  }
}