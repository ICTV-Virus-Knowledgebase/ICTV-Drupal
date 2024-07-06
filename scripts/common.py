
from enum import Enum


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


class TaxonomyDB(Enum):
   ictv_taxonomy = "ictv_taxonomy"
   ictv_vmr = "ictv_vmr"
   ncbi_taxonomy = "ncbi_taxonomy"




# Useful functions

def safeTrim(text: str):
   if not text:
      return ""
   
   trimmedText = text.strip()
   if len(trimmedText) < 1:
      return ""
   
   return trimmedText

