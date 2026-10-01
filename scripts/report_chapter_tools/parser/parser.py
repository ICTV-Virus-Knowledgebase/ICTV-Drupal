
from bs4 import BeautifulSoup, Comment, Doctype, Tag
from bs4.element import NavigableString
from ..models.chapter_section import ChapterSection
from collections.abc import Callable, Iterable
from .db_settings import DbSettings
from ..models.image import Image
import mariadb
from ..models.search_result import SearchResult
import sys


class ReportChapterParser():

   def __init__(self, ignored_heading_wrappers: Iterable[str] = ("td", "div")) -> None:
      """
      Keep headings inside these ancestor tags as ordinary HTML content.

      Pass an empty list to reject all wrapped headings.
      """
      self.ignored_heading_wrappers = {name.lower() for name in ignored_heading_wrappers}


   def get_all_results(self, db_settings: DbSettings) -> list[SearchResult]|None:
      """
      Create a query that will return SearchResults for report chapter sections
      that aren't a table of contents.
      """
      query_params = [ f"%table of contents%" ]

      # NOTE: to include 9th report include "pa.alias LIKE '/report_9th/%'""

      sql = """
         SELECT 
            n.nid, 
            b.field_mt_srv_body_value AS html,
            pa.alias AS path_alias
   
         FROM node n
         JOIN node__field_mt_srv_body b ON b.entity_id = n.nid
         JOIN path_alias pa ON pa.path = CONCAT('/node/', n.nid)

         /* Only report chapters */
         WHERE pa.alias LIKE '/report/chapter/%'

         /* Not taxa-specific */
         AND pa.alias NOT LIKE '/report/chapter/genome/genome/'
         AND pa.alias NOT LIKE '/report/chapter/information/information/'

         AND b.field_mt_srv_body_value NOT LIKE ?

         ORDER BY pa.alias 
         """

      results = self.get_search_results(db_settings, query_params, sql, self.process_search_result)
      
      return results

      
   def get_search_results(self, db_settings: DbSettings, query_params: list[str], sql: str,
                          process_result: Callable[[SearchResult], None] | None = None) -> list[SearchResult]|None:
      """
      Run SQL using the query parameters provided in order to return a list of SearchResult objects.
      If the process_result function is provided, it will be called on every SearchResult instance
      before it gets added to the list that's returned.
      """

      db_connection = None
      
      results: list[SearchResult] = []

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

            cursor.execute(sql, tuple(query_params))

            for nid, html, path_alias in cursor:

               result = SearchResult(html, nid, path_alias)

               if process_result is not None:
                  process_result(result)

               results.append(result)

      except mariadb.Error as e:
         sys.stderr.write(f"{str(e)}\n")
         sys.exit(1)

      finally:
         if db_connection:
            db_connection.close()
      
      return results
      

   def get_taxon_results(self, db_settings: DbSettings, taxon_name: str) -> list[SearchResult]|None:
      """
      Create a query that will return SearchResults for report chapters whose URL contains 
      this taxon name.
      """
      # NOTE: To limit the query to a single top-level taxon like Poxviridae, the taxon name 
      # parameter should be "/poxviridae/poxviridae". If "/poxviridae" is provided, the results
      # will include the Family and all of its Genera.
      
      query_params = [ f"%{taxon_name}%" ]

      # TODO: to include 9th report: "pa.alias LIKE '/report_9th/%'""

      sql = """
         SELECT 
            n.nid, 
            b.field_mt_srv_body_value AS html,
            pa.alias AS path_alias
   
         FROM node n
         JOIN node__field_mt_srv_body b ON b.entity_id = n.nid
         JOIN path_alias pa ON pa.path = CONCAT('/node/', n.nid)
         WHERE pa.alias LIKE '/report/chapter/%'
         AND pa.alias LIKE ?
         ORDER BY pa.alias
         """

      results = self.get_search_results(db_settings, query_params, sql, self.process_search_result)
      
      return results



   def process_search_result(self, result: SearchResult) -> None:
      """Build sections from h1-h8 headings at the HTML fragment's top level.

      "Introduction" acts as an implicit h2 for content and h3-h8 headings
      before the first real heading. Skipped heading levels are allowed.
      Headings with an ignored wrapper ancestor remain ordinary HTML content.
      Other wrapped headings raise ValueError instead of splitting HTML.
      """
      soup = BeautifulSoup(result.html, 'html.parser')
      heading_tags = tuple(f"h{level}" for level in range(1, 9))

      # Iterate over all heading tags (h1, h2, etc.)
      for heading in soup.find_all(heading_tags):
         if any(ancestor.name in self.ignored_heading_wrappers
               for ancestor in heading.parents if ancestor is not soup):
            continue
         parent = heading.parent
         if parent is None:
            raise ValueError(
               f"Cannot parse {result.path_alias}: <{heading.name}> heading has no parent."
            )
         if parent is not soup:
            raise ValueError(
               f"Cannot parse {result.path_alias}: <{heading.name}> heading "
               f"'{heading.get_text(' ', strip=True)}' is nested inside "
               f"<{parent.name}>; headings must be at the HTML fragment's top level."
            )

      sections: list[ChapterSection] = []
      active_sections: list[tuple[int, ChapterSection]] = []
      images: list[Image] = []
      private_images: list[Image] = []

      for node in soup.children:
         if isinstance(node, (Comment, Doctype)):
            continue

         if isinstance(node, Tag) and node.name in heading_tags:
            level = int(node.name[1])
            if not sections and level > 2:
               introduction = ChapterSection("Introduction", "")
               sections.append(introduction)
               active_sections.append((2, introduction))

            while active_sections and active_sections[-1][0] >= level:
               active_sections.pop()

            section = ChapterSection(node.get_text(" ", strip=True), "")
            if active_sections:
               active_sections[-1][1].subheadings.append(section)
            else:
               sections.append(section)
            active_sections.append((level, section))
         else:
            if not active_sections:
               if not isinstance(node, Tag) and not str(node).strip():
                  continue
               introduction = ChapterSection("Introduction", "")
               sections.append(introduction)
               active_sections.append((2, introduction))

            # Serialize whole content tags once, preserving their nested markup.
            if isinstance(node, Tag):
               html = str(node)

               # Include the node itself when it is an image, plus nested images.
               image_tags = [node] if node.name.lower() == "img" else node.find_all("img")
               for image_tag in image_tags:
                  image = Image.createFromTag(image_tag)
                  if image is not None:
                     if image.src.startswith(r"private://") or image.src.startswith(r"file://"):
                        private_images.append(image)
                     else:
                        images.append(image)
                  
            elif isinstance(node, NavigableString):
               html = node.output_ready()
            else:
               raise TypeError(f"Unsupported HTML node type: {type(node).__name__}")

            # Add the HTML with CR and LF removed from the start and end of the string.
            active_sections[-1][1].html += html.strip("\r\n")

      # Sections are attached when opened, so empty and final sections survive.
      # TODO: What does that mean???
      result.sections = sections

      # Add images to the result.
      result.images = images
      result.private_images = private_images
