
import argparse
from common import safeTrim
from terms import NameClass, TaxonomyDB, TaxonomyRank
import pandas as pd
from taxonName import TaxonName

# The name of the MariaDB database with the table "taxon_name".
databaseName = "virus_name_lookup"

# https://mariadb.com/docs/server/connect/programming-languages/python/connect/
# https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html


csvColumns = [ 
   "taxnode_id",
   "abbrev_csv",
   "cleaned_name",
   "exemplar_name",
   "genbank_accession_csv",
   "isolate_csv",
   "msl_release_num",
   "name",
   "rank_name",
   "refseq_accession_csv"
]


#--------------------------------------------------------------------------------
# Load the CSV file and import the contents into the taxon_name DB table.
#--------------------------------------------------------------------------------
def importTaxonomyNodes(filename_: str, taxonName_: TaxonName):

   # Read the contents of the CSV file.
   df = pd.read_csv(filename_, header=0, index_col=False, names=csvColumns, encoding="latin-1", keep_default_na=False)
   # TODO: validate!

   # Iterate over every row.
   for row in df.itertuples(index=False):
      
      # MSL release number, rank name, and taxnode ID will be used in every import below.
      mslReleaseNum = row.msl_release_num
      if mslReleaseNum in (None, ''):
         print(f"mslReleaseNum={mslReleaseNum}.")
         raise Exception("MSL release number is invalid")
      
      rankName = safeTrim(row.rank_name)
      if rankName in (None, '') or len(rankName) < 1 or not TaxonomyRank.hasKey(rankName):
         raise Exception("Rank name is invalid")
      
      taxNodeID = row.taxnode_id
      if taxNodeID in (None, ''):
         raise Exception("Taxnode ID is invalid")
      

      # The following columns can result in one or more taxon names.

      name = row.name
      if name in (None, ''):
         raise Exception("Name is invalid")
      trimmedName = name.strip()
      if len(trimmedName) < 1:
         raise Exception("Invalid name")
      taxonName_.importTaxonName(trimmedName, NameClass.scientific_name.name, None, None, rankName, 
                                    TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
      
      abbrevCSVs = row.abbrev_csv
      if abbrevCSVs not in (None, '') and len(abbrevCSVs.strip()) > 0:

         # Replace commas with semicolons
         abbrevCSVs = abbrevCSVs.replace(",", ";")

         # Iterate over all abbreviation tokens
         for abbrevCSV in abbrevCSVs.split(";"):
            trimmedName = abbrevCSV.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(trimmedName, NameClass.abbreviation.name, None, None, rankName, 
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)

      cleanedName = row.cleaned_name
      if cleanedName in (None, '') or len(cleanedName.strip()) < 1:
         raise Exception("CleanedName is invalid")
      # TODO: Do we need to use this?
      
      exemplarName = row.exemplar_name
      if exemplarName not in (None, ''):
         trimmedName = exemplarName.strip()
         if len(trimmedName) > 0:
            taxonName_.importTaxonName(trimmedName, NameClass.isolate_exemplar.name, None, None, rankName, 
                                       TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
      
      genbankAccessions = row.genbank_accession_csv
      if genbankAccessions not in (None, ''):

         # Replace commas with semicolons
         genbankAccessions = genbankAccessions.replace(",", ";")

         # Iterate over all GenBank accession tokens
         for genbankAccession in genbankAccessions.split(";"):
            trimmedName = genbankAccession.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(trimmedName, NameClass.genbank_accession.name, None, None, rankName, 
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
               
      isolateNames = row.isolate_csv
      if isolateNames not in (None, ''):

         # Replace commas with semicolons
         isolateNames = isolateNames.replace(",", ";")

         # Iterate over all isolate names
         for isolateName in isolateNames.split(";"):
            trimmedName = isolateName.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(trimmedName, NameClass.isolate_name.name, None, None, rankName, 
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)

      refseqAccessions = row.refseq_accession_csv
      if refseqAccessions not in (None, '') and len(refseqAccessions.strip()) > 0:

         # Replace commas with semicolons
         refseqAccessions = refseqAccessions.replace(",", ";")

         # Iterate over all RefSeq accession tokens
         for refseqAccession in refseqAccessions.split(";"):
            trimmedName = refseqAccession.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(trimmedName, NameClass.refseq_accession.name, None, None, rankName, 
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)





# Example: py ./importTaxonomyNodes.py --filename data/taxonomyNodesTest.csv --dbName virus_name_lookup --host localhost --username drupal_user --password TODO --port 3306

if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import taxonomy_node data from a CSV file and create records in MariaDB.")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=True, help="The CSV filename")
   parser.add_argument("--dbName", dest="dbName", metavar='DB_NAME', nargs=1, required=True, help="The database name")
   parser.add_argument("--host", dest="host", metavar='HOST', nargs=1, required=True, help="The database hostname")
   parser.add_argument("--username", dest="username", metavar='USERNAME', nargs=1, required=True, help="The database username")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', nargs=1, required=True, help="The database password")
   parser.add_argument("--port", default="3306", dest="port", metavar='PORT', nargs=1, required=False, help="The database port")

   args = parser.parse_args()

   dbName = args.dbName[0]
   filename = args.filename[0]
   host = args.host[0]
   password = args.password[0]
   port = int(args.port[0])
   username = args.username[0]

   # Create a taxon name instance using the database parameters.
   taxonName = TaxonName(dbName, host, username, password, port)

   # Load the CSV file and import the contents into the taxon_name DB table.
   importTaxonomyNodes(filename, taxonName)


   