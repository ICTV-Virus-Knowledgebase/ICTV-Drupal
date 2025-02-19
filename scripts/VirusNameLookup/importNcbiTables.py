
import argparse
from dbSettings import DbSettings
import mariadb
from common import safeTrim
import sys


# Import the text file "division.dmp" into the ncbi_division database table.
def importDivision(dbSettings_: DbSettings, path_: str):

   filePath = f"{path_}/division.dmp"

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
      
         # Open the tab-delimited file
         with open(filePath, "r") as file:
            for line in file:
               values = line.strip().split("\t|\t")
               query = "INSERT INTO ncbi_division (id, cde, name, comments) VALUES (%s, %s, %s, %s)"
               cursor.execute(query, values)

      dbConnection.commit()
      cursor.close()

   except mariadb.Error as e:
      print(e)
      sys.exit(1)

   finally:
      if dbConnection:
         dbConnection.close()



# Import the text file "names.dmp" into the ncbi_name database table.
def importNames(dbSettings_: DbSettings, path_: str):

   filePath = f"{path_}/names.dmp"

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
      
         # Open the tab-delimited file
         with open(filePath, "r") as file:
            for line in file:
               values = line.strip().split("\t|\t")
               query = "INSERT INTO ncbi_name (tax_id, name_txt, unique_name, name_class) VALUES (%s, %s, %s, %s)"
               cursor.execute(query, values)

      dbConnection.commit()
      cursor.close()

   except mariadb.Error as e:
      print(e)
      sys.exit(1)

   finally:
      if dbConnection:
         dbConnection.close()



# Import the text file "nodes.dmp" into the ncbi_node database table.
def importNodes(dbSettings_: DbSettings, path_: str):

   filePath = f"{path_}/nodes.dmp"
   
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
      
         # Open the tab-delimited file
         with open(filePath, "r") as file:
            for line in file:
               values = line.strip().split("\t|\t")
               query = ("INSERT INTO ncbi_node ("
                        "tax_id, "
                        "parent_tax_id, "
                        "rank_name, "
                        "embl_code, "
                        "division_id, "
                        "inherited_div_flag, "
                        "genetic_code_id, "
                        "inherited_gc_flag, "
                        "mitochondrial_genetic_code_id, "
                        "inherited_mgc_flag, "
                        "genbank_hidden_flag, "
                        "hidden_subtree_root_flag, "
                        "comments "
                        ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ")
               cursor.execute(query, values)

      dbConnection.commit()
      cursor.close()

   except mariadb.Error as e:
      print(e)
      sys.exit(1)

   finally:
      if dbConnection:
         dbConnection.close()


if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import data from .dmp files into the NCBI database tables")

   parser.add_argument("--dbName", dest="dbName", metavar='DB_NAME', nargs=1, required=True, help="The database with the NCBI tables")
   parser.add_argument("--hostname", dest="hostname", metavar='HOSTNAME', nargs=1, required=True, help="The database hostname")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', nargs=1, required=True, help="The database password")
   parser.add_argument("--path", dest="path", metavar='PATH', nargs=1, required=True, help="The path of the .dmp files")
   parser.add_argument("--port", dest="port", metavar='PORT', nargs=1, required=True, help="The database port")
   parser.add_argument("--username", dest="username", metavar='USERNAME', nargs=1, required=True, help="The database username")

   args = parser.parse_args()

   # Validate the command-line arguments.
   dbName = safeTrim(args.dbName[0])
   if dbName in (None, ""):
      raise Exception("The dbName parameter is required")
   
   hostname = safeTrim(args.hostname[0])
   if hostname in (None, ""):
      raise Exception("The hostname parameter is required")
   
   password = safeTrim(args.password[0])
   if password in (None, ""):
      raise Exception("The password parameter is required")
   
   path = safeTrim(args.path[0])
   if path in (None, ""):
      raise Exception("The path parameter is required")
   
   port = safeTrim(args.port[0])
   if port in (None, ""):
      raise Exception("The port parameter is required")
   
   username = safeTrim(args.username[0])
   if username in (None, ""):
      raise Exception("The username parameter is required")


   # Create a DbSettings object.
   dbSettings = DbSettings(dbName, hostname, password, port, username)
   
   # TESTING!!!
   # Import the text file "division.dmp" into the ncbi_division database table.
   importDivision(dbSettings, path)

