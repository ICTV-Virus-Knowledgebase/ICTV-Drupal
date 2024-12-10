


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

export enum SearchModifier {
   contains = "contains",
   starts_with = "starts_with"
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

// The taxonomy databases
export enum TaxonomyDB {
   ictv_epithets = "ictv_epithets",
   ictv_taxonomy = "ictv_taxonomy",
   ictv_vmr = "ictv_vmr",
   ncbi_taxonomy = "ncbi_taxonomy"
}

// The display type determines how the control is initially populated.
export enum TaxonomyDisplayType {
   default_to_page = "default_to_page",
   display_all = "display_all",
   display_release_history = "display_release_history",
   display_unassigned_child_taxa = "display_unassigned_child_taxa",
   user_entered = "user_entered"
}

// Taxonomy ranks found in ICTV and NCBI Taxonomies.
export enum TaxonomyRank {
   biotype = "Biotype",
   clade = "Clade",
   class = "Class",
   cohort = "Cohort",
   family = "Family",
   forma = "Forma",
   forma_specialis = "Forma Specialis",
   genotype = "Genotype",
   genus = "Genus",
   infraclass = "Infraclass",
   infraorder = "Infraorder",
   isolate = "Isolate",
   kingdom = "Kingdom",
   morph = "Morph",
   no_rank = "No rank",
   order = "Order",
   parvorder = "Parvorder",
   pathogroup = "Pathogroup",
   phylum = "Phylum",
   realm = "Realm",
   section = "Section",
   series = "Series",
   serogroup = "Serogroup",
   serotype = "Serotype",
   species = "Species",
   species_group = "Species group",
   species_subgroup = "Species subgroup",
   strain = "Strain",
   subclass = "Subclass",
   subcohort = "Subcohort",
   subfamily = "Subfamily",
   subgenus = "Subgenus",
   subkingdom = "Subkingdom",
   suborder = "Suborder",
   subphylum = "Subphylum",
   subrealm = "Subrealm",
   subsection = "Subsection",
   subspecies = "Subspecies",
   subtribe = "Subtribe",
   superclass = "Superclass",
   superfamily = "Superfamily",
   superkingdom = "Superkingdom",
   superorder = "Superorder",
   superphylum = "Superphylum",
   tribe = "Tribe",
   varietas = "Varietas"
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


//-----------------------------------------------------------------------------------------------------------------------------
// Functions that use enums
//-----------------------------------------------------------------------------------------------------------------------------

// Return the value of the taxonomy rank enum.
export function LookupTaxonomyRank(rank_: string) {
   return TaxonomyRank[rank_ as TaxonomyRank];
}