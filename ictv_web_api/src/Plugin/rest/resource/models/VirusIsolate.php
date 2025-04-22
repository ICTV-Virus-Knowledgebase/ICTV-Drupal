<?php

namespace Drupal\ictv_web_api\Plugin\rest\resource\models;

/**
 * Minimal POPO that mirrors columns returned by getVirusIsolates().
 */

 final class VirusIsolate {

    /* original props … */
      public ?string $abbrev = null;
      public ?string $accessionNumber = null;
      public ?string $alternativeNameCSV = null;
      public ?string $availableSequence = null;
      public ?string $exemplar = null;
      public bool   $familyOrSubfamilySearch = false;
      public ?string $genus = null;
      public ?string $isolate = null;
      public ?string $refSeqAccession = null;
      public ?string $species = null;
      public ?string $subfamily = null;
      public ?string $subgenus = null;
      public ?int    $taxNodeID = null;
    
    /* ---------- new rank‑level props ---------- */
      public string $subrealm  = '';
      public string $kingdom   = '';
      public string $subkingdom = '';
      public string $phylum    = '';
      public string $subphylum = '';
      public string $class_    = '';   // trailing “_” → PHP keyword safe
      public string $subclass  = '';
      public string $order     = '';
      public string $suborder  = '';
      public string $family    = '';
    
    /* ----------------------------------------- */
    
      public static function fromArray(array $db): self {

        $o = new self();

        $o->abbrev = $db["abbrev"];
        $o->accessionNumber = $db["accession_number"];
        $o->alternativeNameCSV = $db["alternative_name_csv"];
        $o->availableSequence = $db["available_sequence"];
        $o->exemplar = $db["exemplar"];
        $o->isolate = $db["isolate"];
        $o->refSeqAccession = $db["refseq_accession"];
        $o->taxNodeID = $db["taxnode_id"];
        $o->subrealm = $db["subrealm"];
        $o->kingdom = $db["kingdom"];
        $o->subkingdom = $db["subkingdom"];
        $o->phylum = $db["phylum"];
        $o->class_ = $db["class"];
        $o->subclass = $db["subclass"];
        $o->order = $db["order"];
        $o->suborder = $db["suborder"];
        $o->family = $db["family"];
        $o->subfamily = $db["subfamily"];
        $o->genus = $db["genus"];
        $o->subgenus = $db["subgenus"];
        $o->species = $db["species"];
        // foreach ($db as $k => $v) {
        //   $prop = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $k))));
        //   // special‑case “class” → “class_”
        //   if ($prop === 'class') { $prop = 'class_'; }
        //   if (property_exists($o, $prop)) {
        //     $o->$prop = $v;
        //   }
        // }
        return $o;
      }
    
      public function normalize(): array {
        
        // return get_object_vars($this);
        return [
            "abbrev" => $this->abbrev,
            "accessionNumber" => $this->accessionNumber,
            "alternativeNameCSV"  => $this->alternativeNameCSV,
            "availableSequence" => $this->availableSequence,
            "exemplar" => $this->exemplar,
            "isolate" => $this->isolate,
            "refSeqAccession" => $this->refSeqAccession,
            "taxNodeID" => $this->taxNodeID,
            "subrealm" => $this->subrealm,
            "kingdom" => $this->kingdom,
            "subkingdom" => $this->subkingdom,
            "phylum" => $this->phylum,
            "class_" => $this->class_,
            "subclass" => $this->subclass,
            "order" => $this->order,
            "suborder" => $this->suborder,
            "family" => $this->family,
            "subfamily" => $this->subfamily,
            "genus" => $this->genus,
            "subgenus" => $this->subgenus,
            "species" => $this->species
         ];
      }
    }