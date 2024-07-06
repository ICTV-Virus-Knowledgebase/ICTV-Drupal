
import argparse
from enum import Enum
import mariadb
import pandas as pd
import sys



# https://mariadb.com/docs/server/connect/programming-languages/python/connect/
# https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html

class NameClass(Enum):
   genbank_accession = "name_class.genbank_accession"
   isolate_abbreviation = "name_class.isolate_abbreviation"
   isolate_designation = "name_class.isolate_designation"
   isolate_name = "name_class.isolate_name"
   refseq_accession = "name_class.refseq_accession"
   refseq_organism = "name_class.refseq_organism"

# The header columns in the CSV we import. Note that the order is important!
csvColumns = [ 
   "isolate_id",
   "taxnode_id",
   "species_name",
   "isolate_name",
   "isolate_names",
   "isolate_abbrevs",
   "isolate_designation",
   "genbank_accessions",
   "refseq_accessions",
   "host_source",
   "refseq_organism",
   "msl_release_num"
]


# def importSpeciesIsolate():

   # CALL importSpeciesIsolate ('test;!234', 'isolate_name', 'ictv_taxonomy', 12345, 'family', 'ictv_vmr', 1, 39);


def loadData(filename_):

   
   df = pd.read_csv(filename, header=0, index_col=False, names=csvColumns, encoding="latin-1", keep_default_na=False)
   # TODO: validate!

   # Iterate over every row.
   for row in df.itertuples(index=False):
      
      isolateID = row.isolate_id
      if isolateID in (None, '') or not isinstance(isolateID, int):
         raise Exception("Isolate ID is invalid")
      
      mslReleaseNum = row.msl_release_num
      if mslReleaseNum in (None, ''):
         print(f"mslReleaseNum={mslReleaseNum}.")
         raise Exception("MSL release number is invalid")
      
      taxNodeID = row.taxnode_id
      if taxNodeID in (None, ''):
         raise Exception("Taxnode ID is invalid")
      
      print(f"isolateID = {isolateID}, mslReleaseNum = {mslReleaseNum}, taxNodeID = {taxNodeID}")

      # Don't include row._isolate_name as it's just the first token in row.isolate_names
      # Don't include row.species_name since it will be in taxonomy_node data
      # For now, all values of row.refseq_organism are null

      names = []

      genbankAccessions = row.genbank_accessions
      if genbankAccessions not in (None, '') and len(genbankAccessions.strip()) > 0:
         for genbankAccession in genbankAccessions.split(";"):
            trimmedName = genbankAccession.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.genbank_accession, trimmedName])

      isolateAbbrevs = row.isolate_abbrevs
      if isolateAbbrevs not in (None, '') and len(isolateAbbrevs.strip()) > 0:
         for isolateAbbrev in isolateAbbrevs.split(";"):
            trimmedName = isolateAbbrev.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.isolate_abbreviation, trimmedName])

      isolateDesignations = row.isolate_designation
      if isolateDesignations not in (None, ''):
         for isolateDesignation in isolateDesignations.split(";"):
            trimmedName = isolateDesignation.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.isolate_designation, trimmedName])

      isolateNames = row.isolate_names
      if isolateNames not in (None, '') and len(isolateNames.strip()) > 0:
         for isolateName in isolateNames.split(";"):
            trimmedName = isolateName.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.isolate_name, trimmedName])

      refseqAccessions = row.refseq_accessions
      if refseqAccessions not in (None, '') and len(refseqAccessions.strip()) > 0:
         for refseqAccession in refseqAccessions.split(";"):
            trimmedName = refseqAccession.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.refseq_accession, trimmedName])

      refseqOrganism = row.refseq_organism
      if refseqOrganism not in (None, '') and len(refseqOrganism.strip()) > 0:
         names.append([NameClass.refseq_organism], refseqOrganism)
   
      print(names)



# Example usage: py ImportSpeciesIsolates.py --filename "speciesIsolatesTest.csv"

if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import species_isolate data from a CSV file and create records in MariaDB.")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=True, help="The CSV filename")

   args = parser.parse_args()

   filename = args.filename[0]


   loadData(filename)

   """
   # Instantiate Connection
   try:
      conn = mariadb.connect(
         host="localhost",
         port=3306,
         user="drupal_user",
         password="n0t@F@n0F1T!")
   except mariadb.Error as e:
      print(f"Error connecting to the database: {e}")
      sys.exit(1)

   # Instantiate Cursor
   cur = conn.cursor()

   # Initialize Variables
   terms = []

   # Retrieve terms
   cur.execute("SELECT term_key FROM virus_name_lookup.term")

   for (termKey) in cur:
      terms.append(f"{termKey}>")

   print("\n".join(terms))

   # Close Connection
   conn.close()"""