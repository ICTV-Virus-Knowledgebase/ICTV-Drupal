
import os
import requests
import zipfile


extract_path = "extracted_files"  # Folder where files will be extracted
url = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdmp.zip"
zip_path = "taxdmp.zip"



# Download the ZIP file
def downloadZip(url, zipPath):
   try:
      response = requests.get(url, stream=True)
      response.raise_for_status()  # Raise an error for failed requests

      with open(zipPath, "wb") as file:
         for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

      print(f"Downloaded file saved as {zipPath}")

   except requests.exceptions.RequestException as e:
      print(f"Error downloading file: {e}")
      return False
   
   return True


# Safely extract specified contents of the ZIP file.
def extractZip(zipPath, extractPath):

   # Make sure the zip file is valid.
   if not zipfile.is_zipfile(zipPath):
      print("Error: The downloaded file is not a valid ZIP archive.")
      return False

   # Ensure output directory exists
   os.makedirs(extractPath, exist_ok=True)  

   try:
      with zipfile.ZipFile(zipPath, "r") as zipRef:

         # Check for existing files and rename if necessary
         for fileName in zipRef.namelist():
            filePath = os.path.join(extractPath, fileName)

            # If file exists, rename it by appending "_new"
            if os.path.exists(filePath):
               base, ext = os.path.splitext(fileName)
               newFileName = f"{base}_new{ext}"
               filePath = os.path.join(extractPath, newFileName)
               print(f"File {fileName} already exists. Saving as {newFileName}")

         zipRef.extract("division.dmp", extractPath)
         zipRef.extract("names.dmp", extractPath)
         zipRef.extract("nodes.dmp", extractPath)

      print(f"Extracted files to {extractPath}")

   except zipfile.BadZipFile:
      print("Error: Corrupt ZIP file.")
      return False
   
   return True


# Run the functions
if downloadZip(url, zip_path):
    extractZip(zip_path, extract_path)