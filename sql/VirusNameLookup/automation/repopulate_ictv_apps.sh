#!/usr/bin/env bash
#
# Repopulate tables in the ictv_apps database.
#

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

# Add views to the ictv_apps database.
echo -e "\nAdding views"
mariadb -s -b --show-warnings < AddViewsToIctvApps.sql

# Populate the "latest release of ICTV ID" and "searchable taxon" tables in the ictv_apps database 
# with data from the corresponding tables in the ictv_apps_temp database.
echo -e "\nPopulating latest release and searchable taxon tables using ictv_apps_temp"
START_TIME=$(date +%s)
mariadb -D $AppsDB -s -b --show-warnings < PopulateIctvAppsFromTemp.sql
display_elapsed_time "$START_TIME"

# Add the stored procedure that's used to query searchable_taxon.
mariadb -D $AppsDB -s -b --show-warnings < QuerySearchableTaxon.sql


END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"
