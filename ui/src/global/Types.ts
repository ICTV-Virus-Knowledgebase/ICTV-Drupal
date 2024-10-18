


//----------------------------------------------------------------------------------------------------------------
// Enums
//----------------------------------------------------------------------------------------------------------------

export enum JobStatus {
   crashed = "crashed",
   invalid = "invalid",
   pending = "pending",
   valid = "valid"
}

export enum OrderedTaxaLevel {
   tree = 0,
   realm = 1,
   subrealm = 2,
   kingdom = 3,
   subkingdom = 4,
   phylum = 5,
   subphylum = 6,
   class = 7,
   subclass = 8,
   order = 9,
   suborder = 10,
   family = 11,
   subfamily = 12,
   genus = 13,
   subgenus = 14,
   species = 15
}

export enum TaxaLevel {
   tree = "tree",
   realm = "realm",
   subrealm = "subrealm",
   kingdom = "kingdom",
   subkingdom = "subkingdom",
   phylum = "phylum",
   subphylum = "subphylum",
   class = "class",
   subclass = "subclass",
   order = "order",
   suborder = "suborder",
   family = "family",
   subfamily = "subfamily",
   genus = "genus",
   subgenus = "subgenus",
   species = "species"
}

export enum TaxaLevelLabel {
   tree = "Tree",
   realm = "Realm",
   subrealm = "Subrealm",
   kingdom = "Kingdom",
   subkingdom = "Subkingdom",
   phylum = "Phylum",
   subphylum = "Subphylum",
   class = "Class",
   subclass = "Subclass",
   order = "Order",
   suborder = "Suborder",
   family = "Family",
   subfamily = "Subfamily",
   genus = "Genus",
   subgenus = "Subgenus",
   species = "Species"
}

// The display type determines how the control is initially populated.
export enum TaxonomyDisplayType {
   default_to_page = "default_to_page",
   display_all = "display_all",
   display_release_history = "display_release_history",
   display_unassigned_child_taxa = "display_unassigned_child_taxa",
   user_entered = "user_entered"
}

// All taxa that can be displayed in the "top-level rank" control (for now we're only excluding "tree").
export enum TopLevelRank {
   realm = "realm",
   subrealm = "subrealm",
   kingdom = "kingdom",
   subkingdom = "subkingdom",
   phylum = "phylum",
   subphylum = "subphylum",
   class = "class",
   subclass = "subclass",
   order = "order",
   suborder = "suborder",
   family = "family",
   subfamily = "subfamily",
   genus = "genus",
   subgenus = "subgenus",
   species = "species"
}

// Keys representing all available web services.
export enum WebServiceKey {
   csrfToken = "csrfToken",
   proposal = "proposal",
   sequenceClassifier = "sequenceClassifier",
   taxonomy = "taxonomy",
   taxonomyHistory = "taxonomyHistory",
   virusIsolate = "virusIsolate",
   virusNameLookup = "virusNameLookup"
}
