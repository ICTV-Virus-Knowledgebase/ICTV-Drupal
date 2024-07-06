
from common import NameClass, safeTrim, TaxonomyDB
import contextlib
from databaseAuth import DatabaseAuth
import mariadb
import sys





def importTaxonName(dbName: str, name: str, nameClass: NameClass, parentTaxonomyDB: TaxonomyDB, parentTaxonomyID: int, 
                    rankName: str, taxonomyDB: TaxonomyDB, taxonomyID: int, versionID: int):

   # Validate the database name.
   if not dbName:
      raise Exception("Invalid database name parameter")
   
   # Name
   name = safeTrim(name)
   if name in (None, ''):
      raise Exception("Invalid name parameter")
   else:
      name = f"'{name}'"

   # Name class
   if not nameClass:
      raise Exception("Invalid name class parameter")
   else:
      nameClass = f"'{nameClass.name}'"
   
   # Parent taxonomy DB
   if not parentTaxonomyDB:
      parentTaxonomyDB = "NULL"
   else:
      parentTaxonomyDB = f"'{parentTaxonomyDB.name}'"

   # Parent taxonomy ID
   if not parentTaxonomyID:
      parentTaxonomyID = "NULL"
   else:
      parentTaxonomyID = str(parentTaxonomyID)
   
   # Rank name
   rankName = safeTrim(rankName)
   if rankName in (None, ''):
      raise Exception("Invalid rank name parameter")
   else:
      rankName = f"'{rankName}'"

   # Taxonomy DB
   if not taxonomyDB:
      raise Exception("Invalid taxonomyDB parameter")
   else:
      taxonomyDB = f"'{taxonomyDB.name}'"

   # TODO: validate these as integers?
   # taxonomyID
   # versionID

   sql = f"CALL importTaxonName({name}, {nameClass}, {parentTaxonomyDB}, {parentTaxonomyID}, {rankName}, {taxonomyDB}, {taxonomyID}, {versionID})"
   """   f"{name}, "
      f"{nameClass}, "
      f"{parentTaxonomyDB}, "
      f"{parentTaxonomyID}, "
      f"{rankName}, "
      f"{taxonomyDB}, "
      f"{taxonomyID}, "
      f"{versionID}"
      ")") """

   print(sql)

   # Open the database connection
   #with contextlib.closing(pyodbc.connect(dbConnectionString)) as dbConnection:

   # Instantiate Connection
   try:
      conn = mariadb.connect(
         database = dbName,
         host = DatabaseAuth.host,
         port = DatabaseAuth.port,
         user = DatabaseAuth.user,
         password = DatabaseAuth.password)
      
   except mariadb.Error as e:
      print(f"Error connecting to the database: {e}")
      sys.exit(1)

   # Instantiate Cursor
   cursor = conn.cursor()

   # Call the stored procedure
   result = cursor.execute(sql)

   print(result)
   
   # Close Connection
   conn.close()



if __name__ == '__main__':

   
   importTaxonName("virus_name_lookup", "test on 070624", NameClass.blast_name, None, None, "family", TaxonomyDB.ictv_vmr, 23456, 39)
   