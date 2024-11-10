
import argparse
from common import safeTrim
from scripts.VirusNameLookup.database import SearchableTaxon
from terms import NameClass, TaxonomyDB, TaxonomyRank





#--------------------------------------------------------------------------------
# ____ and import the contents into the searchable_taxon DB table.
#--------------------------------------------------------------------------------
def importLatestTaxonomyNodes(searchableTaxon_: SearchableTaxon):

   # Get the latest version of distinct taxonomy_node names.
   



   # Iterate over every row.
   for row in df.itertuples(index=False):
      try:
         # MSL release number, rank name, and taxnode ID will be used in every import below.
         mslReleaseNum = row.msl_release_num
         if mslReleaseNum in (None, ''):
            raise Exception("MSL release number is invalid")

         taxNodeID = row.taxnode_id
         if taxNodeID in (None, ''):
            raise Exception("Taxnode ID is invalid")
         
         currentTaxNodeID = row.current_taxnode_id
         if currentTaxNodeID in (None, ''):
            raise Exception("Current taxnode ID is invalid")
         
         rankName = safeTrim(row.rank_name)
         if rankName in (None, '') or len(rankName) < 1 or not TaxonomyRank.hasKey(rankName):
            raise Exception(f"Rank name for taxnode ID {taxNodeID} is invalid")
         
         parentID = row.parent_id
         if parentID in (None, ''):
            raise Exception("Parent taxnode ID is invalid")

         #--------------------------------------------------------------------------------
         # The following columns can result in one or more taxon names.
         #--------------------------------------------------------------------------------
         name = row.name
         if name in (None, ''):
            raise Exception("Name is invalid")
         trimmedName = name.strip()
         if len(trimmedName) < 1:
            raise Exception("Invalid name")
         taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.scientific_name.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
         
         abbrevCSVs = row.abbrev_csv
         if abbrevCSVs not in (None, '') and len(abbrevCSVs.strip()) > 0:

            # Replace commas with semicolons
            abbrevCSVs = abbrevCSVs.replace(",", ";")

            # Iterate over all abbreviation tokens
            for abbrevCSV in abbrevCSVs.split(";"):
               trimmedName = abbrevCSV.strip()
               if len(trimmedName) > 0: 
                  taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.abbreviation.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)

         cleanedName = row.cleaned_name
         if cleanedName in (None, '') or len(cleanedName.strip()) < 1:
            raise Exception("CleanedName is invalid")
         # TODO: Do we need to use this?
         
         exemplarName = row.exemplar_name
         if exemplarName not in (None, ''):
            trimmedName = exemplarName.strip()
            if len(trimmedName) > 0:
               taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.isolate_exemplar.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
         
         genbankAccessions = row.genbank_accession_csv
         if genbankAccessions not in (None, ''):

            # Replace commas with semicolons
            genbankAccessions = genbankAccessions.replace(",", ";")

            # Iterate over all GenBank accession tokens
            for genbankAccession in genbankAccessions.split(";"):
               trimmedName = genbankAccession.strip()
               if len(trimmedName) > 0: 
                  taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.genbank_accession.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
                  
         isolateNames = row.isolate_csv
         if isolateNames not in (None, ''):

            # Replace commas with semicolons
            isolateNames = isolateNames.replace(",", ";")

            # Iterate over all isolate names
            for isolateName in isolateNames.split(";"):
               trimmedName = isolateName.strip()
               if len(trimmedName) > 0: 
                  taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.isolate_name.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)

         refseqAccessions = row.refseq_accession_csv
         if refseqAccessions not in (None, '') and len(refseqAccessions.strip()) > 0:

            # Replace commas with semicolons
            refseqAccessions = refseqAccessions.replace(",", ";")

            # Iterate over all RefSeq accession tokens
            for refseqAccession in refseqAccessions.split(";"):
               trimmedName = refseqAccession.strip()
               if len(trimmedName) > 0: 
                  taxonName_.importTaxonName(mslReleaseNum, trimmedName, rankName, currentTaxNodeID, 
                                    trimmedName, NameClass.refseq_accession.name, TaxonomyDB.ictv_taxonomy.name, 
                                    parentID, rankName, TaxonomyDB.ictv_taxonomy.name, taxNodeID, mslReleaseNum)
                  
      except Exception as e:
         print(f"The following error occurred: {e}")








if __name__ == '__main__':

   parser = argparse.ArgumentParser(description="Import taxonomy_node data from a TSV file and create records in MariaDB.")
   parser.add_argument("--filename", dest="filename", metavar='FILENAME', nargs=1, required=False, help="The TSV filename")
   parser.add_argument("--dbName", dest="dbName", metavar='DB_NAME', nargs=1, required=True, help="The database name")
   parser.add_argument("--host", dest="host", metavar='HOST', nargs=1, required=True, help="The database hostname")
   parser.add_argument("--username", dest="username", metavar='USERNAME', nargs=1, required=True, help="The database username")
   parser.add_argument("--password", dest="password", metavar='PASSWORD', nargs=1, required=True, help="The database password")
   parser.add_argument("--port", default="3306", dest="port", metavar='PORT', nargs=1, required=False, help="The database port")

   args = parser.parse_args()

   dbName = args.dbName[0]
   host = args.host[0]
   password = args.password[0]
   port = int(args.port[0])
   username = args.username[0]