
import argparse
from Common import NameClass
from enum import Enum

import pandas as pd




# https://mariadb.com/docs/server/connect/programming-languages/python/connect/
# https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html


csvColumns = [ 
   "taxnode_id",
   "abbrev_csv",
   "cleaned_name",
   "exemplar_name",
   "genbank_accession_csv",
   "isolate_csv",
   "msl_release_num",
   "name",
   "rank_name",
   "refseq_accession_csv"
]


def importTaxonName():
   
   """
   Every row will have:
      msl_release_num
      rank_name
      taxnode_id
   
   Different rows will include:

   NameClass.abbreviation
   NameClass.exemplar_name
   NameClass.genbank_accession
   NameClass.isolate_name
   NameClass.refseq_accession
   NameClass.scientific_name

   "cleaned_name"???
   """



def loadData(filename_):

   
   df = pd.read_csv(filename, header=0, index_col=False, names=csvColumns, encoding="latin-1", keep_default_na=False)
   # TODO: validate!

   # Iterate over every row.
   for row in df.itertuples(index=False):
      
      names = []

      abbrevCSVs = row.abbrev_csv
      if abbrevCSVs not in (None, '') and len(abbrevCSVs.strip()) > 0:
         for abbrevCSV in abbrevCSVs.split(";"):
            trimmedName = abbrevCSV.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.abbreviation, trimmedName])

      cleanedName = row.cleaned_name
      if cleanedName in (None, '') or len(cleanedName.strip()) < 1:
         raise Exception("CleanedName is invalid")
      
      exemplarName = row.exemplar_name
      if exemplarName in (None, '') or len(exemplarName.strip()) < 1:
         raise Exception("ExemplarName is invalid")
      
      genbankAccessions = row.genbank_accession_csv
      if genbankAccessions not in (None, ''):
         for genbankAccession in genbankAccessions.split(";"):
            trimmedName = genbankAccession.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.genbank_accession, trimmedName])

      isolateNames = row.isolate_csv
      if isolateNames not in (None, '') and len(isolateNames.strip()) > 0:
         for isolateName in isolateNames.split(";"):
            trimmedName = isolateName.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.isolate_name, trimmedName])

      mslReleaseNum = row.msl_release_num
      if mslReleaseNum in (None, ''):
         print(f"mslReleaseNum={mslReleaseNum}.")
         raise Exception("MSL release number is invalid")
      
      name = row.name
      if name in (None, '') or len(name.strip()) < 1:
         raise Exception("Name is invalid")

      rankName = row.rank_name
      if rankName in (None, '') or len(rankName.strip()) < 1:
         raise Exception("Rank name is invalid")
      
      refseqAccessions = row.refseq_accession_csv
      if refseqAccessions not in (None, '') and len(refseqAccessions.strip()) > 0:
         for refseqAccession in refseqAccessions.split(";"):
            trimmedName = refseqAccession.strip()
            if len(trimmedName) > 0: 
               names.append([NameClass.refseq_accession, trimmedName])

      taxNodeID = row.taxnode_id
      if taxNodeID in (None, ''):
         raise Exception("Taxnode ID is invalid")
      

      

      print(names)



# Example usage: py ImportSpeciesIsolates.py --filename "speciesIsolatesTest.csv"

if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import species_isolate data from a CSV file and create records in MariaDB.")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=True, help="The CSV filename")

   args = parser.parse_args()

   filename = args.filename[0]


   loadData(filename)

   