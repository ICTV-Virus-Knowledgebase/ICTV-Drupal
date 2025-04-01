


//----------------------------------------------------------------------------------------------------------------
// Enums
//----------------------------------------------------------------------------------------------------------------

export enum CuratedNameType {
   disease = "disease",
   other = "other"
}

export enum IdPrefix {
   ictvID = "ICTV",
   MSL = "MSL",
   taxnodeID = "TN",
   VMR = "VMR"
}

export enum JobStatus {
   complete = "complete",
   crashed = "crashed",
   error = "error",
   invalid = "invalid",
   pending = "pending",
   valid = "valid"
}

export enum NameClass {
   abbreviation = "abbreviation",
   acronym = "acronym",
   authority = "authority",
   blast_name = "blast_name",
   common_name = "common_name",
   disease = "disease",
   equivalent_name = "equivalent_name",
   genbank_accession = "genbank_accession",
   genbank_acronym = "genbank_acronym",
   genbank_common_name = "genbank_common_name",
   includes = "includes",
   in_part = "in_part",
   isolate_abbreviation = "isolate_abbreviation",
   isolate_designation = "isolate_designation",
   isolate_exemplar = "isolate_exemplar",
   isolate_name = "isolate_name",
   refseq_accession = "refseq_accession",
   refseq_organism = "refseq_organism",
   scientific_name = "scientific_name",
   synonym = "synonym",
   taxon_name = "taxon_name",
   type_material = "type_material"
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
   all_words = "all_words",
   any_words = "any_words",
   contains = "contains",
   exact_match = "exact_match"
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
   disease_ontology = "disease_ontology",
   ictv_curation = "ictv_curation",
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

   // Curated name
   createCuratedName = "createCuratedName",
   deleteCuratedName = "deleteCuratedName",
   getCuratedName = "getCuratedName",
   getCuratedNames = "getCuratedNames",
   updateCuratedName = "updateCuratedName",
   
   // The Drupal CSRF token
   csrfToken = "csrfToken",
   
   // Proposal service
   proposal = "proposal",

   // Sequence search
   getSequenceSearchResult = "getSequenceSearchResult",
   uploadSequences = "uploadSequences",

   // Taxonomy
   taxonomy = "taxonomy",
   taxonomyHistory = "taxonomyHistory",
   
   // Member species table
   virusIsolate = "virusIsolate",

   // Virus name lookup
   virusNameLookup = "virusNameLookup"
}

// Keys used to set and retrieve data in local (web) storage.
export enum WebStorageKey {
   sequenceSearchUserUID = "sequence_search_user_uid"
}

//-----------------------------------------------------------------------------------------------------------------------------
// Functions that use enums
//-----------------------------------------------------------------------------------------------------------------------------

export function LookupNameClass(nameClass_: NameClass, taxonomyDB_: TaxonomyDB) {

   if (taxonomyDB_ !== TaxonomyDB.ictv_vmr) { return nameClass_.replace("_", " "); }

   switch (nameClass_) {
      case NameClass.genbank_accession:
         return "virus GenBank accession";
      case NameClass.isolate_abbreviation:
         return "virus name abbreviation";
      case NameClass.isolate_designation:
         return "virus isolate designation"; 
      case NameClass.isolate_name:
         return "virus name";
      case NameClass.refseq_accession:
         return "virus RefSeq accession";
      default: 
         return nameClass_.replace("_", " ");
   }
}

export function LookupNameClassDefinition(nameClass_: NameClass, taxonomyDB_: TaxonomyDB) {

   if (taxonomyDB_ === TaxonomyDB.ictv_vmr) {

      switch (nameClass_) {
         case NameClass.genbank_accession:
            return "The GenBank (nucleotide) accession number(s) for the exemplar (or additional) virus isolate of the indicated species";

         case NameClass.isolate_abbreviation:
            return "Commonly used abbreviation(s) of the virus name(s)";

         case NameClass.isolate_designation:
            return "The designation of the virus isolate (often also referred to as variants or strains)"; 

         case NameClass.isolate_name:
            return "Commonly used virus name or names";

         case NameClass.refseq_accession:
            return "The equivalent RefSeq accession numbers for the GenBank (nucleotide) accession number(s)";

         default: 
            return nameClass_.replace("_", " ");
      }

   } else {

      switch (nameClass_) { 

         case NameClass.abbreviation:
            return "An abbreviation associated with the virus";

         case NameClass.acronym:
            return "An acronym associated with the virus";

         case NameClass.authority:
            return "The name of the scientist(s) who originally described the virus and the year it was published";

         case NameClass.blast_name:
            return "A simplified name used by BLAST (Basic Local Alignment Search Tool) for grouping organisms into broad categories";

         case NameClass.common_name:
            return "An informal name in common usage";

         case NameClass.disease:
            return "A disease caused by a virus";

         case NameClass.equivalent_name:
            return "A name that is considered equivalent to the scientific name but may not be currently used";

         case NameClass.genbank_accession:
            return "A unique alphanumeric identifier assigned to a specific sequence record in the GenBank database";

         case NameClass.genbank_acronym:
            return "An acronym used in GenBank records";

         case NameClass.genbank_common_name:
            return "The common name associated with the virus used specifically in GenBank records";

         case NameClass.includes:
            return "A name that encompasses subgroups or other taxa included within the current taxon";

         case NameClass.in_part:
            return "A name that is only partially synonymous with the virus";

         case NameClass.isolate_abbreviation:
            return "A shortened or abbreviated form of a specific isolate's name";

         case NameClass.isolate_designation:
            return "A specific identifier or label given to a particular isolate, often used to differentiate among multiple isolates of the same species";

         case NameClass.isolate_exemplar:
            return "A representative isolate chosen as the best example or reference for a specific group, strain, or species";

         case NameClass.isolate_name:
            return "The full or descriptive name assigned to an isolate, often reflecting its source, collection location, or other unique characteristics";
         
         case NameClass.refseq_accession:
            return "A unique alphanumeric identifier assigned to a specific sequence record in the NCBI RefSeq (Reference Sequence) database";

         case NameClass.refseq_organism:
            return "The organism name associated with a specific RefSeq entry. It refers to the taxonomic identity of the organism for which a curated reference sequence is provided in the RefSeq database";
         
         case NameClass.scientific_name:
            return "Name derived from NCBI lineage";

         case NameClass.synonym:
            return "Alternative scientific names that have been historically used for a virus or taxon but are not the currently accepted name";

         case NameClass.taxon_name:
            return "A formal taxonomic name";

         case NameClass.type_material:
            return "A name related to the type specimen or type material upon which the taxon's description is based";
      }
   }
}

// Return the value of the taxonomy rank enum.
export function LookupTaxonomyRank(rank_: string) {
   return TaxonomyRank[rank_ as TaxonomyRank];
}