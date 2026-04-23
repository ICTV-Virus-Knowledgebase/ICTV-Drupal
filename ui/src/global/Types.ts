
//----------------------------------------------------------------------------------------------------------------
// Enums
//----------------------------------------------------------------------------------------------------------------

export enum CuratedNameType {
   disease = "disease",
   other = "other"
}

// The validation status of a FASTA record.
export enum FastaStatus {
   empty = "empty",
   invalid = "invalid",
   unvalidated = "unvalidated",
   valid = "valid",
   validated = "validated"
}

// Commonly used URL query string parameter names for identifiers.
export enum IdParameterName {

   // ICTV ID
   ictv = "ictv",
   ictv_id = "ictv_id",

   // ID
   id = "id",

   // MSL ID
   msl = "msl",
   //msl_id = "msl_id",

   // Taxnode ID
   taxnode_id = "taxnode_id",
   tn = "tn",
   tn_id = "tn_id",

   // Taxon name
   taxon_name = "taxon_name",

   // VMR ID
   vmr = "vmr",
   vmr_id = "vmr_id"
}

export enum IdentifierPrefix {
   ICTV = "ICTV",
   MSL = "MSL",
   none = "none",
   TaxNodeID = "TN",
   VMR = "VMR"
}

export enum IdentifierType {
   ICTV = "ICTV",
   MSL = "MSL",
   none = "none",
   TaxNodeID = "TaxNodeID",
   TaxonName = "TaxonName",
   VMR = "VMR"
}

export enum JobStatus {
   complete = "complete",
   crashed = "crashed",
   error = "error",
   invalid = "invalid",
   notSubmitted = "notSubmitted",
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

export enum ReleaseAction {
   abolished = "abolished",
   current = "current",
   demoted = "demoted",
   lineageUpdated = "lineage_updated",
   merged = "merged",
   moved = "moved",
   new = "new",
   promoted = "promoted",
   renamed = "renamed",
   split = "split",
   unchanged = "unchanged"
}

export enum SearchModifier {
   all_words = "all_words",
   any_words = "any_words",
   contains = "contains",
   exact_match = "exact_match"
}

export enum SequenceType {
   ambiguous = "ambiguous",
   invalid = "invalid",
   mixed = "mixed",
   nucleotide = "nucleotide",
   protein = "protein",
   unknown = "unknown"
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
   ncbi_taxonomy = "ncbi_taxonomy",

   // "Unspecified" is a placeholder value for when the taxonomy database is unknown or not applicable.
   unspecified = "unspecified"
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
   biotype = "biotype",
   clade = "clade",
   class = "class",
   cohort = "cohort",
   family = "family",
   forma = "forma",
   forma_specialis = "forma_specialis",
   genotype = "genotype",
   genus = "genus",
   infraclass = "infraclass",
   infraorder = "infraorder",
   isolate = "isolate",
   kingdom = "kingdom",
   morph = "morph",
   no_rank = "no_rank",
   order = "order",
   parvorder = "parvorder",
   pathogroup = "pathogroup",
   phylum = "phylum",
   realm = "realm",
   section = "section",
   series = "series",
   serogroup = "serogroup",
   serotype = "serotype",
   species = "species",
   species_group = "species_group",
   species_subgroup = "species_subgroup",
   strain = "strain",
   subclass = "subclass",
   subcohort = "subcohort",
   subfamily = "subfamily",
   subgenus = "subgenus",
   subkingdom = "subkingdom",
   suborder = "suborder",
   subphylum = "subphylum",
   subrealm = "subrealm",
   subsection = "subsection",
   subspecies = "subspecies",
   subtribe = "subtribe",
   superclass = "superclass",
   superfamily = "superfamily",
   superkingdom = "superkingdom",
   superorder = "superorder",
   superphylum = "superphylum",
   tribe = "tribe",
   varietas = "varietas"
}

export enum IctvRank {
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

export enum IctvRankLabel {
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
   getProposalJobs = "getProposalJobs",
   getProposalValidationSummary = "getProposalValidationSummary",
   uploadProposals = "uploadProposals",
   
   // TaxaBLAST
   downloadTaxaBlastFile = "downloadTaxaBlastFile", //download-taxablast-file
   getTaxaBlastOutputFile = "getTaxaBlastOutputFile",
   getTaxaBlastJob = "getTaxaBlastJob",
   searchTaxaBlastJobs = "searchTaxaBlastJobs",
   uploadSequences = "uploadSequences",

   // Taxonomy
   getByReleasePreExpanded = "getByReleasePreExpanded",
   getChildTaxa = "getChildTaxa",
   getMslRelease = "getMslRelease",
   getReleaseHistory = "getReleaseHistory",
   //getReleaseTaxa = "getReleaseTaxa",
   getTaxaByName = "getTaxaByName",
   getTaxonDetails = "getTaxonDetails",
   getTreeExpandedToNode = "getTreeExpandedToNode",
   getUnassignedChildTaxaByName = "getUnassignedChildTaxaByName",
   searchTaxonomy = "searchTaxonomy",

   // Taxonomy history
   taxonomyHistory = "taxonomyHistory",
   
   // Member species table
   virusIsolate = "virusIsolate",

   // Virus name lookup
   virusNameLookup = "virusNameLookup"
}

// Keys used to set and retrieve data in local (web) storage.
export enum WebStorageKey {
   lineageExportSettings = "lineage_export_settings",
   releaseHistoryData = "release_history_data",
   taxaBlastUserUID = "taxa_blast_user_uid",
   taxonomyBrowserData = "taxonomy_browser_data"
}

//----------------------------------------------------------------------------------------------------------------
// Regular expressions
//----------------------------------------------------------------------------------------------------------------
export const REGEX = {

   // Use this regex to match characters that aren't IUPAC approved nucleotide or protein bases (including ambiguity codes).
   NOT_AA_OR_NT: /[^ABCDEFGHIJKLMNOPQRSTUVWXYZ\.\-\*]+/img,
   
   /*
   Standard amino acids: 
   A: Alanine
   C: Cysteine
   D: Aspartic acid
   E: Glutamic acid
   F: Phenylalanine
   G: Glycine
   H: Histidine
   I: Isoleucine
   K: Lysine
   L: Leucine
   M: Methionine
   N: Asparagine
   P: Proline
   Q: Glutamine
   R: Arginine
   S: Serine
   T: Threonine
   V: Valine
   W: Tryptophan
   Y: Tyrosine

   Ambiguity Codes
   B: Aspartic acid or Asparagine (Asp/Asn) 
   J: Leucine or Isoleucine (Leu/Ile)
   O: Pyrrolysine	(non-standard amino acid)
   U: Selenocysteine - This is a standard amino acid, but it is also sometimes represented with the code for Uridine if dealing with RNA or modified nucleotides. However, for protein sequences, U is typically not a valid amino acid, but a nucleic acid base.  
   X: Any amino acid 
   Z: Glutamic acid or Glutamine (Glu/Gln) - Note: Some tools use this for glutamic acid or glutamine, though it's less common in standard FASTA formats for protein sequences, which typically rely on other standard codes. 
   
   */

   // A regex for standard amino acids (proteins) in a FASTA sequence (including ambiguity codes).
   // NOTE: This doesn't appear to be used anywhere.
   FASTA_AA_REGEX: "/^[ABCDEFGHIJKLMNOPQRSTUVWXYZ]+$/i",

   /*
   Standard Bases: 
   A (adenine)
   C (cytosine)
   G (guanine)
   T (thymine) for DNA
   U (uracil) for RNA

   Ambiguity Codes: These represent multiple possibilities or unknown nucleotides, such as:
   B: Not A (C or G or T) 
   D: Not C (A or G or T) 
   H: Not G (A or C or T)
   K: Keto (G or T)
   M: Amino (A or C)
   N: Any nucleotide
   R: Purine (A or G)
   S: Strong (G or C) 
   V: Not T (A or C or G)
   W: Weak (A or T)
   X: Any nucleotide
   Y: Pyrimidine (C or T) 

   Other Allowed Characters
   Hyphen/Dash (-): Used to represent a gap in a sequence alignment.
    
   */

   // A regex for valid nucleotides in a FASTA sequence.
   // NOTE: This doesn't appear to be used anywhere.
   FASTA_NT_REGEX: "/^[ABDCGHKMNRSTUVWXY\-]+$/i"
}

//-----------------------------------------------------------------------------------------------------------------------------
// Functions that use enums
//-----------------------------------------------------------------------------------------------------------------------------

//
// Return true if the value is a valid member of the enum.
//
// Note the strange syntax for the return type. This is a "type predicate" that allows TypeScript to narrow the type 
// of the value in conditional statements that use this function. T is inferred from the enum_ argument, so you can just
// call IsEnumValue(MyEnum, value) without having to specify the type parameter. 
// 
// An interesting aspect of this function is that if it returns true (if value_ is a valid member of the enum), then in the 
// "if true" block where this function is called, TypeScript will treat value_ as have the enum type instead of just a string.
export function IsEnumValue<T extends Record<string, string>>(
   enum_: T,
   value_: string
): value_ is T[keyof T] {
   return Object.values(enum_).includes(value_ as T[keyof T]);
}

export function LookupIdParameterType(parameterName_: IdParameterName|string): IdentifierType {

   if (!parameterName_) { return IdentifierType.none; }
   if (!IsEnumValue(IdParameterName, parameterName_)) { return IdentifierType.none; }

   switch (parameterName_) {

      // ICTV ID
      case IdParameterName.ictv:
      case IdParameterName.ictv_id:
         return IdentifierType.ICTV;
      
      // ID
      case IdParameterName.id:
         return IdentifierType.none;

      // MSL ID
      case IdParameterName.msl:
      //case IdParameterName.msl_id:
         return IdentifierType.MSL;

      // Taxnode ID
      case IdParameterName.taxnode_id:
      case IdParameterName.tn:
      case IdParameterName.tn_id:
         return IdentifierType.TaxNodeID;

      // Taxon name
      case IdParameterName.taxon_name:
         return IdentifierType.TaxonName;

      // VMR ID
      case IdParameterName.vmr:
      case IdParameterName.vmr_id:
         return IdentifierType.VMR;

      default:
         return IdentifierType.none;
   }
}

// Lookup a display value for this name class. If the name class isn't in the enum, just return it with underscores replaced by spaces. 
// This allows us to display name classes that aren't in the enum without causing an error.
export function LookupNameClass(nameClass_: NameClass|string, taxonomyDB_: TaxonomyDB|string): string {

   // Validate the name class.
   if (!nameClass_) { return ""; }
   if (!IsEnumValue(NameClass, nameClass_)) { 
      return (nameClass_ as string).replace(/_/g, " ").toLowerCase(); 
   }

   // For the ICTV VMR, we want to use slightly different display values for some name classes. For example, "isolate_name" 
   // is displayed as "virus name" in the VMR but "isolate name" in other taxonomy databases. So if the taxonomy database is
   // anything other than the VMR, we'll replace underscores with spaces and return that as the display value for the name class.
   if (!IsEnumValue(TaxonomyDB, taxonomyDB_) || taxonomyDB_ !== TaxonomyDB.ictv_vmr) { 
      return (nameClass_ as string).replace(/_/g, " ").toLowerCase(); 
   }

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
         return (nameClass_ as string).replace(/_/g, " ").toLowerCase();
   }
}

export function LookupNameClassDefinition(nameClass_: NameClass|string, taxonomyDB_: TaxonomyDB|string): string {

   // Validate the name class.
   if (!nameClass_) { return ""; }
   if (!IsEnumValue(NameClass, nameClass_)) { 
      return (nameClass_ as string).replace(/_/g, " ").toLowerCase(); 
   }

   // Default taxonomyDB to "unspecified".
   if (!IsEnumValue(TaxonomyDB, taxonomyDB_)) { taxonomyDB_ = TaxonomyDB.unspecified; }

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
            return nameClass_.replace(/_/g, " ").toLowerCase();
      }
   }

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
      
      default:
         return (nameClass_ as string).replace(/_/g, " ").toLowerCase();
   }
}

// Return a display value for this release action.
export function LookupReleaseAction(releaseAction_: ReleaseAction|string): string {

   // Validate the release action.
   if (!releaseAction_) { return ""; }
   if (!IsEnumValue(ReleaseAction, releaseAction_)) { 
      return (releaseAction_ as string).replace(/_/g, " ").toLowerCase(); 
   }

   switch (releaseAction_) {
      case ReleaseAction.abolished:
         return "abolished";
      case ReleaseAction.current:
         return "current";
      case ReleaseAction.demoted:
         return "demoted";
      case ReleaseAction.lineageUpdated:
         return "lineage updated";
      case ReleaseAction.merged:
         return "merged";
      case ReleaseAction.moved:
         return "moved";
      case ReleaseAction.new:
         return "new";
      case ReleaseAction.promoted:
         return "promoted";
      case ReleaseAction.renamed: 
         return "is a rename";
      case ReleaseAction.split:
         return "split";
      case ReleaseAction.unchanged:
         return "unchanged";
      default:
         return (releaseAction_ as string).replace(/_/g, " ").toLowerCase();
   }
}

export function LookupReleaseActionDefinition(releaseAction_: ReleaseAction) {

   // Validate the release action.
   if (!releaseAction_) { return ""; }
   if (!IsEnumValue(ReleaseAction, releaseAction_)) { 
      return (releaseAction_ as string).replace(/_/g, " ").toLowerCase(); 
   }

   switch (releaseAction_) {
      case ReleaseAction.abolished:
         return "The taxon is abolished (deleted) from the MSL";
      case ReleaseAction.current:
         return "This is the latest MSL release";
      case ReleaseAction.demoted:
         return "A higher rank taxon was moved to a lower rank";
      case ReleaseAction.lineageUpdated:
         return "One or more higher rank taxa have been updated";
      case ReleaseAction.merged:
         return "Two or more separate taxa were merged into a single taxon";
      case ReleaseAction.moved:
         return "A lower rank taxon and its constituent members were moved from one higher rank taxon to another taxon";
      case ReleaseAction.new:
         return "A new taxon was created";
      case ReleaseAction.promoted:
         return "A lower rank taxon was moved to a higher rank";
      case ReleaseAction.renamed: 
      return "The taxon was renamed";
      case ReleaseAction.split:
         return "The taxon, along with its constituent members, were split into two or more taxa";
      case ReleaseAction.unchanged:
         return "The taxon has not been changed in this release";
      default:
         return releaseAction_;
   }
}

// Return the value of the taxonomy rank enum.
export function LookupTaxonomyRank(rank_: TaxonomyRank|string) {
   
   if (!rank_) { return ""; }

   // If the rank parameter isn't a valid member of the TaxonomyRank enum, just return it as is. 
   // This allows us to display ranks that aren't in the enum without causing an error. It also 
   // allows us to avoid having to update the enum every time we encounter a new rank in the data.
   if (!IsEnumValue(TaxonomyRank, rank_)) { return rank_; }

   switch (rank_) {
      case TaxonomyRank.biotype:
         return "Biotype";
      case TaxonomyRank.clade:
         return "Clade";
      case TaxonomyRank.class:
         return "Class";
      case TaxonomyRank.cohort:
         return "Cohort";
      case TaxonomyRank.family:
         return "Family";
      case TaxonomyRank.forma:
         return "Forma";
      case TaxonomyRank.forma_specialis:
         return "Forma Specialis";
      case TaxonomyRank.genotype:
         return "Genotype";
      case TaxonomyRank.genus:
         return "Genus";
      case TaxonomyRank.infraclass:
         return "Infraclass";
      case TaxonomyRank.infraorder:
         return "Infraorder";
      case TaxonomyRank.isolate:
         return "Isolate";
      case TaxonomyRank.kingdom:
         return "Kingdom";
      case TaxonomyRank.morph:
         return "Morph";
      case TaxonomyRank.no_rank:
         return "No rank";
      case TaxonomyRank.order:
         return "Order";
      case TaxonomyRank.parvorder:
         return "Parvorder";
      case TaxonomyRank.pathogroup:
         return "Pathogroup";
      case TaxonomyRank.phylum:
         return "Phylum";
      case TaxonomyRank.realm:
         return "Realm";
      case TaxonomyRank.section:
         return "Section";
      case TaxonomyRank.series:
         return "Series";
      case TaxonomyRank.serogroup:
         return "Serogroup";
      case TaxonomyRank.serotype:
         return "Serotype";
      case TaxonomyRank.species:
         return "Species";
      case TaxonomyRank.species_group:
         return "Species group";
      case TaxonomyRank.species_subgroup:
         return "Species subgroup";
      case TaxonomyRank.strain:
         return "Strain";
      case TaxonomyRank.subclass:
         return "Subclass";
      case TaxonomyRank.subcohort:
         return "Subcohort";
      case TaxonomyRank.subfamily:
         return "Subfamily";
      case TaxonomyRank.subgenus:
         return "Subgenus";
      case TaxonomyRank.subkingdom:
         return "Subkingdom";
      case TaxonomyRank.suborder:
         return "Suborder";
      case TaxonomyRank.subphylum:
         return "Subphylum";
      case TaxonomyRank.subrealm:
         return "Subrealm";
      case TaxonomyRank.subsection:
         return "Subsection";
      case TaxonomyRank.subspecies:
         return "Subspecies";
      case TaxonomyRank.subtribe:
         return "Subtribe";
      case TaxonomyRank.superclass:
         return "Superclass";
      case TaxonomyRank.superfamily:
         return "Superfamily";
      case TaxonomyRank.superkingdom:
         return "Superkingdom";
      case TaxonomyRank.superorder:
         return "Superorder";
      case TaxonomyRank.superphylum:
         return "Superphylum";
      case TaxonomyRank.tribe:
         return "Tribe";
      case TaxonomyRank.varietas:
         return "Varietas";
      default:
         return (rank_ as string).replace(/_/g, " ").toLowerCase();
   }
}


//----------------------------------------------------------------------------------------------------------------
// Interfaces
//----------------------------------------------------------------------------------------------------------------

// After evaluating a FASTA sequence, we determine the most-likely sequence type by counting standard nucleotide 
// and amino acid bases and return this object as the result.
export interface ISequenceMetadata {
   aaFraction: number;
   ntFraction: number;
   type: SequenceType;
   confidence: number;
   counts: {
      aaAmbiguity: number;
      aaStandard: number;
      ntAmbiguity: number;
      ntStandard: number;
      total: number;
   }
   // TESTING
   //aaCount: number;
   //ntCount: number;
   //totalCount: number;
}


//----------------------------------------------------------------------------------------------------------------
// Objects
//----------------------------------------------------------------------------------------------------------------

// Nucleotide codes used in FASTA.
export const NucleotideCodes = new Set([
   "A", "C", "G", "T", "U"
]);

// Nucleotide ambiguity codes used in FASTA.
export const NucleotideAmbiguityCodes = new Set([
   "B", "D", "H", "K", "M", 
   "N", "R", "S", "V", "W", 
   "X", "Y", "-"
]);

// Standard amino acid codes used in FASTA.
export const ProteinCodes = new Set([
   "A", "C", "D", "E", 
   "F", "G", "H", "I",
   "K", "L", "M", "N", 
   "P", "Q", "R", "S", 
   "T", "V", "W", "Y"
]);

// Amino acid ambiguity codes used in FASTA.
export const ProteinAmbiguityCodes = new Set([
   "B", "J", "O", "U", 
   "X", "Z", "*"
]);

// Codes that aren't used in nucleotide sequences and therefore indicate that a FASTA sequence 
// is likely a protein sequence.
export const ProteinOnlyCodes = new Set([
   "E", "F", "I", "J", "L", 
   "O", "P", "Q", "Z", "*"
]);