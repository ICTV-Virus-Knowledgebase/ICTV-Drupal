
import argparse
from common import safeTrim
import contextlib
from datetime import datetime
import pyodbc
import subprocess

"""
The methods in this class are used to export taxonomy nodes or species isolates from the 
ICTV_DB SQL Server instance as TSV files for import into MariaDB. The name of the output
file is automatically generated and all output files are created in the "output" subdirectory.
"""
class ExportToTSV:

   #-----------------------------------------------------------------------------------
   # Export the contents of species_isolates to a TSV file.
   #-----------------------------------------------------------------------------------
   def exportSpeciesIsolates(self, dbServer_, ictvDB_):

      # Validate parameters
      if dbServer_ in (None, '') or not dbServer_.strip():
         raise Exception("The dbServer parameter is invalid")
      
      if ictvDB_ in (None, '') or not ictvDB_.strip():
         raise Exception("The ictvDB parameter is invalid")
      
      # Create the filename (the commented line incorporates the current time).
      filename = ("output\\speciesIsolates.tsv")
      #filename = (f"output\\speciesIsolates_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tsv")

      # Create the command line text to run sqlcmd.
      cmd = (f"sqlcmd -S {dbServer_} "
            f"-Q \"EXEC [{ictvDB_}].dbo.exportSpeciesIsolatesAsTSV\" "
            f"-o \"{filename}\" "
            "-y 0 ")

      # Run the command
      subprocess.run(cmd, shell=True)


   #-----------------------------------------------------------------------------------
   # Export the contents of taxonomy_node for all MSLs to individual TSV files.
   #-----------------------------------------------------------------------------------
   def exportAllTaxonomyNodes(self, dbServer_, ictvDB_):

      # The database connection string
      dbConnectionString = ("Driver={SQL Server Native Client 11.0};"
         f"Server={dbServer_};"
         f"Database={ictvDB_};"
         "Trusted_Connection=yes;")

      sql = """SELECT TOP 1 msl_release_num 
               FROM taxonomy_toc 
               WHERE msl_release_num IS NOT NULL 
               ORDER BY msl_release_num DESC"""
      
      # Open the database connection
      with contextlib.closing(pyodbc.connect(dbConnectionString)) as dbConnection:

         cursor = dbConnection.cursor()

         # Get the maximum MSL release number in this ICTV database.
         maxMSL = cursor.execute(sql).fetchval()
         if maxMSL == None:
            raise Exception("Unable to find a maximum MSL release number")
         
         # Iterate over all MSLs from 1 to the maximum value.
         for msl in range(1, maxMSL + 1):

            # Export taxonomy nodes with this MSL.
            self.exportTaxonomyNode(dbServer_, ictvDB_, msl)


   #-----------------------------------------------------------------------------------
   # Export the latest version of each unique name in taxonomy_node to a TSV file.
   #-----------------------------------------------------------------------------------
   def exportLatestTaxonomyNodes(self,dbServer_, ictvDB_):

      # Validate parameters
      if dbServer_ in (None, ''):
         raise Exception("The dbServer parameter is invalid")
      
      if ictvDB_ in (None, ''):
         raise Exception("The ictvDB parameter is invalid")
      
      # Create the filename
      filename = (f"output\\taxonomyNodes.tsv")

      # Create the command line text to run sqlcmd.
      cmd = (f"sqlcmd -S {dbServer_} "
            f"-Q \"EXEC [{ictvDB_}].dbo.exportLatestTaxonomyNodesAsTSV \" "
            f"-o \"{filename}\" "
            "-y 0 ")

      # Run the command
      subprocess.run(cmd, shell=True)


   #-----------------------------------------------------------------------------------
   # Export the contents of taxonomy_node to a TSV file.
   #-----------------------------------------------------------------------------------
   def exportTaxonomyNode(self, dbServer_, ictvDB_, mslRelease_):

      # Validate parameters
      if dbServer_ in (None, ''):
         raise Exception("The dbServer parameter is invalid")
      
      if ictvDB_ in (None, ''):
         raise Exception("The ictvDB parameter is invalid")
      
      mslRelease = "NULL"
      if mslRelease_ not in (None, '') and isinstance(mslRelease_, int) and mslRelease_ == mslRelease_:
         mslRelease = str(mslRelease_)
      
      # Create the filename (the commented line incorporates the current time).
      filename = (f"output\\taxonomyNodes_msl{mslRelease_}.tsv")
      #filename = (f"output\\taxonomyNodes_msl{mslRelease_}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tsv")

      # Create the command line text to run sqlcmd.
      cmd = (f"sqlcmd -S {dbServer_} "
            f"-Q \"EXEC [{ictvDB_}].dbo.exportTaxonomyNodesAsTSV @mslRelease = {mslRelease} \" "
            f"-o \"{filename}\" "
            "-y 0 ")

      # Run the command
      subprocess.run(cmd, shell=True)


"""Examples:

Export all species_isolates: 
py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "species_isolates"

Export all taxonomy_node records: 
py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "all_taxonomy_nodes"

Export the latest version of each unique name in taxonomy_node
py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "latest_taxonomy_nodes"

Export taxonomy_node records for a single MSL: 
py exportToTSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "taxonomy_node" --msl 39

"""
if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Export the contents of an ICTV table to a TSV file.")
   parser.add_argument("--dbServer", dest="dbServer", metavar='SERVER_NAME', nargs=1, required=True, help="The database server name")
   parser.add_argument("--ictvDB", dest="ictvDB", metavar='ICTV_DB', nargs=1, required=True, help="The database name")
   parser.add_argument("--table", dest="table", metavar='TABLE', nargs=1, required=True, help="The table to export")
   parser.add_argument("--msl", default="", dest="msl", metavar='MSL', nargs=1, required=False, help="An (optional) MSL release number")
   
   args = parser.parse_args()

   dbServer = safeTrim(args.dbServer[0])
   if len(dbServer) < 1:
      raise Exception("Invalid dbServer parameter")

   ictvDB = safeTrim(args.ictvDB[0])
   if len(ictvDB) < 1:
      raise Exception("Invalid ictvDB parameter")
   
   if args.msl not in (None, ''):
      msl = safeTrim(args.msl[0])
   else:
      msl = ""
   
   table = safeTrim(args.table[0])
   if len(table) < 1:
      raise Exception("Invalid table parameter")

   # Create an instance of the ExportTSV object.
   exportToTSV = ExportToTSV()

   # Export the contents of the specified table to a TSV file.
   match table:
      case "all_taxonomy_nodes":
         exportToTSV.exportAllTaxonomyNodes(dbServer, ictvDB)

      case "latest_taxonomy_nodes":
         exportToTSV.exportLatestTaxonomyNodes(dbServer, ictvDB)

      case "species_isolates":
         exportToTSV.exportSpeciesIsolates(dbServer, ictvDB)

      case "taxonomy_node":
         exportToTSV.exportTaxonomyNode(dbServer, ictvDB, msl)

