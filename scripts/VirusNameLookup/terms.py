
from enum import Enum


#--------------------------------------------------------------------------------
# NCBI (and custom) name classes
#--------------------------------------------------------------------------------
class NameClass(Enum):
   abbreviation = "abbreviation"
   acronym = "acronym"
   blast_name = "blast_name"
   common_name = "common_name"
   equivalent_name = "equivalent_name"
   genbank_accession = "genbank_accession"
   genbank_acronym = "genbank_acronym"
   genbank_common_name = "genbank_common_name"
   isolate_abbreviation = "isolate_abbreviation"
   isolate_designation = "isolate_designation"
   isolate_exemplar = "isolate_exemplar"
   isolate_name = "isolate_name"
   refseq_accession = "refseq_accession"
   refseq_organism = "refseq_organism"
   scientific_name = "scientific_name"
   synonym = "synonym"

   # Does NameClass contain this key?
   @classmethod
   def hasKey(cls, key):
      return key in cls.__members__


#--------------------------------------------------------------------------------
# Taxonomy ranks
#--------------------------------------------------------------------------------
class TaxonomyRank(Enum):
   biotype = "biotype",
   clade = "clade",
   _class = "class",
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

   # Does TaxonomyRank contain this key?
   @classmethod
   def hasKey(cls, key):
      key = key.replace(" ", "_")
      if key == "class":
         key = "_class"
      return key in cls.__members__


#--------------------------------------------------------------------------------
# Taxonomy database names
#--------------------------------------------------------------------------------
class TaxonomyDB(Enum):
   ictv_taxonomy = "ictv_taxonomy"
   ictv_vmr = "ictv_vmr"
   ncbi_taxonomy = "ncbi_taxonomy"

   # Does TaxonomyDB contain this key?
   @classmethod
   def hasKey(cls, key):
      return key in cls.__members__

