
from dbSettings import DbSettings
import mariadb
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

