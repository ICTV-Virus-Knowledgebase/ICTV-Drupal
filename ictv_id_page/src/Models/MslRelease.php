<?php

namespace Drupal\ictv_id_page\Models;



class MslRelease {

   public ?int $mslReleaseNum;
   public ?string $notes;
   public ?int $treeID;
   public ?string $year;

   public ?int $realms;
   public ?int $subrealms;
   public ?int $kingdoms;
   public ?int $subkingdoms;
   public ?int $phyla;
   public ?int $subphyla;
   public ?int $classes;
   public ?int $subclasses;
   public ?int $orders;
   public ?int $suborders;
   public ?int $families;
   public ?int $subfamilies;
   public ?int $genera;
   public ?int $subgenera;
   public ?int $species;


   // C-tor
   public function __construct() {

      // Provide defaults for all member variables.
      $this->mslReleaseNum = 0;
      $this->notes = "";
      $this->treeID = 0;
      $this->year = "";

      $this->realms = 0;
      $this->subrealms = 0;
      $this->kingdoms = 0;
      $this->subkingdoms = 0;
      $this->phyla = 0;
      $this->subphyla = 0;
      $this->classes = 0;
      $this->subclasses = 0;
      $this->orders = 0;
      $this->suborders = 0;
      $this->families = 0;
      $this->subfamilies = 0;
      $this->genera = 0;
      $this->subgenera = 0;
      $this->species = 0;
   }
   

   // Method to populate the object from an associative array
   public static function fromArray(array $data): MslRelease {

      $instance = new self();
      
      $instance->mslReleaseNum = $data["msl_release_num"];
      $instance->notes = $data["notes"];
      $instance->treeID = $data["tree_id"];
      $instance->year = $data["year"];

      $instance->realms = $data["realms"];
      $instance->subrealms = $data["subrealms"];
      $instance->kingdoms = $data["kingdoms"];
      $instance->subkingdoms = $data["subkingdoms"];
      $instance->phyla = $data["phyla"];
      $instance->subphyla = $data["subphyla"];
      $instance->classes = $data["classes"];
      $instance->subclasses = $data["subclasses"];
      $instance->orders = $data["orders"];
      $instance->suborders = $data["suborders"];
      $instance->families = $data["families"];
      $instance->subfamilies = $data["subfamilies"];
      $instance->genera = $data["genera"];
      $instance->subgenera = $data["subgenera"];
      $instance->species = $data["species"];

      return $instance;
   }


   /**
    * {@inheritdoc}
    */
   public function normalize() {
      return [
         "mslReleaseNum" => $this->mslReleaseNum,
         "notes" => $this->notes,
         "treeID" => $this->treeID,
         "year" => $this->year,

         "realms" => $this->realms,
         "subrealms" => $this->subrealms,
         "kingdoms" => $this->kingdoms,
         "subkingdoms" => $this->subkingdoms,
         "phyla" => $this->phyla,
         "subphyla" => $this->subphyla,
         "classes" => $this->classes,
         "subclasses" => $this->subclasses,
         "orders" => $this->orders,
         "suborders" => $this->suborders,
         "families" => $this->families,
         "subfamilies" => $this->subfamilies,
         "genera" => $this->genera,
         "subgenera" => $this->subgenera,
         "species" => $this->species
      ];
   }

}

