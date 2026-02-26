#!/usr/bin/env bash
#
# Create and initialize tables in the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' create_and_initialize_ictv_apps_temp.sh

# Database connection information.
DB_HOSTNAME="localhost"
DB_USERNAME=""
DB_PASSWORD=""
DB_PORT="3306"

# The top-level directory
START_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting script execution from directory: $START_DIR"

# The directory containing initialization scripts for Find the Species.
INIT_DIR="$START_DIR/../initialize"

# The directory containing functions.
FUNCTIONS_DIR="$START_DIR/../Functions"

# The directory containing stored procedures (just one for now).
STORED_PROCS_DIR="$START_DIR/../storedProcedures"

# Python scripts directory
PY_SCRIPT_DIR="$START_DIR/../../../scripts/VirusNameLookup"

# SQL Directory for views
VIEWS_DIR="$START_DIR/../views"

# The time when the script was started, used to calculate total execution time at the end of the script.
INITIAL_START_TIME=$(date +%s)

# The ictv_apps_temp database
APPS_TEMP_DB="ictv_apps_temp"

# The Disease Ontology data file.
DiseaseOntologyFilename="$SCRIPT_DIR/../../../data/diseaseOntologyData_021825.csv"


#-----------------------------------------------------------------------------------------------------------
# Define functions
#-----------------------------------------------------------------------------------------------------------

# Calculate and display elapsed time.
function display_elapsed_time {
   local START_TIME=$1

   END_TIME=$(date +%s)
   ELAPSED_TIME=$((END_TIME - START_TIME))

   MINUTES=$((ELAPSED_TIME / 60))
   SECONDS=$((ELAPSED_TIME % 60))

   echo -e "Execution time: ${MINUTES} minute(s), ${SECONDS} second(s)"
}

# Display usage information.
function usage {
    echo "Usage: $0 -u database_username -p database_password"
    exit 1
}

#-----------------------------------------------------------------------------------------------------------
# Parse input parameters
#-----------------------------------------------------------------------------------------------------------
while getopts ":u:p:" opt; do
   case ${opt} in
      u )
         DB_USERNAME=$OPTARG
         ;;
      p )
         DB_PASSWORD=$OPTARG
         ;;
      \? )
         usage
         ;;
   esac
done

# Check if required parameters are provided
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
    usage
fi

#--------------------------------------------------------------------------------------------------------------
# Create the ictv_apps_temp database and tables, add views, stored procedures, and functions.
#--------------------------------------------------------------------------------------------------------------
function create_database {

   echo -e "\nCreating database $APPS_TEMP_DB"
   
   #-----------------------------------------------------------------------------------------------------------
   # Create the vocabulary and term tables.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nCreating vocabulary and term tables"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/CreateVocabularyTable.sql"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/CreateTermTable.sql"
      
   #-----------------------------------------------------------------------------------------------------------
   # Create the NCBI Taxonomy tables.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nCreating temp NCBI Taxonomy tables"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/CreateNcbiTaxonomyTables.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the temp NCBI Taxonomy tables"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Create the latest_release_of_ictv_ids table.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nCreating latest_release_of_ictv_ids table"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/CreateLatestReleaseOfIctvIDTable.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the latest_release_of_ictv_ids table"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Create the searchable_taxon table.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nCreating searchable_taxon table"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/CreateSearchableTaxonTable.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the searchable_taxon table"
      exit 1
   fi
      
   #-----------------------------------------------------------------------------------------------------------
   # Add views to the ictv_apps_temp database.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nAdding temp views"
   mariadb -s -b --show-warnings < "$INIT_DIR/AddViewsToIctvAppsTemp.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred adding views to the ictv_apps_temp database"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Add the function "get filtered name".
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nAdding GetFilteredName.sql"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$FUNCTIONS_DIR/GetFilteredName.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred adding the GetFilteredName function"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Add a stored procedure used when importing records into searchable_taxon.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nAdding ImportSearchableTaxon.sql"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportSearchableTaxon.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred adding the ImportSearchableTaxon stored procedure"
      exit 1
   fi

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/InitializeTempVocabularyAndTerm.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the InitializeTempVocabularyAndTerm stored procedure"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Add the stored procedure that's used to query searchable_taxon.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nAdding QuerySearchableTaxon.sql"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/QuerySearchableTaxon.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the QuerySearchableTaxon stored procedure"
      exit 1
   fi

}

#--------------------------------------------------------------------------------------------------------------
# Initialize the database by populating tables with data from the ICTV, NCBI Taxonomy, and Disease Ontology.
#--------------------------------------------------------------------------------------------------------------
function initialize_database {

   #-----------------------------------------------------------------------------------------------------------
   # Initialize the vocabulary and term tables.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nInitializing vocabulary and term tables"
   echo "CALL InitializeTempVocabularyAndTerm();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred initializing the temp vocabulary and term tables"
      exit 1
   fi

   #-----------------------------------------------------------------------------------------------------------
   # Populate the temp NCBI Taxonomy tables with data from ictv_apps. Note that the database name is provided
   # explicitly in the "Populate" script to avoid accidentally clobbering the NCBI Taxonomy tables in ictv_apps.
   #-----------------------------------------------------------------------------------------------------------
   START_TIME=$(date +%s)
   echo -e "\nPopulating temp NCBI Taxonomy tables"
   mariadb -s -b --show-warnings < "$INIT_DIR/PopulateTempNcbiTaxonomyTables.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred populating the temp NCBI Taxonomy tables"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Initializing NCBI term ID columns.
   #-----------------------------------------------------------------------------------------------------------
   START_TIME=$(date +%s)
   echo -e "\nInitializing NCBI term ID columns"
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/InitializeNcbiTermIdColumns.sql"
   echo "CALL InitializeNcbiTermIdColumns();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred initializing the NCBI term ID columns"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Initialize the latest_release_of_ictv_ids table.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nInitializing latest_release_of_ictv_ids table"
   START_TIME=$(date +%s)
   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/InitializeLatestReleaseOfIctvID.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred initializing the latest_release_of_ictv_ids table"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import VMR records (species_isolates).
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nImporting latest species isolates (VMR records)"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportLatestSpeciesIsolates.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the ImportLatestSpeciesIsolates stored procedure"
      exit 1
   fi

   echo "CALL ImportLatestSpeciesIsolates();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred importing the latest species isolates (VMR records)"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import the latest taxonomy_node(_names) corresponding with distinct names in taxonomy_node(_names). 
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nImporting latest taxonomy nodes"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportLatestTaxonomyNodes.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the ImportLatestTaxonomyNodes stored procedure"
      exit 1
   fi

   echo "CALL ImportLatestTaxonomyNodes();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred importing the latest taxonomy nodes"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import ICTV species with binomial nomenclature and remove the genus name from the species name.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nImporting ICTV species epithets"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportIctvSpeciesEpithets.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the ImportIctvSpeciesEpithets stored procedure"
      exit 1
   fi

   echo "CALL ImportIctvSpeciesEpithets();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred importing the ICTV species epithets"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import scientific names from NCBI Taxonomy.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nImporting NCBI scientific names"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportNcbiScientificNames.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the ImportNcbiScientificNames stored procedure"
      exit 1
   fi

   echo "CALL ImportNcbiScientificNames();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred importing the NCBI scientific names"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Initialize NCBI Taxonomy subspecies records before importing them.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nInitializing NCBI subspecies"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/InitializeNcbiSubspecies.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the InitializeNcbiSubspecies stored procedure"
      exit 1
   fi

   echo "CALL InitializeNcbiSubspecies();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred initializing the NCBI subspecies records"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import subspecies nodes from NCBI Taxonomy.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nImporting NCBI subspecies nodes"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/ImportNcbiSubspeciesNodes.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the ImportNcbiSubspeciesNodes stored procedure"
      exit 1
   fi

   echo "CALL ImportNcbiSubspeciesNodes();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred importing the NCBI subspecies nodes"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Update NCBI Taxonomy non-scientific names that are associated with NCBI Taxonomy scientific names
   # that have an ICTV taxnode ID assigned.
   #-----------------------------------------------------------------------------------------------------------
   echo -e "\nUpdating NCBI non-scientific names"
   START_TIME=$(date +%s)

   mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$INIT_DIR/UpdateNcbiNonScientificNames.sql"
   if [ $? -ne 0 ]; then
      echo "An error occurred creating the UpdateNcbiNonScientificNames stored procedure"
      exit 1
   fi

   echo "CALL UpdateNcbiNonScientificNames();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
      echo "An error occurred updating the NCBI non-scientific names"
      exit 1
   fi

   display_elapsed_time "$START_TIME"

   #-----------------------------------------------------------------------------------------------------------
   # Import Disease Ontology data and populate searchable_taxon.
   #-----------------------------------------------------------------------------------------------------------

   # Import the Disease Ontology CSV file into the disease_ontology table
   echo -e "\nImporting disease_ontology data from $DiseaseOntologyFilename"
   START_TIME=$(date +%s)
   python3 "$PY_SCRIPT_DIR/importDiseaseOntology.py" --dbName $APPS_TEMP_DB --filename $DiseaseOntologyFilename \
      --hostname $DB_HOSTNAME --password $DB_PASSWORD --port $DB_PORT --username $DB_USERNAME
   display_elapsed_time "$START_TIME"

   # Initialize the disease_ontology table by associating records with an ICTV ID and taxnode ID.
   echo -e "\nInitializing the disease_ontology table"
   START_TIME=$(date +%s)
   mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$INIT_DIR/InitializeDiseaseOntology.sql"
   echo "CALL InitializeDiseaseOntology();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
   echo "An error occurred initializing the disease_ontology table"
   exit 1
   fi

   display_elapsed_time "$START_TIME"

   # Import disease_ontology records into searchable_taxon.
   echo -e "\nImporting disease_ontology records into searchable_taxon"
   START_TIME=$(date +%s)
   mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$INIT_DIR/ImportDiseaseOntologyIntoSearchableTaxon.sql"
   echo "CALL ImportDiseaseOntologyIntoSearchableTaxon();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
   if [ $? -ne 0 ]; then
   echo "An error occurred importing disease_ontology records into searchable_taxon"
   exit 1
   fi
}


#-----------------------------------------------------------------------------------------------------------
# Main script execution
#-----------------------------------------------------------------------------------------------------------

# Create the ictv_apps_temp database and tables, add views, stored procedures, and functions.
#create_database

# Initialize the database by populating tables with data from the ICTV, NCBI Taxonomy, and Disease Ontology.
#initialize_database


END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"

