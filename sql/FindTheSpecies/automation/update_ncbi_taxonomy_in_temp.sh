#!/bin/bash
#
# Create and initialize NCBI Taxonomy tables in the ictv_apps_temp database using the 
# latest NCBI Taxonomy dump files.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' ./automation/update_ncbi_taxonomy_in_temp.sh


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

# Make sure the vocabulary and term tables are populated before we start populating 
# the NCBI Taxonomy tables, since the NCBI Taxonomy tables have foreign key relationships to the vocabulary and term tables.
#count=$(mysql -u root mydb \
#  --batch --skip-column-names \
#  -e "CALL get_taxon_count();")
#echo "Taxon count: $count"

# TODO: What vocabularies and terms do we need to have in place before we can populate the NCBI Taxonomy tables? 

# Disable foreign key checks for this session, drop the NCBI tables, and re-enable the foreign key checks.
echo -e "\nDropping the NCBI tables so they can be recreated\n"
echo "SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS ncbi_division; DROP TABLE IF EXISTS ncbi_name; DROP TABLE IF EXISTS ncbi_node; SET FOREIGN_KEY_CHECKS = 1;" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred dropping the NCBI tables\n"
   exit 1
fi

# Recreate the NCBI Taxonomy tables.
echo -e "\nCreating the NCBI Taxonomy tables\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/CreateNcbiTaxonomyTables.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred creating the temp NCBI Taxonomy tables\n"
   exit 1
fi

# Make sure downloadNcbiTaxonomy.py exists.
if [ ! -f "$SCRIPT_DIR/downloadNcbiTaxonomy.py" ]; then
  echo -f "ERROR: missing $SCRIPT_DIR/downloadNcbiTaxonomy.py\n"
  exit 1
fi

# Download the latest NCBI Taxonomy dump files.
echo -e "\nDownloading the latest NCBI Taxonomy dump files\n"
python3 "$SCRIPT_DIR/downloadNcbiTaxonomy.py"
if [ $? -ne 0 ]; then
   echo "An error occurred downloading the NCBI Taxonomy tables\n"
   exit 1
fi

# Populate the temp NCBI Taxonomy tables using the downloaded dump files.
START_TIME=$(date +%s)
echo -e "\nPopulating the temp NCBI Taxonomy tables using dump files.\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/PopulateNcbiFromFiles.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred populating the temp NCBI Taxonomy tables\n"
   exit 1
fi

display_elapsed_time "$START_TIME"

# Initialize the NCBI term ID columns.
START_TIME=$(date +%s)
echo -e "\nInitializing NCBI term ID columns\n"
mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/InitializeNcbiTermIdColumns.sql"
echo "CALL InitializeNcbiTermIdColumns();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred initializing the NCBI term ID columns\n"
   exit 1
fi

display_elapsed_time "$START_TIME"



















