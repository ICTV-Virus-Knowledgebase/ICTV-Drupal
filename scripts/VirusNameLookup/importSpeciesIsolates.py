
import argparse
from terms import NameClass, TaxonomyDB, TaxonomyRank
import pandas as pd
from taxonName import TaxonName


# The name of the MariaDB database with the table "taxon_name".
databaseName = "virus_name_lookup"

"""
Helpful links:

- Python db connection to MariaDB: https://mariadb.com/docs/server/connect/programming-languages/python/connect/
- Pandas read_csv: https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html

"""


# The header columns in the TSV file. Note that the order is important!
columns = [ 
   "isolate_id",
   "taxnode_id",
   "species_name",
   "isolate_names",
   "isolate_abbrevs",
   "isolate_designation",
   "genbank_accessions",
   "refseq_accessions",
   "host_source",
   "refseq_organism",
   "msl_release_num"
]


#--------------------------------------------------------------------------------
# Load the TSV file and import the contents into the taxon_name DB table.
#--------------------------------------------------------------------------------
def importSpeciesIsolates(filename_: str, taxonName_: TaxonName):

   # Read the contents of the TSV file.
   df = pd.read_csv(filename_, header=0, sep="\t", index_col=False, names=columns, encoding="latin-1", keep_default_na=False)

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
      
      # Don't include row._isolate_name as it's just the first token in row.isolate_names
      # Don't include row.species_name since it will be in taxonomy_node data
      # For now, all values of row.refseq_organism are null

      genbankAccessions = row.genbank_accessions
      if genbankAccessions not in (None, '') and len(genbankAccessions.strip()) > 0:
         for genbankAccession in genbankAccessions.split(";"):
            trimmedName = genbankAccession.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.genbank_accession.name,
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                          TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)

      isolateAbbrevs = row.isolate_abbrevs
      if isolateAbbrevs not in (None, '') and len(isolateAbbrevs.strip()) > 0:
         for isolateAbbrev in isolateAbbrevs.split(";"):
            trimmedName = isolateAbbrev.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.isolate_abbreviation.name,
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                          TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)

      isolateDesignations = row.isolate_designation
      if isolateDesignations not in (None, ''):
         for isolateDesignation in isolateDesignations.split(";"):
            trimmedName = isolateDesignation.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.isolate_designation.name,
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                          TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)

      isolateNames = row.isolate_names
      if isolateNames not in (None, '') and len(isolateNames.strip()) > 0:
         for isolateName in isolateNames.split(";"):
            trimmedName = isolateName.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.isolate_name.name,
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                          TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)

      refseqAccessions = row.refseq_accessions
      if refseqAccessions not in (None, '') and len(refseqAccessions.strip()) > 0:
         for refseqAccession in refseqAccessions.split(";"):
            trimmedName = refseqAccession.strip()
            if len(trimmedName) > 0: 
               taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.refseq_accession.name,
                                          TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                          TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)

      refseqOrganism = row.refseq_organism
      if refseqOrganism not in (None, '') and len(refseqOrganism.strip()) > 0: 
         taxonName_.importTaxonName(taxNodeID, trimmedName, NameClass.refseq_organism.name,
                                    TaxonomyDB.ictv_taxonomy.name, taxNodeID, TaxonomyRank.isolate.name,
                                    TaxonomyDB.ictv_vmr.name, isolateID, mslReleaseNum)


# Example: py ./importSpeciesIsolates.py --filename data/speciesIsolatesTest.tsv --dbName virus_name_lookup --host localhost --username drupal_user --password TODO --port 3306

if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import species_isolate data from a TSV file and create records in MariaDB.")
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

   # Create a taxon name instance using the database parameters.
   taxonName = TaxonName(dbName, host, username, password, port)

   # Load the TSV file and import the contents into the taxon_name DB table.
   importSpeciesIsolates(filename, taxonName)