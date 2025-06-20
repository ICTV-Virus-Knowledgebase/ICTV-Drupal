<?php
namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

class HistoricalTaxon {
   
   public ?int $selectedTaxon;
   public ?int $ictvID;
   public int $isDeleted;
   public int $isDemoted;
   public int $isLineageUpdated;
   public int $isMerged;
   public int $isMoved;
   public int $isNew;
   public int $isPromoted;
   public int $isRenamed;
   public int $isSelected;
   public int $isSplit;
   public ?string $lineageIDs;
   public ?string $lineageNames;
   public ?string $lineageRanks;
   public int $mslReleaseNum;
   public ?string $name;
   public ?string $prevLineageNames;
   public ?string $prevLineageRanks;
   public ?string $prevNames;
   public ?string $prevNotes;
   public ?string $prevProposal;
   public ?string $rankName;
   public int $taxnodeID;

 
   public static function fromArray(array $d): self {

      $o = new self();

      $o->ictvID           = isset($d["ictv_id"]) ? (int)$d["ictv_id"] : null;
      $o->isDeleted        = isset($d["is_deleted"]) ? (int)$d["is_deleted"] : 0;
      $o->isDemoted        = isset($d["is_demoted"]) ? (int)$d["is_demoted"] : 0;
      $o->isLineageUpdated = isset($d["is_lineage_updated"]) ? (int)$d["is_lineage_updated"] : 0;
      $o->isMerged         = isset($d["is_merged"]) ? (int)$d["is_merged"] : 0;
      $o->isMoved          = isset($d["is_moved"]) ? (int)$d["is_moved"] : 0;
      $o->isNew            = isset($d["is_new"]) ? (int)$d["is_new"] : 0;
      $o->isPromoted       = isset($d["is_promoted"]) ? (int)$d["is_promoted"] : 0;
      $o->isRenamed        = isset($d["is_renamed"]) ? (int)$d["is_renamed"] : 0;
      $o->isSelected       = isset($d["is_selected"]) ? (int)$d["is_selected"] : 0;
      $o->isSplit          = isset($d["is_split"]) ? (int)$d["is_split"] : 0;
      $o->lineageIDs       = $d["lineage_ids"] ?? null;
      $o->lineageNames     = $d["lineage_names"] ?? null;
      $o->lineageRanks     = $d["lineage_ranks"] ?? null;
      $o->mslReleaseNum    = isset($d["msl_release_num"]) ? (int)$d["msl_release_num"] : 0;
      $o->name             = $d["name"] ?? null;
      $o->prevLineageNames = $d["prev_lineage_names"] ?? null;
      $o->prevLineageRanks = $d["prev_lineage_ranks"] ?? null;
      $o->prevNames        = $d["prev_names"] ?? null;
      $o->prevNotes        = $d["prev_notes"] ?? null;
      $o->prevProposal     = $d["prev_proposal"] ?? null;
      $o->rankName         = $d["rank_name"] ?? null;
      $o->taxnodeID        = isset($d["taxnode_id"]) ? (int)$d["taxnode_id"] : 0;

      return $o;
   }

   public function normalize(): array {
      return [
         "ictvID"           => $this->ictvID,
         "isDeleted"        => $this->isDeleted == 1,
         "isDemoted"        => $this->isDemoted == 1,
         "isLineageUpdated" => $this->isLineageUpdated == 1,
         "isMerged"         => $this->isMerged == 1,
         "isMoved"          => $this->isMoved == 1,
         "isNew"            => $this->isNew == 1,
         "isPromoted"       => $this->isPromoted == 1,
         "isRenamed"        => $this->isRenamed == 1,
         "isSelected"       => $this->isSelected == 1,
         "isSplit"          => $this->isSplit == 1,
         "lineageIDs"       => $this->lineageIDs,
         "lineageNames"     => $this->lineageNames,
         "lineageRanks"     => $this->lineageRanks,
         "mslReleaseNum"    => $this->mslReleaseNum,
         "name"             => $this->name,
         "prevLineageNames" => $this->prevLineageNames,
         "prevLineageRanks" => $this->prevLineageRanks,
         "prevNames"        => $this->prevNames,
         "prevNotes"        => $this->prevNotes,
         "prevProposal"     => $this->prevProposal,
         "rankName"         => $this->rankName,
         "taxnodeID"        => $this->taxnodeID
      ];
   }
}