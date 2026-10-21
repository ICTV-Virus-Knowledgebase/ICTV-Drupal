
from bs4 import BeautifulSoup
from bs4.element import NavigableString
from datetime import datetime
from ..models.db_settings import DbSettings
import mariadb
import os
import sys


class FileCreator():

   def create_taxa_html_files(self, db_settings: DbSettings, output_path_name: str) -> bool:

      db_connection = None

      timestamp = datetime.now().strftime('%Y%m%d_%H%M')

      sql = """
         SELECT 
		      MAX(n.taxon_name) AS taxon_name,
		      GROUP_CONCAT(n.html ORDER BY n.path_alias SEPARATOR '\n') AS html
	      FROM report_chapter_node n
	      GROUP BY n.taxon_name
	      ORDER BY n.taxon_name, n.path_alias; 
      """

      try:
         # Create a database connection.
         db_connection = mariadb.connect(
            autocommit = True,
            database = db_settings.db_name,
            unix_socket = "/run/mysqld/mysqld.sock",
            user = db_settings.username,
            password = db_settings.password,
            host = db_settings.hostname
            # dmd testing 093026 port = db_settings.port
         )
         
         if not db_connection:
            raise Exception("The database connection is invalid\n")
         
         with db_connection.cursor() as cursor:

            cursor.execute(sql)

            for taxon_name, html in cursor:

               # Find all img tags and replace them with their alt text.
               soup = BeautifulSoup(html, "html.parser")
               for img in soup.find_all("img"):
                  alt_text = img.get("alt", "(unknown)")

                  print(f"str(alt_text) = {str(alt_text)}")
                  print(f"NavigableString(str(alt_text)) = {NavigableString(str(alt_text))}")

                  img.replace_with(f"[Image of {NavigableString(str(alt_text))} was removed] ")

               filtered_html = str(soup)

               # Trim the taxon name and capitalize the first letter.
               taxon_name = str(taxon_name).strip().capitalize()

               page_html = f"""
                  <html lang="en" dir="ltr">
                  <head></head>
                  <body>
                     <h1><i>{taxon_name}</i></h1>
                     {filtered_html}
                  </body>
                  </html>
               """

               filename = f"{taxon_name}_{timestamp}.html"
               full_path = f"{output_path_name}{os.sep}{filename}"

               try:
                  with open(full_path, 'x') as f:
                     f.write(page_html)

               except FileExistsError:
                  sys.stderr.write(f"File {filename} already exists\n")

      except mariadb.Error as e:
         sys.stderr.write(f"{str(e)}\n")
         return False
      except Exception as exc:
         sys.stderr.write(f"{str(exc)}\n")
         return False
      finally:
         if db_connection:
            db_connection.close()

      return True
      