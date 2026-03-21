#!/bin/bash
#
# Set environment variables used by other scripts.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' set_env_vars.sh

echo -e "Setting environment variables\n"

# Let other scripts know that this script has been sourced. Other scripts
# that use these environment variables need to source this script if 
# ENV_VARS_LOADED is undefined.
ENV_VARS_LOADED=1

# The ictv_apps and ictv_apps_temp databases
APPS_DB="ictv_apps"
APPS_TEMP_DB="ictv_apps_temp"

# Database connection information.
DB_HOSTNAME="127.0.0.1"
DB_USERNAME=""
DB_PASSWORD=""
DB_PORT="3306"

# The FindTheSpecies directory (under /sql in ICTV-Drupal).
FTS_HOME="."

# The automation directory
AUTOMATION_DIR="$FTS_HOME/automation"

# Data directory
DATA_DIR="$FTS_HOME/data"

# Python scripts directory
SCRIPT_DIR="$FTS_HOME/scripts"

# Directory for stored procedures, views, and SQL scripts used by ictv_apps_temp.
SQL_DIR="$FTS_HOME"

# The disease_ontology data file.
DISEASE_ONTOLOGY_FILENAME="$DATA_DIR/diseaseOntologyData.csv"


#------------------------------------------------------------------------------------------------------------------
# Calculate and display elapsed time.
#------------------------------------------------------------------------------------------------------------------
function display_elapsed_time {
   local START_TIME=$1

   END_TIME=$(date +%s)
   ELAPSED_TIME=$((END_TIME - START_TIME))

   MINUTES=$((ELAPSED_TIME / 60))
   SECONDS=$((ELAPSED_TIME % 60))

   echo -e "Execution time: ${MINUTES} minute(s), ${SECONDS} second(s)"
}

#------------------------------------------------------------------------------------------------------------------
# Print the environment variables and their values to stdout.
#------------------------------------------------------------------------------------------------------------------
function display_env_vars {
   echo -e "-------------------------------------------------------------------\n"
   echo -e "FtS environment variables:\n"
   echo -e "\tAPPS_DB = $APPS_DB\n"
   echo -e "\tAPPS_TEMP_DB = $APPS_TEMP_DB\n"
   echo -e "\tAUTOMATION_DIR = $AUTOMATION_DIR\n"
   echo -e "\tDB_HOSTNAME = $DB_HOSTNAME\n"
   echo -e "\tDISEASE_ONTOLOGY_FILENAME = $DISEASE_ONTOLOGY_FILENAME\n"
   echo -e "\tFTS_HOME = $FTS_HOME\n"
   echo -e "\tDATA_DIR = $DATA_DIR\n"
   echo -e "\tSCRIPT_DIR = $SCRIPT_DIR\n"
   echo -e "\tSQL_DIR = $SQL_DIR\n"
   echo -e "-------------------------------------------------------------------\n"
}




