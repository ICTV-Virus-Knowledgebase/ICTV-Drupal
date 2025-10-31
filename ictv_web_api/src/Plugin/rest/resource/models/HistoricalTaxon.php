<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

use Drupal\ictv_web_api\helpers\Common;


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
   public ?string $lineageNames;
   public ?string $lineageIDs;
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
   public int $treeID;

 
   public static function fromArray(array $d): self {

      $o = new self();

      $o->ictvID           = Common::getIntParameter($d, "ictv_id") ?? null;
      $o->isDeleted        = Common::getIntParameter($d, "is_deleted") ?? 0;
      $o->isDemoted        = Common::getIntParameter($d, "is_demoted") ?? 0;
      $o->isLineageUpdated = Common::getIntParameter($d, "is_lineage_updated") ?? 0;
      $o->isMerged         = Common::getIntParameter($d, "is_merged") ?? 0;
      $o->isMoved          = Common::getIntParameter($d, "is_moved") ?? 0;
      $o->isNew            = Common::getIntParameter($d, "is_new") ?? 0;
      $o->isPromoted       = Common::getIntParameter($d, "is_promoted") ?? 0;
      $o->isRenamed        = Common::getIntParameter($d, "is_renamed") ?? 0;
      $o->isSelected       = Common::getIntParameter($d, "is_selected") ?? 0;
      $o->isSplit          = Common::getIntParameter($d, "is_split") ?? 0;
      $o->lineageNames     = $d["lineage_names"] ?? null;
      $o->lineageIDs       = $d["lineage_ids"] ?? null;
      $o->lineageRanks     = $d["lineage_ranks"] ?? null;
      $o->mslReleaseNum    = Common::getIntParameter($d, "msl_release_num") ?? 0;
      $o->name             = $d["name"] ?? null;
      $o->prevLineageNames = $d["prev_lineage_names"] ?? "";
      $o->prevLineageRanks = $d["prev_lineage_ranks"] ?? null;
      $o->prevNames        = $d["prev_names"] ?? null;
      $o->prevNotes        = $d["prev_notes"] ?? null;
      $o->prevProposal     = $d["prev_proposal"] ?? null;
      $o->rankName         = $d["rank_name"] ?? null;
      $o->taxnodeID        = Common::getIntParameter($d, "taxnode_id", true);
      $o->treeID           = Common::getIntParameter($d, "tree_id", true);

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
         "lineageNames"     => $this->lineageNames,
         "lineageIDs"       => $this->lineageIDs,
         "lineageRanks"     => $this->lineageRanks,
         "mslReleaseNum"    => $this->mslReleaseNum,
         "name"             => $this->name,
         "prevLineageNames" => $this->prevLineageNames,
         "prevLineageRanks" => $this->prevLineageRanks,
         "prevNames"        => $this->prevNames,
         "prevNotes"        => $this->prevNotes,
         "prevProposal"     => $this->prevProposal,
         "rankName"         => $this->rankName,
         "taxnodeID"        => $this->taxnodeID,
         "treeID"           => $this->treeID,
      ];
   }
}