

#--------------------------------------------------------------------------------
# Commonly-used functions
#--------------------------------------------------------------------------------

# Remove/replace characters so the text can be used in valid SQL.
def formatForSQL(text: str):

   if text in (None, ""):
      return ""
   
   return text.replace("'", "''").replace("\"", "")


# Trim a string that's possibly null and always return a non-null value.
def safeTrim(text: str):
   if not text:
      return ""
   
   trimmedText = text.strip()
   if len(trimmedText) < 1:
      return ""
   
   return trimmedText

