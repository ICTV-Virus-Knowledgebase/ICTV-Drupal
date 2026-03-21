#!/bin/bash
#
# Update tables in the ictv_apps database using the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' update_ictv_apps.sh


# Make sure the script is run from the FindTheSpecies directory.
CURRENT_DIR_NAME=$(basename "$(pwd)")
if [ "$CURRENT_DIR_NAME" != "FindTheSpecies" ]; then
   echo -e "This script should be run in the FindTheSpecies directory\n"
   exit 1
fi

#------------------------------------------------------------------------------------------------------------------
# Sourcing set_env_vars.sh sets the following variables:
#
#  APPS_DB: The ictv_apps database
#
#  APPS_TEMP_DB: The ictv_apps_temp database
#
#  AUTOMATION_DIR: the automation directory
#
#  DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_PORT: Database connection information
#
#  DISEASE_ONTOLOGY_FILENAME: The disease_ontology data file
#
#  FTS_HOME: The FindTheSpecies directory (under /sql in ICTV-Drupal)
#
#  DATA_DIR: Data directory
#
#  SCRIPT_DIR: Python scripts directory
#
#  SQL_DIR: Directory for stored procedures, views, and SQL scripts used by ictv_apps_temp
#------------------------------------------------------------------------------------------------------------------
source ./automation/set_env_vars.sh

# Display usage information.
function usage {
   echo -e "Usage: $0 -u <database username> -p <database password>\n"
   exit 1
}

# Parse input parameters
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

# This script's start time.
INITIAL_START_TIME=$(date +%s)


#------------------------------------------------------------------------------------------------------------------
# Create tables and update views, stored procedures, and functions.
#------------------------------------------------------------------------------------------------------------------

# Add SQL views
echo -e "\nAdding SQL views\n"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/v_searchable_taxon.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/v_species_isolates.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node_merge_split.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node_names.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node.sql"

#------------------------------------------------------------------------------------------------------------------
# Update the vocabulary and term tables with new data.
#------------------------------------------------------------------------------------------------------------------
START_TIME=$(date +%s)
echo -e "\nUpdating vocabulary and term tables\n"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/UpdateVocabularyAndTerms.sql"
echo "CALL UpdateVocabularyAndTerms();" | mariadb -D $APPS_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred updating the vocabulary and term tables\n"
  exit 1
fi

#------------------------------------------------------------------------------------------------------------------
# Update stored procedures and user-defined functions.
#------------------------------------------------------------------------------------------------------------------

# Add the function "get filtered name".
echo -e "\nAdding GetFilteredName.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/GetFilteredName.sql"

# Add the stored procedure used to import records into searchable_taxon.
echo -e "\nAdding ImportSearchableTaxon.sql"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/ImportSearchableTaxon.sql"

# Add the stored procedure that searches searchable_taxon.
echo -e "\nAdding QuerySearchableTaxon.sql\n"
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/QuerySearchableTaxon.sql"



#------------------------------------------------------------------------------------------------------------------
# Populate tables in the ictv_apps database with data from the ictv_apps_temp database.
#------------------------------------------------------------------------------------------------------------------
echo -e "\nPopulating tables in the ictv_apps database with data from the ictv_apps_temp database"
START_TIME=$(date +%s)
mariadb -D "$APPS_DB" -s -b --show-warnings < "$SQL_DIR/PopulateIctvAppsFromTemp.sql"
if [ $? -ne 0 ]; then
  echo "An error occurred populating tables in the ictv_apps database from the ictv_apps_temp database\n"
  exit 1
fi

display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Calculate and display the total execution time.
#------------------------------------------------------------------------------------------------------------------
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"
