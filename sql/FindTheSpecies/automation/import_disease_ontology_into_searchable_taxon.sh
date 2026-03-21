#!/bin/bash
#
# Import Disease Ontology into the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' ./automation/import_disease_ontology_into_searchable_taxon.sh

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

# Delete all Disease Ontology searchable_taxon records.
echo "DELETE FROM searchable_taxon WHERE taxonomy_db_tid = (SELECT id FROM term WHERE full_key = 'taxonomy_db.disease_ontology');" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings

# TODO: Make sure the disease_ontology table exists and has records!

# Initialize the disease_ontology table by associating records with an ICTV ID and taxnode ID.
# Note that this requires that searchable_taxon has already been populated with ICTV and VMR records!
echo -e "\nInitializing the disease_ontology table\n"
START_TIME=$(date +%s)
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/InitializeDiseaseOntology.sql"
echo "CALL InitializeDiseaseOntology();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred initializing the disease_ontology table\n"
   exit 1
fi

display_elapsed_time "$START_TIME"

# Import disease_ontology records into searchable_taxon.
echo -e "\nImporting disease_ontology records into searchable_taxon\n"
START_TIME=$(date +%s)
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/ImportDiseaseOntologyIntoSearchableTaxon.sql"
echo "CALL ImportDiseaseOntologyIntoSearchableTaxon();" | mariadb -D $APPS_TEMP_DB -s -b --show-warnings
if [ $? -ne 0 ]; then
   echo "An error occurred importing disease_ontology records into searchable_taxon\n"
   exit 1
fi

display_elapsed_time "$START_TIME"