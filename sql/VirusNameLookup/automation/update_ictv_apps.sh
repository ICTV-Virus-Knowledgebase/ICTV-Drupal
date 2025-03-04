#!/usr/bin/env bash
#
# Update tables in the ictv_apps database using the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' update_ictv_apps.sh

INITIAL_START_TIME=$(date +%s)

# The ictv_apps database
AppsDB="ictv_apps"

# Define a function that calculates and displays the elapsed time of "name".
function display_elapsed_time {
   local START_TIME=$1

   END_TIME=$(date +%s)
   ELAPSED_TIME=$((END_TIME - START_TIME))

   MINUTES=$((ELAPSED_TIME / 60))
   SECONDS=$((ELAPSED_TIME % 60))

   echo -e "Execution time: ${MINUTES} minute(s), ${SECONDS} second(s)"
}


#------------------------------------------------------------------------------------------------------------------
# Create tables and update views.
#------------------------------------------------------------------------------------------------------------------

# Create the disease_ontology table.
echo -e "\nCreating disease_ontology table"
mariadb -D $AppsDB -s -b --show-warnings < CreateDiseaseOntologyTable.sql
if [ $? -ne 0 ]; then
  echo "An error occurred creating the disease_ontology table"
  exit 1
fi

# Add views that reference the ictv_taxonomy database.
echo -e "\nAdding views that reference the ictv_taxonomy database"
mariadb -D $AppsDB -s -b --show-warnings < AddViewsToIctvApps.sql


#------------------------------------------------------------------------------------------------------------------
# Update the vocabulary and term tables with new data.
#------------------------------------------------------------------------------------------------------------------
START_TIME=$(date +%s)
echo -e "\nUpdating vocabulary and term tables"
mariadb -D $AppsDB -s -b --show-warnings < UpdateVocabularyAndTerms.sql
echo "CALL UpdateVocabularyAndTerms();" | mariadb -D $AppsDB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred updating the vocabulary and term tables"
  exit 1
fi

display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Update the searchable_taxon table.
#------------------------------------------------------------------------------------------------------------------

# Delete records from the searchable_taxon table.
echo "DELETE FROM searchable_taxon;" | mariadb -D $AppsDB -s -b --show-warnings

# Add a new column to the searchable_taxon table.
START_TIME=$(date +%s)
echo -e "\nAdding a new column to the searchable_taxon table"
echo "ALTER TABLE searchable_taxon ADD COLUMN IF NOT EXISTS alternate_id VARCHAR(100) NULL;" | mariadb -D $AppsDB -s -b --show-warnings
if [ $? -ne 0 ]; then
  echo "An error occurred adding a new column to the searchable_taxon table"
  exit 1
fi

display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Update stored procedures and user-defined functions.
#------------------------------------------------------------------------------------------------------------------

# Add the function "get filtered name".
echo -e "\nAdding GetFilteredName.sql"
mariadb -D $AppsDB -s -b --show-warnings < GetFilteredName.sql

# Add the stored procedure used to import records into searchable_taxon.
echo -e "\nAdding ImportSearchableTaxon.sql"
mariadb -D $AppsDB -s -b --show-warnings < ImportSearchableTaxon.sql

# Add the stored procedure that searches searchable_taxon.
echo -e "\nAdding QuerySearchableTaxon.sql"
mariadb -D $AppsDB -s -b --show-warnings < QuerySearchableTaxon.sql


#------------------------------------------------------------------------------------------------------------------
# Populate tables in the ictv_apps database with data from the ictv_apps_temp database.
#------------------------------------------------------------------------------------------------------------------
echo -e "\nPopulating tables in the ictv_apps database with data from the ictv_apps_temp database"
START_TIME=$(date +%s)
mariadb -D $AppsDB -s -b --show-warnings < PopulateIctvAppsFromTemp.sql
if [ $? -ne 0 ]; then
  echo "An error occurred populating tables in the ictv_apps database from the ictv_apps_temp database"
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
