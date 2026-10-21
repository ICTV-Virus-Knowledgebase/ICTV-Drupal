#!/usr/bin/env python

import argparse
from ..models.db_settings import DbSettings
from .file_creator import FileCreator
from getpass import getpass
from pathlib import Path
import sys
from ..utils import Utils




def main(argv=None) -> bool:

   parser = argparse.ArgumentParser(description="Export HTML from the report chapters, group by taxon, and save as HTML files.")  
   parser.add_argument("--db_name", dest="db_name", metavar='DB_NAME', required=True, help="The database name")
   parser.add_argument("--output_path_name", dest="output_path_name", metavar='output_path_name', required=True, help="The path of the output directory for the HTML files")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', required=False, help="The database password. If this isn't provided here, the user will be prompted for it.")
   # parser.add_argument("--taxon_name", dest="taxon_name", metavar='TAXON_NAME', required=False, help="A taxon name. If no taxon name is provided, all taxa will be included in the results.")
   parser.add_argument("--username", dest="username", metavar='USERNAME', required=True, help="The database username")
   parser.add_argument("--hostname", dest="hostname", default="localhost", metavar='HOSTNAME', required=False, help="The database hostname")
   parser.add_argument("--port", type=int, default=3306, dest="port", metavar='PORT', required=False, help="The database port")
   

   args = parser.parse_args(argv)

   # Validate the command-line arguments.
   db_name = Utils.safe_trim(args.db_name)
   if len(db_name) < 1:
      sys.stderr.write("The db_name parameter is required\n")
      return False

   output_path_name = Utils.safe_trim(args.output_path_name)
   if len(output_path_name) < 1:
      sys.stderr.write("The output_path_name parameter is required\n")
      return False
   
   hostname = Utils.safe_trim(args.hostname)

   # If a password isn't provided as a parameter, the user will be prompted to enter it.
   if args.password is None or len(args.password) < 1:
      password = getpass("\nDatabase password: ")
      if len(password) < 1:
         sys.stderr.write("A password is required\n")
         return False
   else:
      password = args.password

   port = args.port
   if port is None or port < 1:
      port = 3306

   username = Utils.safe_trim(args.username)
   if len(username) < 1:
      sys.stderr.write("The username parameter is required\n")
      return False

   # Create a DbSettings object.
   db_settings = DbSettings(db_name, password, username, hostname, port, unix_socket = "/run/mysqld/mysqld.sock")

   try:
      output_path = Path(output_path_name)
      if not output_path.exists():
         Path(output_path).mkdir()

      # Create a file creator instance.
      creator = FileCreator()
      result = creator.create_taxa_html_files(db_settings, output_path_name)
      if not result:
         raise Exception("An error occurred generating HTML files\n")
   
   except Exception as e:
      sys.stderr.write(f"{str(e)}\n")
      return False

   return True


if __name__ == "__main__" :

   results = main()

   if results is None:
      sys.exit(1)
   sys.exit(0)
