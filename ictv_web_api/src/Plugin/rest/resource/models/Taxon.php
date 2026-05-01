<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

// Helper
use Drupal\ictv_web_api\helpers\TaxonomyHelper;
use Drupal\ictv_web_api\helpers\Common;

class Taxon {

  public ?string $childTaxaCount;
  public ?string $filename;
  public ?string $immediateChildTaxaCount;
  public bool $isExpanded = false;
  public bool $isReference = false;
  public ?string $levelName;
  public ?int $levelID;
  public ?string $lineage;
  public ?int $mslReleaseNum;
  public ?int $nextDeltaCount;
  public ?int $nodeDepth;
  public ?int $numChildren;
  public ?int $parentID;
  public ?int $parentLevelID;
  public ?string $parentLevelName;
  public ?int $prevDeltaCount;
  public ?string $taxonName;
  public ?int $taxnodeID;
  public ?int $treeID;
  public ?string $memberOf = null;

  /**
   * Equivalent to `process()` in the C# code.
   * i.e. apply italics
   */
  public function process(): void {
    if ($this->taxonName !== null && Common::italicizeTaxaName($this->taxonName)) {
      $this->taxonName = "<i>{$this->taxonName}</i>";
    }
  }
  
  /**
   * Build a Taxon from an associative array (DB row).
   */

  public static function fromArray(array $data): Taxon {

    $taxon = new self();

    $taxon->childTaxaCount          = $data['childTaxaCount'] ?? null;
    $taxon->filename                = $data['filename'] ?? null;
    $taxon->immediateChildTaxaCount = $data['immediateChildTaxaCount'] ?? null;
    $taxon->isExpanded              = !empty($data['is_expanded']) ? (bool) $data['is_expanded'] : false;
    $taxon->isReference             = !empty($data['is_reference']) ? (bool) $data['is_reference'] : false;
    $taxon->levelName               = $data['level_name'] ?? null;
    $taxon->levelID                 = isset($data['level_id']) ? (int)$data['level_id'] : null;
    $taxon->lineage                 = $data['lineage'] ?? null;
    $taxon->mslReleaseNum           = isset($data['msl_release_num']) ? (int)$data['msl_release_num'] : 0;
    $taxon->nextDeltaCount          = isset($data['next_delta_count']) ? (int)$data['next_delta_count'] : 0;
    $taxon->nodeDepth               = isset($data['node_depth']) ? (int)$data['node_depth'] : 0;
    $taxon->numChildren             = isset($data['num_children']) ? (int)$data['num_children'] : 0;
    $taxon->parentID                = isset($data['parent_id']) ? (int)$data['parent_id'] : null;
    $taxon->parentLevelID           = isset($data['parent_level_id']) ? (int)$data['parent_level_id'] : 0;
    $taxon->parentLevelName         = $data['parent_level_name'] ?? null;
    $taxon->prevDeltaCount          = isset($data['prev_delta_count']) ? (int)$data['prev_delta_count'] : 0;
    $taxon->taxonName               = $data['taxon_name'] ?? null;
    $taxon->taxnodeID               = isset($data['taxnode_id']) ? (int)$data['taxnode_id'] : null;
    $taxon->treeID                  = isset($data['tree_id']) ? (int)$data['tree_id'] : null;

    return $taxon;
  }

  public function normalize(): array {
    return [
      'childTaxaCount'          => $this->childTaxaCount,
      'filename'                => $this->filename,
      'immediateChildTaxaCount' => $this->immediateChildTaxaCount,
      'isExpanded'              => $this->isExpanded,
      'isReference'             => $this->isReference,
      'levelName'               => $this->levelName,
      'levelID'                 => $this->levelID,
      'lineage'                 => $this->lineage,
      'memberOf'                => $this->memberOf, // Calculated by getMemberOf()
      'mslReleaseNum'           => $this->mslReleaseNum,
      'nextDeltaCount'          => $this->nextDeltaCount,
      'nodeDepth'               => $this->nodeDepth,
      'numChildren'             => $this->numChildren,
      'parentID'                => $this->parentID,
      'parentLevelID'           => $this->parentLevelID,
      'parentLevelName'         => $this->parentLevelName,
      'prevDeltaCount'          => $this->prevDeltaCount,
      'taxonName'               => $this->taxonName,
      'taxnodeID'               => $this->taxnodeID,
      'treeID'                  => $this->treeID
    ];
  }
  
  // Calculate memberOf value.
  public function getMemberOf(): string {
    if (empty($this->lineage)) {
      return "";
    }

    $ancestors = explode(";", $this->lineage);

    // if there's more than one item
    if (count($ancestors) > 1) {
      $immediateParent = trim($ancestors[count($ancestors) - 2]);
      if (Common::italicizeTaxaName($immediateParent)) {
        $immediateParent = "<i>{$immediateParent}</i>";
      }
      return $immediateParent;
    }
    return "";
  }  

}
