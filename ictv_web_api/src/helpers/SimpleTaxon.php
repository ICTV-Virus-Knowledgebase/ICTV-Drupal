<?php

namespace Drupal\ictv_web_api\helpers;

class SimpleTaxon {

  public bool $isHidden;
  public ?string $level;
  public ?string $name;
  public int $taxNodeID;

  public function __construct() {
    $this->isHidden = false;
    $this->level = null;
    $this->name = null;
    $this->taxNodeID = 0;
  }

  /**
   * Create a new instance of SimpleTaxon from an associative array.
   *
   * @param array $data
   *   An associative array with keys: is_hidden, taxon_level, taxon_name, taxnode_id.
   *
   * @return SimpleTaxon
   */

  public static function fromArray(array $data): SimpleTaxon {
    $instance = new self();
    $instance->isHidden  = isset($data['is_hidden']) ? (bool)$data['is_hidden'] : false;
    $instance->level     = $data['taxon_level'] ?? null;
    $instance->name      = $data['taxon_name'] ?? null;
    $instance->taxNodeID = isset($data['taxnode_id']) ? (int)$data['taxnode_id'] : 0;
    return $instance;
  }

  /**
   * Optional processing logic.
   */
  
  public function process(): void {
    // Add any extra processing or formatting if needed.
  }

  /**
   * Normalize the object for output.
   *
   * @return array
   */

  public function normalize(): array {
    return [
      'isHidden'  => $this->isHidden,
      'level'     => $this->level,
      'name'      => $this->name,
      'taxNodeID' => $this->taxNodeID,
    ];
  }
}