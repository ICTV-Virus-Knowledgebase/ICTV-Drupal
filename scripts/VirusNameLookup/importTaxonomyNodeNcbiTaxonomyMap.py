
import argparse
from common import safeTrim
import glob
from terms import NameClass, TaxonomyDB, TaxonomyRank
import pandas as pd
from taxonName import TaxonName

# The name of the MariaDB database with the table "taxon_name".
databaseName = "virus_name_lookup"

columns = [
   "ictv_rank",
   "latest_msl",
   "latest_taxnode_id",
   "name",
   "ncbi_division",
   "ncbi_name_class",
   "ncbi_rank",
   "ncbi_tax_id"
]



def process(filename: str):


   # Read the contents of the TSV file.
   df = pd.read_csv(filename, header=0, sep="\t", index_col=False, names=columns, encoding="latin-1", keep_default_na=False)

   # Iterate over every row.
   for row in df.itertuples(index=False):
      try:

         ictvRank = safeTrim(row.ictv_rank)
         if ictvRank in (None, ''):
            raise Exception("Invalid ICTV rank")
         
         latestMSL = row.latest_msl
         if latestMSL != latestMSL:
            raise Exception("Invalid latest MSL")
         
         latestTaxnodeID = row.latest_taxnode_id
         if latestTaxnodeID != latestTaxnodeID:
            raise Exception("Invalid latest taxnode ID")
         
         name = safeTrim(row.name)
         if name in (None, ''):
            raise Exception("Invalid name")
         
         ncbiDivision = safeTrim(row.ncbi_division)
         if ncbiDivision in (None, ''):
            raise Exception("Invalid NCBI division")
         
         

         


      except Exception as e:
         print(f"The following error occurred: {e}")


if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import taxonomy_node NCBI Taxonomy map data from a TSV file and create records in MariaDB.")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=True, help="The TSV filename")
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

   if filename in (None, ""):
      raise Exception("The filename parameter is required")
   




   

   



