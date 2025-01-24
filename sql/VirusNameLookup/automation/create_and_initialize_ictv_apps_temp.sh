#!/usr/bin/env bash
#
# Create and initialize tables in the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' create_and_initialize_ictv_apps_temp.sh

INITIAL_START_TIME=$(date +%s)

# The ictv_apps_temp database
AppsTempDB="ictv_apps_temp"


# Calculate and display elapsed time.
function display_elapsed_time {
   local START_TIME=$1

   END_TIME=$(date +%s)
   ELAPSED_TIME=$((END_TIME - START_TIME))

   MINUTES=$((ELAPSED_TIME / 60))
   SECONDS=$((ELAPSED_TIME % 60))

   echo -e "Execution time: ${MINUTES} minute(s), ${SECONDS} second(s)"
}


# Create the vocabulary and term tables.
echo -e "\nCreating vocabulary and term tables"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/CreateVocabularyTable.sql
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/CreateTermTable.sql

# Initialize the vocabulary and term tables (after adding the stored procedure).
echo -e "\nInitializing vocabulary and term tables"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/InitializeTempVocabularyAndTerm.sql
echo "CALL InitializeTempVocabularyAndTerm();" | mariadb -D $AppsTempDB -s -b --show-warnings

# Create the NCBI Taxonomy tables.
echo -e "\nCreating NCBI Taxonomy tables"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/CreateNcbiTaxonomyTables.sql

# Populate the temp NCBI Taxonomy tables with data from ictv_apps. Note that the database name is provided
# explicitly in the "Populate" script to avoid accidentally clobbering the NCBI Taxonomy tables in ictv_apps.
START_TIME=$(date +%s)
echo -e "\nPopulating NCBI Taxonomy tables"
mariadb -s -b --show-warnings < ../initialize/PopulateTempNcbiTaxonomyTables.sql
display_elapsed_time "$START_TIME"

# Initializing NCBI term ID columns.
START_TIME=$(date +%s)
echo -e "\nInitializing NCBI term ID columns"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/InitializeNcbiTermIdColumns.sql
echo "CALL InitializeNcbiTermIdColumns();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Create the latest_release_of_ictv_ids table.
echo -e "\nCreating latest_release_of_ictv_ids table"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/CreateLatestReleaseOfIctvIDTable.sql

# Create the searchable_taxon table.
echo -e "\nCreating searchable_taxon table"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/CreateSearchableTaxonTable.sql

# Add views to the ictv_apps_temp database.
echo -e "\nAdding temp views"
mariadb -s -b --show-warnings < ../initialize/AddViewsToIctvAppsTemp.sql

# Add the function "get filtered name".
echo -e "\nAdding GetFilteredName.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < ../functions/GetFilteredName.sql

# Add a stored procedure used when importing records into searchable_taxon.
echo -e "\nAdding ImportSearchableTaxon.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportSearchableTaxon.sql


# Import VMR records (species_isolates).
echo -e "\nImporting latest species isolates (VMR records)"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportLatestSpeciesIsolates.sql
echo "CALL ImportLatestSpeciesIsolates();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import the latest taxonomy_node(_names) corresponding with distinct names in taxonomy_node(_names). 
echo -e "\nImporting latest taxonomy nodes"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportLatestTaxonomyNodes.sql
echo "CALL ImportLatestTaxonomyNodes();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import ICTV species with binomial nomenclature and remove the genus name from the species name.
echo -e "\nImporting ICTV species epithets"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportIctvSpeciesEpithets.sql
echo "CALL ImportIctvSpeciesEpithets();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import scientific names from NCBI Taxonomy.
echo -e "\nImporting NCBI scientific names"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportNcbiScientificNames.sql
echo "CALL ImportNcbiScientificNames();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Initialize NCBI Taxonomy subspecies records before importing them.
echo -e "\nInitializing NCBI subspecies"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/InitializeNcbiSubspecies.sql
echo "CALL InitializeNcbiSubspecies();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import subspecies nodes from NCBI Taxonomy.
echo -e "\nImporting NCBI subspecies nodes"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/ImportNcbiSubspeciesNodes.sql
echo "CALL ImportNcbiSubspeciesNodes();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Update NCBI Taxonomy non-scientific names that are associated with NCBI Taxonomy scientific names
# that have an ICTV taxnode ID assigned.
echo -e "\nUpdating NCBI non-scientific names"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ../initialize/UpdateNcbiNonScientificNames.sql
echo "CALL UpdateNcbiNonScientificNames();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Add the stored procedure that's used to query searchable_taxon.
echo -e "\nAdding QuerySearchableTaxon.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < ../storedProcedures/QuerySearchableTaxon.sql

END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"

