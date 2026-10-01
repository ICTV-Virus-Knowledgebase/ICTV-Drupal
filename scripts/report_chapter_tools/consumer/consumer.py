"""Validate parser output and insert a file in one database transaction."""

import json
from pathlib import Path


def _text(value, location, *, nullable=False, max_chars=None, max_bytes=None):
   if value is None and nullable:
      return
   if not isinstance(value, str):
      raise ValueError(f"{location}: expected a string" + (" or null" if nullable else ""))
   if max_chars is not None and len(value) > max_chars:
      raise ValueError(f"{location}: exceeds {max_chars} characters")
   if max_bytes is not None and len(value.encode("utf-8")) > max_bytes:
      raise ValueError(f"{location}: exceeds {max_bytes} UTF-8 bytes")


def import_results(connection, results):
   """Use a dedicated connection; commit all records or roll back on failure.

   Top-level sections have depth 0 and no parent section. Every section refers
   to the generated node ID, not the source Drupal node_id.
   Display order starts at 1 per node and follows depth-first preorder.
   """
   counts = validate_results(results)
   connection.autocommit = False

   try:
      with connection.cursor() as cursor:
         for node in results:

            cursor.execute(
               "INSERT INTO report_chapter_node "
               "(html, node_id, path_alias, taxon_name) VALUES (?, ?, ?, ?)",
               (node["html"], node["node_id"], node["path_alias"], node.get("taxon_name")),
            )

            rc_node_id = cursor.lastrowid

            # Stack of sibling iterators preserves input order without recursion.
            pending = [(iter(node["sections"]), None, 0)]
            display_order = 0

            while pending:
               siblings, parent_id, depth = pending[-1]

               section = next(siblings, None)
               if section is None:
                  pending.pop()
                  continue

               display_order += 1

               cursor.execute(
                  "INSERT INTO report_chapter_section "
                  "(depth, display_order, heading, html, parent_section_id, rc_node_id) "
                  "VALUES (?, ?, ?, ?, ?, ?)",
                  (depth, display_order, section.get("heading"), section.get("html"), parent_id, rc_node_id),
               )
               
               pending.append((iter(section["subheadings"]), cursor.lastrowid, depth + 1))

      connection.commit()

   except BaseException:
      connection.rollback()
      raise

   return counts


def read_results(filename: str):
    """Read UTF-8 JSON, accepting an optional byte-order mark."""
    with Path(filename).open(encoding="utf-8-sig") as source:
        results = json.load(source)
    validate_results(results)
    return results


def validate_results(results):
   """Reject invalid input before inserting, including values SQL could truncate."""
   if not isinstance(results, list):
      raise ValueError("JSON root: expected a list of SearchResult objects")
   
   section_count = 0
   for index, node in enumerate(results):

      location = f"results[{index}]"
      if not isinstance(node, dict):
         raise ValueError(f"{location}: expected an object")
      
      node_id = node.get("node_id")
      if type(node_id) is not int or not -(2**31) <= node_id < 2**31:
         raise ValueError(f"{location}.node_id: expected a signed 32-bit integer")
      
      _text(node.get("html"), f"{location}.html") # dmd 092126, max_bytes=65535)
      _text(node.get("path_alias"), f"{location}.path_alias", max_chars=200)
      _text(node.get("taxon_name"), f"{location}.taxon_name", nullable=True, max_chars=100)

      pending = [(node.get("sections"), f"{location}.sections")]

      while pending:
         sections, section_location = pending.pop()
         if not isinstance(sections, list):
            raise ValueError(f"{section_location}: expected a list")
         
         for order, section in enumerate(sections):
            child_location = f"{section_location}[{order}]"
            if not isinstance(section, dict):
               raise ValueError(f"{child_location}: expected an object")
            
            _text(section.get("heading"), f"{child_location}.heading", nullable=True, max_chars=500)
            _text(section.get("html"), f"{child_location}.html", nullable=True) # dmd 092126 max_bytes=2**32 - 1)

            pending.append((section.get("subheadings"), f"{child_location}.subheadings"))

            section_count += 1

   return len(results), section_count

