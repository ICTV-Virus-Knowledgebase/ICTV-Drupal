<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

use Drupal\Core\Database\Connection;

class MslRelease {

  public ?string $notes        = null;
  public int $releaseNumber    = 0;
  public int $treeID           = 0;
  public ?string $year         = null;
  public int $realms           = 0;
  public int $subrealms        = 0;
  public int $kingdoms         = 0;
  public int $subkingdoms      = 0;
  public int $phyla            = 0;
  public int $subphyla         = 0;
  public int $classes          = 0;
  public int $subclasses       = 0;
  public int $orders           = 0;
  public int $suborders        = 0;
  public int $families         = 0;
  public int $subfamilies      = 0;
  public int $genera           = 0;
  public int $subgenera        = 0;
  public int $species          = 0;

  /**
   * Build a MslRelease from an associative array.
   * 
   * @param array $data The DB row.
   * @return MslRelease
   */

  public static function fromArray(array $data): MslRelease {

    $instance = new self();

    $instance->notes         = $data['notes']          ?? null;
    $instance->releaseNumber = isset($data['msl_release_num']) ? (int)$data['msl_release_num'] : 0;
    $instance->treeID        = isset($data['tree_id']) ? (int)$data['tree_id'] : 0;
    $instance->year          = $data['year']           ?? null;
    $instance->realms        = isset($data['realms'])       ? (int)$data['realms']       : 0;
    $instance->subrealms     = isset($data['subrealms'])    ? (int)$data['subrealms']    : 0;
    $instance->kingdoms      = isset($data['kingdoms'])     ? (int)$data['kingdoms']     : 0;
    $instance->subkingdoms   = isset($data['subkingdoms'])  ? (int)$data['subkingdoms']  : 0;
    $instance->phyla         = isset($data['phyla'])        ? (int)$data['phyla']        : 0;
    $instance->subphyla      = isset($data['subphyla'])     ? (int)$data['subphyla']     : 0;
    $instance->classes       = isset($data['classes'])      ? (int)$data['classes']      : 0;
    $instance->subclasses    = isset($data['subclasses'])   ? (int)$data['subclasses']   : 0;
    $instance->orders        = isset($data['orders'])       ? (int)$data['orders']       : 0;
    $instance->suborders     = isset($data['suborders'])    ? (int)$data['suborders']    : 0;
    $instance->families      = isset($data['families'])     ? (int)$data['families']     : 0;
    $instance->subfamilies   = isset($data['subfamilies'])  ? (int)$data['subfamilies']  : 0;
    $instance->genera        = isset($data['genera'])       ? (int)$data['genera']       : 0;
    $instance->subgenera     = isset($data['subgenera'])    ? (int)$data['subgenera']    : 0;
    $instance->species       = isset($data['species'])      ? (int)$data['species']      : 0;

    return $instance;
  }

  /**
   * Convert this release object to a plain array for serialization.
   */

  public function normalize(): array {

    return [
      'notes'         => $this->notes,
      'releaseNumber' => $this->releaseNumber,
      'treeID'        => $this->treeID,
      'year'          => $this->year,
      'realms'        => $this->realms,
      'subrealms'     => $this->subrealms,
      'kingdoms'      => $this->kingdoms,
      'subkingdoms'   => $this->subkingdoms,
      'phyla'         => $this->phyla,
      'subphyla'      => $this->subphyla,
      'classes'       => $this->classes,
      'subclasses'    => $this->subclasses,
      'orders'        => $this->orders,
      'suborders'     => $this->suborders,
      'families'      => $this->families,
      'subfamilies'   => $this->subfamilies,
      'genera'        => $this->genera,
      'subgenera'     => $this->subgenera,
      'species'       => $this->species,
    ];
  }

  /**
   * The partial query snippet, like the C# generatePartialQuery().
   */

  public static function generatePartialQuery(): string {

    return "
      msl_release_num,
      notes,
      tree_id,
      year,
      realms,
      subrealms,
      kingdoms,
      subkingdoms,
      phyla,
      subphyla,
      classes,
      subclasses,
      orders,
      suborders,
      families,
      subfamilies,
      genera,
      subgenera,
      species
      FROM view_taxa_level_counts_by_release
    ";
  }

  /**
   * Replicate MslRelease.get(...) from C#.
   * 
   * @param Connection $connection
   * @param int|null $releaseNumber
   *
   * @return MslRelease|null
   */

  public static function get(Connection $connection, ?int $releaseNumber): ?MslRelease {

    $sql = "SELECT ";

    // partial
    $sql .= self::generatePartialQuery();

    // If no releaseNumber, pick the max? 
    if ($releaseNumber === null || $releaseNumber < 1) {

      $sql .= "
        WHERE msl_release_num = (
          SELECT MAX(msl_release_num)
          FROM taxonomy_node
        )
        LIMIT 1
      ";

    } else {

      // "WHERE msl_release_num = X LIMIT 1"
      $sql .= " WHERE msl_release_num = :releaseNumber LIMIT 1";
    }

    $params = [];
    if ($releaseNumber !== null && $releaseNumber > 0) {
      $params[':releaseNumber'] = $releaseNumber;
    }

    $stmt = $connection->query($sql, $params);
    $row = $stmt->fetchAssoc();
    if (!$row) {
      return null;
    }

    // Build MslRelease object
    $releaseObj = self::fromArray($row);
    if ($releaseObj->treeID < 1) {
      return null;
    }
    return $releaseObj;
  }

  /**
   * Replicate getAll(...) from C#.
   *
   * @param Connection $connection
   * @return MslRelease[]
   */

  public static function getAll(Connection $connection): array {

    $sql = "
      SELECT 
        " . self::generatePartialQuery() . "
      ORDER BY msl_release_num DESC
    ";
    $stmt = $connection->query($sql);

    $results = [];
    foreach ($stmt as $row) {
      $results[] = self::fromArray((array)$row);
    }
    return $results;
  }

  /**
   * Replicate getByTaxNodeID(...) from C#.
   *
   * @param Connection $connection
   * @param int $taxNodeID
   *
   * @return MslRelease|null
   */

  public static function getByTaxNodeID(Connection $connection, int $taxNodeID): ?MslRelease {

    $sql = "
      SELECT
        " . self::generatePartialQuery() . "
      WHERE msl_release_num = (
        SELECT msl_release_num
        FROM taxonomy_node
        WHERE taxnode_id = :taxNodeID
        ORDER BY msl_release_num DESC
        LIMIT 1
      )
      LIMIT 1
    ";

    $stmt = $connection->query($sql, [':taxNodeID' => $taxNodeID]);
    $row = $stmt->fetchAssoc();
    if (!$row) {
      return null;
    }

    $obj = self::fromArray($row);
    if ($obj->treeID < 1) {
      return null;
    }
    return $obj;
  }
}