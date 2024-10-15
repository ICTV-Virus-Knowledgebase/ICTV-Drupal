
from common import formatForSQL, safeTrim
import mariadb
import sys
from terms import NameClass, TaxonomyDB, TaxonomyRank


#--------------------------------------------------------------------------------------------------------
# An object with functionality relevant to the taxon_name database table.
#--------------------------------------------------------------------------------------------------------
class TaxonName:

   # The database name, hostname, password, port, and username.
   dbName: str
   hostname: str
   password: str
   port: int
   username: str


   #--------------------------------------------------------------------------------------------------------
   # C-tor
   #--------------------------------------------------------------------------------------------------------
   def __init__(self, dbName_: str, hostname_: str, username_: str, password_: str, port_: int):
      self.dbName = dbName_
      self.hostname = hostname_
      self.password = password_
      self.port = port_
      self.username = username_

   #--------------------------------------------------------------------------------------------------------
   # Import data into the taxon_name database table.
   #--------------------------------------------------------------------------------------------------------
   def importTaxonName(self, ictvTaxNodeID: int, name: str, nameClass: str, parentTaxonomyDB: str, parentTaxonomyID: int, 
                       rankName: str, taxonomyDB: str, taxonomyID: int, versionID: int):

      # Validate the database name, username, and password member variables.
      if self.dbName in (None, ""):
         raise Exception("Invalid database name")
      elif self.hostname in (None, ""):
         raise Exception("Invalid database hostname")
      elif self.password in (None, ""):
         raise Exception("Invalid database password")
      elif not self.port:
         raise Exception("Invalid database port")
      elif self.username in (None, ""):
         raise Exception("Invalid database username")
      
      if not isinstance(ictvTaxNodeID, int):
         ictvTaxNodeID = None

      # Name
      name = safeTrim(name)
      if name in (None, ''):
         raise Exception("Invalid name parameter")
      else:
         # Truncate the name at 300 characters.
         name = name[0:299]
         
         name = formatForSQL(name)
      
      # Name class
      if nameClass in (None, ''):
         raise Exception("Invalid name class parameter")
      elif not NameClass.hasKey(nameClass):
         raise Exception("Unrecognized name class parameter")
      
      # Parent taxonomy DB
      if parentTaxonomyDB in (None, '') or not TaxonomyDB.hasKey(parentTaxonomyDB):
         # parentTaxonomyDB = "NULL"
         raise Exception("Invalid parent taxonomy DB")

      # Parent taxonomy ID
      if not isinstance(parentTaxonomyID, int):
         parentTaxonomyID = "NULL"
      
      # Rank name
      rankName = safeTrim(rankName)
      if rankName in (None, '') or not TaxonomyRank.hasKey(rankName):
         raise Exception("Invalid rank name parameter")

      # Taxonomy DB
      if taxonomyDB in (None, '') or not TaxonomyDB.hasKey(taxonomyDB):
         raise Exception("Invalid taxonomyDB parameter")
      
      # Taxonomy ID
      if not isinstance(taxonomyID, int):
         raise Exception("Invalid taxonomy ID")

      # Create SQL that calls the stored procedure.
      sql = f"CALL importTaxonName({ictvTaxNodeID}, '{name}', '{nameClass}', '{parentTaxonomyDB}', {parentTaxonomyID}, '{rankName}', '{taxonomyDB}', {taxonomyID}, {versionID});"

      # TODO: this would be a better approach
      #with contextlib.closing(conn) as dbConnection:
      
      # Create a database connection.
      try:
         dbConnection = mariadb.connect(
            autocommit = True,
            database = self.dbName,
            host = self.hostname,
            port = self.port,
            user = self.username,
            password = self.password)
         
         if not dbConnection:
            raise Exception("The database connection is invalid")
         
         # Create a cursor
         cursor = dbConnection.cursor()

         # Call the stored procedure
         cursor.execute(sql)

      except mariadb.Error as e:
         print(e)
         print(f"SQL: {sql}")
         sys.exit(1)

      finally:
         if dbConnection:
            dbConnection.close()
