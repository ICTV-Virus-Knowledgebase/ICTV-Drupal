
from dataclasses import asdict
from .chapter_section import ChapterSection
from .image import Image
from ..enums import PageType
from urllib.parse import urlparse
from ..utils import Utils


class SearchResult:
   """
   The result of a search for report chapter pages and sections. Each SearchResult corresponds to a single 
   report chapter page, which may contain multiple sections.
   """
   html: str
   images: list[Image]|None
   node_id: int
   path_alias: str
   page_type: PageType|None
   private_images: list[Image]|None
   sections: list[ChapterSection]
   taxon_name: str|None

   def __init__(self, html: str, node_id: int, path_alias: str):
      self.html = Utils.safe_trim(html)
      self.images = []
      self.node_id = node_id
      self.path_alias = Utils.safe_trim(path_alias)
      self.page_type = None
      self.private_images = []
      self.sections = []
      self.taxon_name = None

      # Parse the path alias as a URL and try to extract the taxon name.
      parsed_path = urlparse(path_alias)
      path = parsed_path.path

      # Remove path nodes on the right that aren't the taxon name.
      if path.endswith(('/abbreviations', '/acknowledgments', '/authors', '/citation', '/citations', \
                        '/diagrams', '/editors', '/files', '/fulltree', '/further_reading', '/help', \
                        '/introduction', '/references', '/resources', '/speciesnames', '/virus_properties')):
         try:
            self.page_type = PageType(path.rsplit("/", 1)[1])
         except ValueError:
            pass

         path = path.rsplit("/", 1)[0]

      if self.page_type is None:
         # If the path alias doesn't end with a known page 
         # type, assume it's the main page for a taxon.
         self.page_type = PageType.default

      # The right-most node in the path *should* now be the taxon name.
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
         "page_type": self.page_type.value if self.page_type is not None else None,
         "path_alias": self.path_alias,
         "private_images": private_images,
         "sections": [asdict(section) for section in self.sections],
         "taxon_name": self.taxon_name
      }
