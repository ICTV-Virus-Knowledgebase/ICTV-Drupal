<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class TaxonHistoryTaxon {
  public ?int   $ictvID;
  public bool   $isType;
  public string $lineage;
  public ?string $prevNotes;
  public ?string $prevProposal;
  public string  $prevTagCSV;
  public string  $rankNames;
  public int     $taxnodeID;
  public int     $treeID;

  public static function fromArray(array $d): self {
    $o = new self();
    $o->ictvID       = isset($d['ictv_id']) ? (int)$d['ictv_id'] : NULL;
    $o->isType       = (bool)$d['current_is_type'];
    $o->lineage      = $d['current_lineage'];
    $o->prevNotes    = $d['prev_notes']    ?? NULL;
    $o->prevProposal = $d['prev_proposal'] ?? NULL;
    $o->prevTagCSV   = $d['prev_tag_csv'];
    $o->rankNames    = $d['rank_names'];
    $o->taxnodeID    = (int)$d['taxnode_id'];
    $o->treeID       = (int)$d['tree_id'];
    return $o;
  }

  public function normalize(): array {
    return [
      'ictvID'       => $this->ictvID,
      'isType'       => $this->isType,
      'lineage'      => $this->lineage,
      'prevNotes'    => $this->prevNotes,
      'prevProposal' => $this->prevProposal,
      'prevTagCSV'   => $this->prevTagCSV,
      'rankNames'    => $this->rankNames,
      'taxnodeID'    => $this->taxnodeID,
      'treeID'       => $this->treeID,
    ];
  }
}