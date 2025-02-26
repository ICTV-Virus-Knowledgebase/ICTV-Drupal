#!/usr/bin/env bash
#
# Update tables in the ictv_apps_temp database.
#

# Here's how to remove the carriage return characters from this script:
# sed -i 's/\r$//' update_ictv_apps_temp.sh

INITIAL_START_TIME=$(date +%s)

# The ictv_apps_temp database
AppsTempDB="ictv_apps_temp"

# Database connection information.
DbHostname="localhost"
DbUsername=""
DbPassword=""
DbPort="3306"

# The disease_ontology data file.
DiseaseOntologyFilename="diseaseOntologyData_021825.csv"


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


#------------------------------------------------------------------------------------------------------------------
# Create tables and update views, stored procedures, and functions.
#------------------------------------------------------------------------------------------------------------------

# Create the disease_ontology table.
echo -e "\nCreating disease_ontology table"
mariadb -D $AppsTempDB -s -b --show-warnings < CreateDiseaseOntologyTable.sql

# Add views that reference the ictv_taxonomy database.
echo -e "\nAdding temp views that reference the ictv_taxonomy database"
mariadb -s -b --show-warnings < AddViewsToIctvAppsTemp.sql


#------------------------------------------------------------------------------------------------------------------
# Update the vocabulary and term tables with new data.
#------------------------------------------------------------------------------------------------------------------
START_TIME=$(date +%s)
echo -e "\nUpdating vocabulary and term tables"
mariadb -D $AppsTempDB -s -b --show-warnings < UpdateVocabularyAndTerms.sql
echo "CALL UpdateVocabularyAndTerms();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Update the searchable_taxon table.
#------------------------------------------------------------------------------------------------------------------

# Delete records from the searchable_taxon table.
echo "DELETE FROM searchable_taxon;" | mariadb -D $AppsTempDB -s -b --show-warnings

# Add a new column to the searchable_taxon table.
START_TIME=$(date +%s)
echo -e "\nAdding a new column to the searchable_taxon table"
echo "ALTER TABLE searchable_taxon ADD COLUMN IF NOT EXISTS alternate_id VARCHAR(100) NULL;" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Update stored procedures and user-defined functions.
#------------------------------------------------------------------------------------------------------------------

# Add the function "get filtered name".
echo -e "\nAdding GetFilteredName.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < GetFilteredName.sql

# Add the stored procedure used to import records into searchable_taxon.
echo -e "\nAdding ImportSearchableTaxon.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < ImportSearchableTaxon.sql

# Add the stored procedure that searches searchable_taxon.
echo -e "\nAdding QuerySearchableTaxon.sql"
mariadb -D $AppsTempDB -s -b --show-warnings < QuerySearchableTaxon.sql


#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with ICTV data.
#------------------------------------------------------------------------------------------------------------------

# Populate the latest_release_of_ictv_ids table.
echo -e "\nPopulating the latest_release_of_ictv_ids table"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < InitializeLatestReleaseOfIctvID.sql
display_elapsed_time "$START_TIME"

# Import VMR records (species_isolates).
echo -e "\nImporting VMR records (species_isolates)"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportLatestSpeciesIsolates.sql
echo "CALL ImportLatestSpeciesIsolates();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import the latest taxonomy_node records corresponding with distinct names in taxonomy_node. 
echo -e "\nImporting the latest taxonomy nodes"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportLatestTaxonomyNodes.sql
echo "CALL ImportLatestTaxonomyNodes();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import ICTV species with binomial nomenclature and remove the genus name from the species name.
echo -e "\nImporting ICTV species epithets"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportIctvSpeciesEpithets.sql
echo "CALL ImportIctvSpeciesEpithets();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with NCBI data.
#------------------------------------------------------------------------------------------------------------------

# Initialize NCBI term ID columns for divisions, name classes, and rank names.
# Note: This could be done in update_ncbi_taxonomy.sh but is included here in case any new terms have been added.
START_TIME=$(date +%s)
echo -e "\nInitializing NCBI term ID columns"
mariadb -D $AppsTempDB -s -b --show-warnings < InitializeNcbiTermIdColumns.sql
echo "CALL InitializeNcbiTermIdColumns();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import NCBI scientific names into searchable_taxon
echo -e "\nImporting NCBI scientific names"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportNcbiScientificNames.sql
echo "CALL ImportNcbiScientificNames();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Initialize NCBI sub-species records before they are imported.
echo -e "\nInitializing NCBI sub-species"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < InitializeNcbiSubspecies.sql
echo "CALL InitializeNcbiSubspecies();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import NCBI sub-species records into searchable_taxon.
echo -e "\nImporting NCBI sub-species records"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportNcbiSubspeciesNodes.sql
echo "CALL ImportNcbiSubspeciesNodes();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Update NCBI Taxonomy non-scientific names that are associated with NCBI Taxonomy scientific names
# that have an ICTV taxnode ID assigned.
echo -e "\nUpdating NCBI non-scientific names"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < UpdateNcbiNonScientificNames.sql
echo "CALL UpdateNcbiNonScientificNames();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"


#------------------------------------------------------------------------------------------------------------------
# Populate searchable_taxon with Disease Ontology data.
#------------------------------------------------------------------------------------------------------------------

# Import the Disease Ontology CSV file into the disease_ontology table
echo -e "\nImporting disease_ontology data from $DiseaseOntologyFilename"
START_TIME=$(date +%s)
python3 ./importDiseaseOntology.py --dbName $AppsTempDB --filename $DiseaseOntologyFilename \
    --hostname $DbHostname --password $DbPassword --port $DbPort --username $DbUsername
display_elapsed_time "$START_TIME"

# Initialize the disease_ontology table by associating records with an ICTV ID and taxnode ID.
echo -e "\nInitializing the disease_ontology table"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < InitializeDiseaseOntology.sql
echo "CALL InitializeDiseaseOntology();" | mariadb -D $AppsTempDB -s -b --show-warnings
display_elapsed_time "$START_TIME"

# Import disease_ontology records into searchable_taxon.
echo -e "\nImporting disease_ontology records into searchable_taxon"
START_TIME=$(date +%s)
mariadb -D $AppsTempDB -s -b --show-warnings < ImportDiseaseOntologyIntoSearchableTaxon.sql
echo "CALL ImportDiseaseOntologyIntoSearchableTaxon();" | mariadb -D $AppsTempDB -s -b --show-warnings


#------------------------------------------------------------------------------------------------------------------
# Calculate and display the total execution time.
#------------------------------------------------------------------------------------------------------------------
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - INITIAL_START_TIME))

MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

echo -e "\nTotal execution time: ${MINUTES} minutes, ${SECONDS} seconds"

