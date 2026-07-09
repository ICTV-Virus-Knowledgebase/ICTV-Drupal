#!/bin/bash
#
# Import the NCBI Taxonomy tables in the ictv_apps_temp database into
# the searchable_taxon table.

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


# Delete any existing NCBI Taxonomy records from searchable_taxon.
echo "DELETE FROM searchable_taxon WHERE taxonomy_db_tid = (SELECT id FROM term WHERE full_key = 'taxonomy_db.ncbi_taxonomy');" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings

#----------------------------------------------------------------------------------------------------------------------
# Import records from NCBI Taxonomy.
#----------------------------------------------------------------------------------------------------------------------
echo -e "\nImporting NCBI Taxonomy records into searchable_taxon\n"
START_TIME=$(date +%s)

mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/ImportNcbiTaxonomy.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred creating the ImportNcbiTaxonomy stored procedure\n"
   exit 1
fi

echo "CALL ImportNcbiTaxonomy();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred importing the NCBI Taxonomy records into searchable_taxon\n"
   exit 1
fi

display_elapsed_time "$START_TIME"

#----------------------------------------------------------------------------------------------------------------------
# Import subspecies nodes from NCBI Taxonomy.
#----------------------------------------------------------------------------------------------------------------------
echo -e "\nImporting NCBI subspecies nodes\n"
START_TIME=$(date +%s)

mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/ImportNcbiSubspeciesNodes.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred creating the ImportNcbiSubspeciesNodes stored procedure\n"
   exit 1
fi

echo "CALL ImportNcbiSubspeciesNodes();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred importing the NCBI subspecies nodes\n"
   exit 1
fi

display_elapsed_time "$START_TIME"

#----------------------------------------------------------------------------------------------------------------------
# Update NCBI Taxonomy non-scientific names that are associated with NCBI Taxonomy scientific names
# that have an ICTV taxnode ID assigned.
#----------------------------------------------------------------------------------------------------------------------
echo -e "\nUpdating NCBI non-scientific names\n"
START_TIME=$(date +%s)

mariadb -D $APPS_TEMP_DB -s -b --show-warnings < "$SQL_DIR/UpdateNcbiNonScientificNames.sql"
if [ $? -ne 0 ]; then
   echo "An error occurred creating the UpdateNcbiNonScientificNames stored procedure\n"
   exit 1
fi

echo "CALL UpdateNcbiNonScientificNames();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred updating the NCBI non-scientific names\n"
   exit 1
fi

display_elapsed_time "$START_TIME"




















