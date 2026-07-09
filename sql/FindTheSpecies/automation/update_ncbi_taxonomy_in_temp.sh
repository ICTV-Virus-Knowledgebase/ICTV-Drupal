#!/bin/bash
#
# Create and initialize NCBI Taxonomy tables in the ictv_apps_temp database using the latest 
# NCBI Taxonomy dump files. When this script completes, the NCBI Taxonomy tables will have 
# been updated with the latest data and the custom term ID columns will have been initialized.
#

# Make sure the script is run from the FindTheSpecies directory.
CURRENT_DIR_NAME=$(basename "$(pwd)")
if [ "$CURRENT_DIR_NAME" != "FindTheSpecies" ]; then
   echo -e "This script should be run in the FindTheSpecies directory\n"
   exit 1
fi

# Make sure the environment variables have been set.
if [ -z "${ENV_VARS_LOADED+x}" ]; then
   echo -e "About to source set_env_vars.sh\n"
   source "./automation/set_env_vars.sh"

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
            echo -e "Usage: $0 -u <database username> -p <database password>\n"
            exit 1
            ;;
      esac
   done
fi

# Validate DB credentials
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
   echo -e "Usage: $0 -u <database username> -p <database password>\n"
   exit 1
fi

# Uncomment to print the environment variables and their values to stdout.
#display_env_vars

# TODO: What vocabularies and terms do we need to have in place before we can populate the NCBI Taxonomy tables? 
# Might be a good idea to verify their existence.

# Keep track of the script's start time so we can display the total elapsed time when the script completes.
SCRIPT_START_TIME=$(date +%s)

# Disable foreign key checks for this session, remove all data from the NCBI tables, and re-enable the foreign key checks.
echo -e "Truncating the NCBI tables so they can be repopulated\n"
echo "SET FOREIGN_KEY_CHECKS = 0; 
      TRUNCATE TABLE ncbi_division; 
      TRUNCATE TABLE ncbi_name; 
      TRUNCATE TABLE ncbi_node; 
      SET FOREIGN_KEY_CHECKS = 1;" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred truncating the NCBI tables\n"
   exit 1
fi

# Make sure downloadNcbiTaxonomy.py exists.
if [ ! -f "$SCRIPT_DIR/downloadNcbiTaxonomy.py" ]; then
  echo -f "ERROR: missing $SCRIPT_DIR/downloadNcbiTaxonomy.py\n"
  exit 1
fi

# Download the latest NCBI Taxonomy dump files.
echo -e "Downloading the latest NCBI Taxonomy dump files\n"
python3 "$SCRIPT_DIR/downloadNcbiTaxonomy.py"
if [ $? -ne 0 ]; then
   echo "An error occurred downloading the NCBI Taxonomy tables\n"
   exit 1
fi

# Populate the temp NCBI Taxonomy tables using the downloaded dump files.
START_TIME=$(date +%s)
echo -e "Populating the temp NCBI Taxonomy tables using dump files.\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/PopulateNcbiFromFiles.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred populating the temp NCBI Taxonomy tables\n"
   exit 1
fi

display_elapsed_time "$START_TIME"

# Initialize the NCBI term ID columns.
START_TIME=$(date +%s)
echo -e "Initializing NCBI term ID columns\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/InitializeNcbiTermIdColumns.sql"
echo "CALL InitializeNcbiTermIdColumns();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred initializing the NCBI term ID columns\n"
   exit 1
fi

display_elapsed_time "$START_TIME"


# For all NCBI subspecies nodes, try to update ncbi_node.subspecies_parent_tax_id (a custom column)  
# with the lowest level parent taxon that has a rank of species or above. 
START_TIME=$(date +%s)
echo -e "Initializing NCBI subspecies records\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/InitializeNcbiSubspecies.sql"
echo "CALL InitializeNcbiSubspecies();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred initializing the NCBI subspecies records\n"
   exit 1
fi

display_elapsed_time "$START_TIME"


# Calculate and display the total elapsed time for this script.
SCRIPT_END_TIME=$(date +%s)
SCRIPT_ELAPSED_TIME=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

SCRIPT_MINUTES=$((SCRIPT_ELAPSED_TIME / 60))
SCRIPT_SECONDS=$((SCRIPT_ELAPSED_TIME % 60))

echo -e "update_ncbi_taxonomy_in_temp.sh completed after ${SCRIPT_MINUTES} minute(s), ${SCRIPT_SECONDS} second(s)"

















