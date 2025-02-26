#!/usr/bin/env bash
#
# Download a zip file from NCBI containing the latest ICTV Taxonomy divisions, names, 
# and nodes as delimited (text) “.dmp” files. Then import the delimited text files into 
# the NCBI database tables (ncbi_division, ncbi_name, ncbi_node).

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' update_ncbi_taxonomy.sh

INITIAL_START_TIME=$(date +%s)

# The ictv_apps_temp database
AppsTempDB="ictv_apps_temp"

# The subdirectory containing the extracted .dmp files.
DmpFilePath="./extracted_files"

# Database connection information.
DbHostname="localhost"
DbUsername=""
DbPassword=""
DbPort="3306"


# Calculate and display elapsed time.
function display_elapsed_time {
   local START_TIME=$1

   END_TIME=$(date +%s)
   ELAPSED_TIME=$((END_TIME - START_TIME))

   MINUTES=$((ELAPSED_TIME / 60))
   SECONDS=$((ELAPSED_TIME % 60))

   echo -e "Execution time: ${MINUTES} minute(s), ${SECONDS} second(s)"
}

# Display usage information.
function usage {
    echo "Usage: $0 -u database_username -p database_password"
    exit 1
}


# Parse input parameters
while getopts ":u:p:" opt; do
    case ${opt} in
        u )
            DbUsername=$OPTARG
            ;;
        p )
            DbPassword=$OPTARG
            ;;
        \? )
            usage
            ;;
    esac
done

# Check if required parameters are provided
if [ -z "$DbUsername" ] || [ -z "$DbPassword" ]; then
    usage
fi


# Download a zip file from NCBI containing the latest ICTV Taxonomy divisions, names, 
# and nodes as delimited (text) “.dmp” files.
START_TIME=$(date +%s)
echo -e "\nDownloading the latest ICTV Taxonomy data"
python3 ./downloadNcbiTaxonomy.py
display_elapsed_time "$START_TIME"


# Import the delimited text files into the NCBI database tables (ncbi_division, ncbi_name, ncbi_node).
START_TIME=$(date +%s)
echo -e "\nImporting into the NCBI database tables"
python3 ./importNcbiTables.py --dbName $AppsTempDB --hostname $DbHostname --password $DbPassword \
   --path $DmpFilePath --port $DbPort --username $DbUsername
display_elapsed_time "$START_TIME"


# Calculate and display the total execution time.
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"

