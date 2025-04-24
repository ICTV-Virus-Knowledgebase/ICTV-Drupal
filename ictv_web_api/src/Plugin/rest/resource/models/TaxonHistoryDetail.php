<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class TaxonHistoryDetail {

  public ?string $lineage;
  public int    $mslRelease;
  public ?string $rankName;
  public ?string $rankNames;
  // public ?string $resultType;
  public int    $taxnodeID;
  public ?string $taxonName;
  public int    $treeID;

  public static function fromArray(array $d): self {

    $o = new self();

    $o->lineage    = $d['tax_lineage'];
    $o->mslRelease = (int)$d['tax_msl_release_num'];
    $o->rankName   = $d['tax_rank_name'];
    $o->rankNames  = $d['tax_rank_names'];
    // $o->resultType = $d['result_type'];
    $o->taxnodeID  = (int)$d['tax_taxnode_id'];
    $o->taxonName  = $d['tax_taxon_name'];
    $o->treeID     = (int)$d['tree_id'];

    return $o;
  }

  public function normalize(): array {

    return [
      'lineage'       => $this->lineage,
      'mslRelease'    => $this->mslRelease,
      'rankName'      => $this->rankName,
      'rankNames'     => $this->rankNames,
      // 'resultType'    => $this->resultType,
      'taxnodeID'     => $this->taxnodeID,
      'taxonName'     => $this->taxonName,
      'treeID'        => $this->treeID,
    ];
  }
}