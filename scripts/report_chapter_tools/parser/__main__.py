#!/usr/bin/env python

import argparse
from datetime import datetime
from .db_settings import DbSettings
from getpass import getpass
import json
from .parser import ReportChapterParser
from ..models.search_result import SearchResult
import sys
from ..utils import Utils


def main(argv=None) -> list[SearchResult]|None:

   parser = argparse.ArgumentParser(description="Parse Report Chapter HTML in the Drupal database.")  
   parser.add_argument("--db_name", dest="db_name", metavar='DB_NAME', required=True, help="The database name")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', required=False, help="The database password. If this isn't provided here, the user will be prompted for it.")
   parser.add_argument("--taxon_name", dest="taxon_name", metavar='TAXON_NAME', required=False, help="A taxon name. If no taxon name is provided, all taxa will be included in the results.")
   parser.add_argument("--username", dest="username", metavar='USERNAME', required=True, help="The database username")
   parser.add_argument("--hostname", dest="hostname", default="localhost", metavar='HOSTNAME', required=False, help="The database hostname")
   parser.add_argument("--port", type=int, default=3306, dest="port", metavar='PORT', required=False, help="The database port")

   args = parser.parse_args(argv)

   # Validate the command-line arguments.
   db_name = Utils.safe_trim(args.db_name)
   if len(db_name) < 1:
      sys.stderr.write("The db_name parameter is required\n")
      return None

   hostname = Utils.safe_trim(args.hostname)

   # If a password isn't provided as a parameter, the user will be prompted to enter it.
   if args.password is None or len(args.password) < 1:
      password = getpass("\nDatabase password: ")
      if len(password) < 1:
         sys.stderr.write("A password is required\n")
         return None
   else:
      password = args.password

   port = args.port
   if port is None or port < 1:
      port = 3306

   taxon_name = Utils.safe_trim(args.taxon_name)
   
   username = Utils.safe_trim(args.username)
   if len(username) < 1:
      sys.stderr.write("The username parameter is required\n")
      return None

   # Create a DbSettings object.
   db_settings = DbSettings(db_name, password, username, hostname, port, unix_socket = "/run/mysqld/mysqld.sock")

   results = None

   # Create a parser instance.
   parser = ReportChapterParser()

   if len(taxon_name) > 0:
      # Get taxon-specific results
      results = parser.get_taxon_results(db_settings, taxon_name)
   else:
      # Get results for all taxa
      results = parser.get_all_results(db_settings)

   return results



if __name__ == "__main__" :

   results = main()

   if results is None:
      sys.exit(1)
   
   # Write the JSON to stdout.
   json.dump(
      [result.to_dict() for result in results],
      sys.stdout,
      ensure_ascii=False,
      indent=2
   )
   
   sys.exit(0)
