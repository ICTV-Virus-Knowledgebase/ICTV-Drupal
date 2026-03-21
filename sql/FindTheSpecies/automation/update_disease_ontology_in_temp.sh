#!/bin/bash
#
# Update the Disease Ontology table in the ictv_apps_temp database using 
# a new version of the diseaseOntologyData.csv file. Note that this doesn't
# update the searchable_taxon table.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' ./automation/update_disease_ontology_in_temp.sh

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

# Make sure the disease_ontology table exists. If not, create it.
echo -e "\nMaking sure the disease_ontology table exists\n"
mariadb -D "$APPS_TEMP_DB" -s -b --show-warnings < "$SQL_DIR/CreateDiseaseOntologyTable.sql"
if [ $? -ne 0 ]; then
  echo -e "An error occurred creating the disease_ontology table\n"
  exit 1
fi

# Make sure the disease ontology CSV file exists.
if [ ! -e "$DISEASE_ONTOLOGY_FILENAME" ]; then
   echo -e "The file $DISEASE_ONTOLOGY_FILENAME does not exist\n"
   exit 1
else
   echo -e "\nVerified that the disease ontology CSV file exists\n"
fi

# Make sure importDiseaseOntology.py exists.
if [ ! -f "$SCRIPT_DIR/importDiseaseOntology.py" ]; then
  echo -f "ERROR: missing $SCRIPT_DIR/importDiseaseOntology.py\n"
  exit 1
fi

# Import the Disease Ontology CSV file into the disease_ontology table. Note that this 
# truncates the table before importing new records.
echo -e "\nImporting disease_ontology data from $DISEASE_ONTOLOGY_FILENAME\n"
START_TIME=$(date +%s)
python3 "$SCRIPT_DIR/importDiseaseOntology.py" --dbName $APPS_TEMP_DB --filename $DISEASE_ONTOLOGY_FILENAME \
   --hostname $DB_HOSTNAME --password $DB_PASSWORD --port $DB_PORT --username $DB_USERNAME

display_elapsed_time "$START_TIME"
