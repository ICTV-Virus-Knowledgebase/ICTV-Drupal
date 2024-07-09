
import argparse
from common import safeTrim
from datetime import datetime
import subprocess


class ExportToCSV:

   #-----------------------------------------------------------------------------------
   # Export the contents of species_isolates to a CSV file.
   #-----------------------------------------------------------------------------------
   def exportSpeciesIsolates(self, dbServer_, ictvDB_):

      # Validate parameters
      if dbServer_ in (None, '') or not dbServer_.strip():
         raise Exception("The dbServer parameter is invalid")
      
      if ictvDB_ in (None, '') or not ictvDB_.strip():
         raise Exception("The ictvDB parameter is invalid")
      
      # Create a filename using the current time.
      filename = (f"CSV\\speciesIsolates_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")

      # Create the command line text to run sqlcmd.
      cmd = (f"sqlcmd -S {dbServer_} "
            f"-Q \"EXEC [{ictvDB_}].dbo.exportSpeciesIsolatesAsCSV\" "
            f"-o \"{filename}\" "
            "-y 0 ")

      # Run the command
      subprocess.run(cmd, shell=True)


   #-----------------------------------------------------------------------------------
   # Export the contents of taxonomy_node to a CSV file.
   #-----------------------------------------------------------------------------------
   def exportTaxonomyNode(self, dbServer_, ictvDB_, mslRelease_):

      # Validate parameters
      if dbServer_ in (None, ''):
         raise Exception("The dbServer parameter is invalid")
      
      if ictvDB_ in (None, ''):
         raise Exception("The ictvDB parameter is invalid")
      
      mslRelease = "NULL"
      if mslRelease_ not in (None, '') and isinstance(mslRelease_, int):
         mslRelease = str(mslRelease_)
      
      # Create a filename using the current time.
      filename = (f"CSV\\taxonomyNodes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")

      # Create the command line text to run sqlcmd.
      cmd = (f"sqlcmd -S {dbServer_} "
            f"-Q \"EXEC [{ictvDB_}].dbo.exportTaxonomyNodesAsCSV @mslRelease = {mslRelease} \" "
            f"-o \"{filename}\" "
            "-y 0 ")

      # Run the command
      subprocess.run(cmd, shell=True)


# Example usage: py exportToCSV.py --dbServer "ICTVDEV" --ictvDB "ICTVonline39" --table "species_isolates"

if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Export the contents of an ICTV table to a CSV file.")
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
   
   msl = safeTrim(args.msl[0])
   
   table = safeTrim(args.table[0])
   if len(table) < 1:
      raise Exception("Invalid table parameter")

   # Create an instance of the ExportCSV object.
   exportToCSV = ExportToCSV()

   # Export the contents of the specified table to a CSV file.
   match table:
      case "species_isolates":
         exportToCSV.exportSpeciesIsolates(dbServer, ictvDB)

      case "taxonomy_node":
         exportToCSV.exportTaxonomyNode(dbServer, ictvDB, msl)

