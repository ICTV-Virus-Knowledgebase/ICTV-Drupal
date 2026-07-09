#!/bin/bash
#
# Update tables in the ictv_apps_temp database.
#

# Make sure the script is run from the FindTheSpecies directory.
CURRENT_DIR_NAME=$(basename "$(pwd)")
if [ "$CURRENT_DIR_NAME" != "FindTheSpecies" ]; then
   echo -e "This script should be run in the FindTheSpecies directory\n"
   exit 1
fi

#------------------------------------------------------------------------------------------------------------------
# Sourcing set_env_vars.sh sets the following variables:
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


# Add SQL views
echo -e "\nAdding SQL views\n"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_ncbi_ranks_above_subspecies.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_searchable_taxon.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_species_isolates.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_subspecies_name_classes.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node_merge_split.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node_names.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/v_taxonomy_node.sql"


# Update the vocabulary and term tables with new data.
START_TIME=$(date +%s)
echo -e "\nUpdating vocabulary and term tables\n"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/UpdateVocabularyAndTerms.sql"
echo "CALL UpdateVocabularyAndTerms();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred updating the vocabulary and term tables\n"
  exit 1
fi

display_elapsed_time "$START_TIME"

# Delete records from the searchable_taxon table.
echo "DELETE FROM searchable_taxon;" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings

#------------------------------------------------------------------------------------------------------------------
# Update stored procedures and user-defined functions.
#------------------------------------------------------------------------------------------------------------------

# Add the function "get filtered name".
echo -e "\nAdding GetFilteredName.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/GetFilteredName.sql"

# Add the stored procedure used to import records into searchable_taxon.
echo -e "\nAdding ImportSearchableTaxon.sql"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/ImportSearchableTaxon.sql"

# Add the stored procedure that searches searchable_taxon.
echo -e "\nAdding QuerySearchableTaxon.sql\n"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/QuerySearchableTaxon.sql"


#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with ICTV data.
#------------------------------------------------------------------------------------------------------------------

# Populate the latest_release_of_ictv_ids table.
echo -e "\nPopulating the latest_release_of_ictv_ids table\n"
START_TIME=$(date +%s)
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/InitializeLatestReleaseOfIctvID.sql"
display_elapsed_time "$START_TIME"

# Import VMR records (species_isolates).
echo -e "\nImporting VMR records (species_isolates)\n"
START_TIME=$(date +%s)
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/ImportLatestSpeciesIsolates.sql"
echo "CALL ImportLatestSpeciesIsolates();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred importing VMR records (species_isolates)\n"
  exit 1
fi

display_elapsed_time "$START_TIME"

# Import the latest taxonomy_node records corresponding with distinct names in taxonomy_node. 
echo -e "\nImporting the latest taxonomy nodes\n"
START_TIME=$(date +%s)
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/ImportLatestTaxonomyNodes.sql"
echo "CALL ImportLatestTaxonomyNodes();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred importing the latest taxonomy nodes\n"
  exit 1
fi

display_elapsed_time "$START_TIME"


# TODO: Do we still need to import species epithets?
# Import ICTV species with binomial nomenclature and remove the genus name from the species name.
#echo -e "\nImporting ICTV species epithets\n"
#START_TIME=$(date +%s)
#mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/ImportIctvSpeciesEpithets.sql"
#echo "CALL ImportIctvSpeciesEpithets();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
#if [ $? -ne 0 ]; then
#  echo "An error occurred importing ICTV species epithets\n"
#  exit 1
#fi
#display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with NCBI Taxonomy data.
#------------------------------------------------------------------------------------------------------------------
eval "$AUTOMATION_DIR/import_ncbi_taxonomy_into_searchable_taxon.sh" -u "$DB_USERNAME" -p "$DB_PASSWORD"

#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with Disease Ontology data.
#------------------------------------------------------------------------------------------------------------------
eval "$AUTOMATION_DIR/import_disease_ontology_into_searchable_taxon.sh" -u "$DB_USERNAME" -p "$DB_PASSWORD"


#------------------------------------------------------------------------------------------------------------------
# Calculate and display the total execution time.
#------------------------------------------------------------------------------------------------------------------
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"

