
from bs4 import Tag
from dataclasses import dataclass

@dataclass
class Image:
   alt: str|None
   data_entity_type: str
   height: int
   src: str
   width: int

   def __init__(self, alt: str|None, data_entity_type: str, height: int, src: str, width: int) -> None:
      self.alt = alt
      self.data_entity_type = data_entity_type
      self.height = height
      self.src = src
      self.width = width


   @staticmethod
   def createFromTag(tag: Tag) -> "Image|None":

      if tag.name != "img":
         return None
      
      alt_attr = tag.get("alt")
      alt = str(alt_attr) if alt_attr is not None else ""

      data_entity_type_attr = tag.get("data-entity-type")
      data_entity_type = str(data_entity_type_attr) if data_entity_type_attr is not None else ""

      height_attr = tag.get("height")
      height = int(str(height_attr)) if height_attr else 0

      src_attr = tag.get("src")
      src = str(src_attr) if src_attr is not None else ""
      if len(src) < 1:
         return None

      width_attr = tag.get("width")
      width = int(str(width_attr)) if width_attr else 0

      return Image(
         alt=alt, 
         data_entity_type=data_entity_type,
         height=height,
         src=src,
         width=width
      )


   def to_dict(self) -> dict:
      return {
         "alt": self.alt, 
         "data_entity_type": self.data_entity_type, 
         "height": self.height, 
         "src": self.src,
         "width": self.width
      }