<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

use Drupal\Core\Database\Connection;
use Drupal\ictv_web_api\helpers\SimpleTaxon;

class ReleaseListEntry {

  public bool $isSelected = false;
  public ?string $notes = null;
  public ?string $rankNames = null;
  public int $releaseNumber = 0;
  public ?string $year = null;

  // C-tor
  public function __construct() {

  }

  /**
   * Build a ReleaseListEntry from an associative array.
   */

  public static function fromArray(array $data): ReleaseListEntry {

    $entry = new self();

    $entry->isSelected = !empty($data['is_selected']) ? (bool)$data['is_selected'] : false;
    $entry->notes = $data['notes'] ?? null;
    $entry->rankNames = $data['rank_names'] ?? null;
    $entry->releaseNumber = isset($data['msl_release_num']) ? (int)$data['msl_release_num'] : 0;
    $entry->year = $data['year'] ?? null;

    return $entry;
  }

  /**
   * Convert the object to a plain associative array for JSON serialization.
   */

  public function normalize(): array {
    return [
      'isSelected'    => $this->isSelected,
      'notes'         => $this->notes,
      'rankNames'     => $this->rankNames,
      'releaseNumber' => $this->releaseNumber,
      'year'          => $this->year,
    ];
  }

  /**
   * Replicates C# logic for getAll(...).
   *
   *
   * @param Connection $connection
   * @param int $selectedTaxNodeID
   * @param bool $sortDescending
   *
   * @return ReleaseListEntry[]
   */

  public static function getAll(Connection $connection, int $selectedTaxNodeID, bool $sortDescending = true): array {

    // 1) First, find the "selectedMsl" for the node, i.e. the msl_release_num from taxonomy_node 
    $sql1 = "
      SELECT msl_release_num
      FROM taxonomy_node
      WHERE taxnode_id = :taxnodeID
      LIMIT 1
    ";
    $stmt1 = $connection->query($sql1, [':taxnodeID' => $selectedTaxNodeID]);
    $row1 = $stmt1->fetchAssoc();
    $selectedMsl = isset($row1['msl_release_num']) ? (int)$row1['msl_release_num'] : 0;

    // 2) Build the final query that returns columns:
    // is_selected, msl_release_num, notes, rank_names, [year]
    // plus the big CASE expression or subselect that sets is_selected
    // The T-SQL code does: 
    //   CASE WHEN msl_release_num = @selectedMsl THEN 1 ELSE 0 END AS is_selected

    $sortDirection = $sortDescending ? 'DESC' : 'ASC';

    $sql2 = "
    SELECT
      CASE 
        WHEN msl_release_num = :selectedMsl THEN 1 ELSE 0
      END AS is_selected,
      msl_release_num,
      notes,
      CONCAT(
        CASE WHEN realms > 0 THEN 'realm,' ELSE '' END,
        CASE WHEN subrealms > 0 THEN 'subrealm,' ELSE '' END,
        CASE WHEN kingdoms > 0 THEN 'kingdom,' ELSE '' END,
        CASE WHEN subkingdoms > 0 THEN 'subkingdom,' ELSE '' END,
        CASE WHEN phyla > 0 THEN 'phylum,' ELSE '' END,
        CASE WHEN subphyla > 0 THEN 'subphylum,' ELSE '' END,
        CASE WHEN classes > 0 THEN 'class,' ELSE '' END,
        CASE WHEN subclasses > 0 THEN 'subclass,' ELSE '' END,
        CASE WHEN orders > 0 THEN 'order,' ELSE '' END,
        CASE WHEN suborders > 0 THEN 'suborder,' ELSE '' END,
        CASE WHEN families > 0 THEN 'family,' ELSE '' END,
        CASE WHEN subfamilies > 0 THEN 'subfamily,' ELSE '' END,
        CASE WHEN genera > 0 THEN 'genus,' ELSE '' END,
        CASE WHEN subgenera > 0 THEN 'subgenus,' ELSE '' END,
        CASE WHEN species > 0 THEN 'species' ELSE '' END
      ) AS rank_names,
      `year`
    FROM view_taxa_level_counts_by_release
    ORDER BY msl_release_num $sortDirection
  ";

    // 3) Run that query, build ReleaseListEntry objects
    $entries = [];
    $stmt2 = $connection->query($sql2, [':selectedMsl' => $selectedMsl]);

    foreach ($stmt2 as $row) {
      $entry = ReleaseListEntry::fromArray((array) $row);
      $entries[] = $entry;
    }

    return $entries;
  }
}