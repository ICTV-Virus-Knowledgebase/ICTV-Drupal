
from enum import Enum

#-----------------------------------------------------------------------------------------------------------------------------
# Enums
#-----------------------------------------------------------------------------------------------------------------------------

# Types of report chapter pages that provided additional data about a taxon.
# Generally, this term is the last node of a URL following the taxon name(s).
class PageType(str, Enum):
   abbreviations = "abbreviations"
   acknowledgments = "acknowledgments"
   authors = "authors"
   citation = "citation"
   citations = "citations"

   # "default" is used for pages that don't have a specific type, e.g. the main page for a taxon.
   # There won't be a path alias that ends in "/default".
   default = "default" 

   diagrams = "diagrams"
   editors = "editors"
   files = "files"
   further_reading = "further_reading"
   help = "help"
   history = "history"
   introduction = "introduction"
   references = "references"
   resources = "resources"
   speciesnames = "speciesnames"
   virus_properties = "virus_properties"
