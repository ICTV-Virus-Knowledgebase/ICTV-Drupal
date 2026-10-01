
from datetime import datetime
from typing import Optional

#-----------------------------------------------------------------------------------------------------------------------------
# Utility functions
#-----------------------------------------------------------------------------------------------------------------------------
class Utils:

   # Format a datetime for the start and end times of program execution.
   @staticmethod
   def format_datetime(dt: datetime) -> str:
      # Portable 12-hour time, lowercase am/pm, and mm/dd/yy date
      return dt.strftime("%I:%M%p, %m/%d/%y").lstrip("0").replace("AM", "am").replace("PM", "pm")


   # Format the end datetime and include the duration between it and the start datetime.
   @staticmethod
   def format_end_datetime_with_duration(end: datetime, start: datetime) -> str:

      formatted_end = Utils.format_datetime(end)

      total_seconds = int((end - start).total_seconds())
      minutes, seconds = divmod(total_seconds, 60)
      parts = []

      if minutes:
         parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

      parts.append(f"{seconds} second{'s' if seconds != 1 else ''}")

      return f"{formatted_end} ({', '.join(parts)})" 


   # Trim a string that's possibly null and always return a trimmed, non-null value.
   @staticmethod
   def safe_trim(text: Optional[str]):
      if not text:
         return ""
      else:
         return text.strip()

