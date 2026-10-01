"""Command-line entry point: python -m report_chapter_tools.consumer."""

import argparse
from getpass import getpass
import mariadb
import sys

from .consumer import import_results, read_results, validate_results


def main(argv=None):
   parser = argparse.ArgumentParser(description="Import report_chapter_tools.parser JSON into MariaDB.")
   parser.add_argument("filename", help="Input JSON file")
   parser.add_argument("--db_name", help="Target database (required unless --dry-run)")
   parser.add_argument("--username", help="Database user (required unless --dry-run)")
   parser.add_argument("--password", help="Database password; prompts when omitted")
   parser.add_argument("--hostname", default="localhost", help="Database hostname (default: localhost)")
   parser.add_argument("--port", type=int, default=3306, help="Database port (default: 3306)")
   parser.add_argument("--unix_socket", help="Unix socket path, e.g. /run/mysqld/mysqld.sock")
   parser.add_argument("--dry-run", action="store_true", help="Validate JSON and show counts without connecting")
   args = parser.parse_args(argv)
   if not args.dry_run and (not args.db_name or not args.username):
      parser.error("--db_name and --username are required unless --dry-run is used")

   try:
      results = read_results(args.filename)
      if args.dry_run:
         nodes, sections = validate_results(results)
         print(f"Validated {nodes} nodes and {sections} sections; no database changes.")
         return 0
      
      options = dict(
         database=args.db_name,
         user=args.username,
         password=args.password if args.password is not None else getpass("Database password: "),
         host=args.hostname,
         port=args.port,
         autocommit=False,
      )

      if args.unix_socket:
         options["unix_socket"] = args.unix_socket

      connection = mariadb.connect(**options)

      try:
         # Match the target columns and preserve non-ASCII HTML and headings.
         with connection.cursor() as cursor:
            cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci")

         nodes, sections = import_results(connection, results)
      finally:
         connection.close()

      print(f"Imported {nodes} nodes and {sections} sections.\n")
      return 0
   
   except (OSError, ValueError, ImportError) as error:
      sys.stderr.write(f"Import failed: {str(error)}\n")
      return 1

   except mariadb.Error as error:
      sys.stderr.write(f"Database import failed: {str(error)}\n")
      return 1

   except Exception as e:
      sys.stderr.write(f"Error: {str(e)}\n")


if __name__ == "__main__":
   sys.exit(main())
