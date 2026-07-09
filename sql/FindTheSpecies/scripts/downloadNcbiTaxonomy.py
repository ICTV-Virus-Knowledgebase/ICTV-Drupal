
from datetime import datetime
import os
from pathlib import Path
import requests
import zipfile


# The subfolder where data files will be extracted.
# TODO: Pass this in as a command line parameter!
data_path = "./data"

# The FTP/download URL
ftp_url = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdmp.zip"

# The taxonomy zip file that will be downloaded from NCBI.
ncbi_zip_file = "taxdmp.zip"


# Make sure the data subdirectory exists.
if not Path(data_path).is_dir():
   print("Error: The data subdirectory does not exist.")
   exit(1)

try:
   # Download the ZIP file from the NCBI.
   response = requests.get(ftp_url, stream=True)
   response.raise_for_status()  # Raise an error for failed requests

   with open(ncbi_zip_file, "wb") as file:
      for chunk in response.iter_content(chunk_size=8192):
         file.write(chunk)

   print(f"Downloaded file saved as {ncbi_zip_file}")

   mtime = Path(ncbi_zip_file).stat().st_mtime
   print("Local zip timestamp:", datetime.fromtimestamp(mtime).isoformat())

except requests.exceptions.RequestException as re:
   print(f"Error downloading file: {re}")
   exit(1)

except Exception as e:
   print(f"Unexpected error: {e}")
   exit(1)



# Validate the zip file
if not zipfile.is_zipfile(ncbi_zip_file):
   print("Error: The downloaded file is not a valid ZIP archive.")
   exit(1)

try:
   with zipfile.ZipFile(ncbi_zip_file, "r") as zip_ref:

      # Delete existing versions of the files.
      for file_name in zip_ref.namelist():

         file_path = os.path.join(data_path, file_name)

         # If the file already exists, delete it.
         Path(file_path).unlink(missing_ok=True)

      zip_ref.extract("division.dmp", data_path)
      zip_ref.extract("names.dmp", data_path)
      zip_ref.extract("nodes.dmp", data_path)

   print(f"Extracted files to {data_path}")

except zipfile.BadZipFile as bzf:
   print(f"Error: Corrupt ZIP file: {bzf}")
   exit(1)
   
except Exception as e:
   print(f"Error: {e}")
   exit(1)
   
exit(0)