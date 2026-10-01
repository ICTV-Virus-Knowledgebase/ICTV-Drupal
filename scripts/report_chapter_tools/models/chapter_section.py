
from dataclasses import dataclass

@dataclass
class ChapterSection:
   heading: str
   html: str # Content belonging to this section, excluding subsection content.
   subheadings: list["ChapterSection"]

   def __init__(self, heading: str, html: str) -> None:
      self.heading = heading
      self.html = html
      self.subheadings = []
