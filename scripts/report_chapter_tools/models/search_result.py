
from dataclasses import asdict
from .chapter_section import ChapterSection
from .image import Image
#from .enums import PageType
import sys
from urllib.parse import urlparse
from ..utils import Utils


class SearchResult:
   """
   The results of searching HTML for one or more terms. If a heading was specified in the search, 
   the HTML will be constrained to that heading (H2 tag) and any non-H2 tags that follow.

   NOTE: I'm extending this so it can be used for page results (kind of the same thing)
   """
   html: str
   images: list[Image]|None
   node_id: int
   path_alias: str
   page_type: str|None # Consider using the PageType enum here.
   private_images: list[Image]|None
   sections: list[ChapterSection]
   taxon_name: str|None

   def __init__(self, html: str, node_id: int, path_alias: str):
      self.html = Utils.safe_trim(html)
      self.images = []
      self.node_id = node_id
      self.path_alias = Utils.safe_trim(path_alias)
      self.private_images = []
      self.sections = []
      self.taxon_name = None

      # Get the taxon name from the path alias.
      parsed_path = urlparse(path_alias)
      path = parsed_path.path

      # TODO: Figure out how to include these files instead of exiting.
      # Remove path nodes on the right that aren't the taxon name.
      if path.endswith(('/authors', '/citation', '/references', '/resources')):
         sys.stderr.write("Pages ending in authors, citation, references, or resources are not supported\n")
         return

      # The right-most node in the path should now be the taxon name.
      self.taxon_name = path.rsplit("/", 1)[1]


   def to_dict(self) -> dict:

      images = None
      if self.images is not None and len(self.images) > 0:
         images = [asdict(image) for image in self.images]

      private_images = None
      if self.private_images is not None and len(self.private_images) > 0:
         private_images = [asdict(image) for image in self.private_images]

      return {
         "node_id": self.node_id,
         "html": self.html,
         "images": images,
         "path_alias": self.path_alias,
         "private_images": private_images,
         "sections": [asdict(section) for section in self.sections],
         "taxon_name": self.taxon_name
      }