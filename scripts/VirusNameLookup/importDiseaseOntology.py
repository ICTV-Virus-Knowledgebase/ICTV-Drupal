
import argparse
from dbSettings import DbSettings
import mariadb
import pandas as pd
from common import safeTrim 
import sys


# Define the columns in the CSV file (in order).
columns = [ 
   "iri",
   "id",
   "label",
   "definition",
   "ncbitaxon_id",
   "ncbitaxon_label"
]


# Import the contents of the CSV file into the database.
def importFromCSV(dbSettings_: DbSettings, filename_: str):

   try:
      # Create a database connection.
      dbConnection = mariadb.connect(
         autocommit = True,
         database = dbSettings_.dbName,
         host = dbSettings_.hostname,
         port = dbSettings_.port,
         user = dbSettings_.username,
         password = dbSettings_.password)
      
      if not dbConnection:
         raise Exception("The database connection is invalid")
      
      # Create a cursor
      with dbConnection.cursor() as cursor:

         # Clear the table.
         cursor.execute("DELETE FROM disease_ontology; ")

         # Read the contents of the CSV file.
         df = pd.read_csv(filename_, header=0, index_col=False, names=columns, encoding="latin-1", keep_default_na=False)

         # Iterate over every row.
         for row in df.itertuples(index=False):

            # Note: The iri column is not used.
            
            id = safeTrim(row.id)
            if id in (None, ''):
               raise Exception("ID is invalid")
            
            # Remove the DOID: prefix.
            #id = id.replace("DOID:", "")
            
            label = safeTrim(row.label)
            if label in (None, ''):
               raise Exception("Label is invalid")
            
            definition = safeTrim(row.definition)
            if len(definition) < 1:
               definition = None
            
            ncbiTaxonID = None
            strNcbiTaxonID = row.ncbitaxon_id
            if strNcbiTaxonID not in (None, ""):
               strNcbiTaxonID = strNcbiTaxonID.replace("NCBITaxon:", "")
               ncbiTaxonID = int(strNcbiTaxonID)

            ncbiLabel = row.ncbitaxon_label
            if len(ncbiLabel) < 1:
               ncbiLabel = None

            # Define the values to insert.
            values = [definition, id, label, ncbiLabel, ncbiTaxonID]

            # Create the INSERT query and execute it.
            query = "INSERT INTO disease_ontology (definition, doid, disease_name, ncbi_name, ncbi_taxid) VALUES (%s, %s, %s, %s, %s) "
            cursor.execute(query, values)
            

   except mariadb.Error as e:
      print(e)
      sys.exit(1)

   finally:
      if dbConnection:
         dbConnection.close()



if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import the contents of a disease ontology CSV file into the database")

   parser.add_argument("--dbName", dest="dbName", metavar='DB_NAME', nargs=1, required=True, help="The database name")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=True, help="The CSV input filename")
   parser.add_argument("--hostname", dest="hostname", metavar='HOSTNAME', nargs=1, required=True, help="The database hostname")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', nargs=1, required=True, help="The database password")
   parser.add_argument("--port", dest="port", metavar='PORT', nargs=1, required=True, help="The database port")
   parser.add_argument("--username", dest="username", metavar='USERNAME', nargs=1, required=True, help="The database username")

   args = parser.parse_args()

   # Validate the command-line arguments.
   dbName = safeTrim(args.dbName[0])
   if dbName in (None, ""):
      raise Exception("The dbName parameter is required")
   
   filename = safeTrim(args.filename[0])
   if len(filename) < 1:
      raise Exception("Invalid filename parameter")
   elif not filename.endswith(".csv"):
      raise Exception("The filename must end in .csv")

   hostname = safeTrim(args.hostname[0])
   if hostname in (None, ""):
      raise Exception("The hostname parameter is required")
   
   password = safeTrim(args.password[0])
   if password in (None, ""):
      raise Exception("The password parameter is required")
   
   strPort = safeTrim(args.port[0])
   if strPort in (None, ""):
      raise Exception("The port parameter is required")
   port = int(strPort)
   if port < 1:
      raise Exception("The port number is invalid")
   
   username = safeTrim(args.username[0])
   if username in (None, ""):
      raise Exception("The username parameter is required")


   # Create a DbSettings object.
   settings = DbSettings(dbName, hostname, password, port, username)

   # Process the input file.
   importFromCSV(settings, filename)


   # TODO: We could also run the stored procedures "InitializeDiseaseOntology" and "ImportDiseaseOntologyIntoSearchableTaxon" here.




