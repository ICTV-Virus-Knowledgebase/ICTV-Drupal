#!/usr/bin/env bash
#
# Create a deployment directory and copy the latest scripts to it.
#

# Create a timestamp string.
TIMESTAMP=$(date +%m%d%y_%H%M)

# Use the timestamp to create the directory and zip file names.
DIRECTORY="scripts_$TIMESTAMP"
ZIP_FILE="scripts_$TIMESTAMP.zip"

# Remove the deployment directory if it already exists.
if [ -d "./$DIRECTORY" ]; then
    rm -rf "./$DIRECTORY"
fi

# Create the deployment directory.
mkdir "./$DIRECTORY"
echo -e "Created directory $DIRECTORY\n"


# Copy the initialization scripts to the new deployment directory.
cp ../initialize/AddViewsToIctvApps.sql "./$DIRECTORY/"
cp ../initialize/AddViewsToIctvAppsTemp.sql "./$DIRECTORY/"
cp ../initialize/CreateDiseaseOntologyTable.sql "./$DIRECTORY/"
cp ../initialize/CreateSearchableTaxonTable.sql "./$DIRECTORY/"
cp ../initialize/ImportDiseaseOntologyIntoSearchableTaxon.sql "./$DIRECTORY/"
cp ../initialize/ImportIctvSpeciesEpithets.sql "./$DIRECTORY/"
cp ../initialize/ImportLatestSpeciesIsolates.sql "./$DIRECTORY/"
cp ../initialize/ImportLatestTaxonomyNodes.sql "./$DIRECTORY/"
cp ../initialize/ImportNcbiScientificNames.sql "./$DIRECTORY/"
cp ../initialize/ImportNcbiSubspeciesNodes.sql "./$DIRECTORY/"
cp ../initialize/ImportSearchableTaxon.sql "./$DIRECTORY/"
cp ../initialize/InitializeDiseaseOntology.sql "./$DIRECTORY/"
cp ../initialize/InitializeLatestReleaseOfIctvID.sql "./$DIRECTORY/"
cp ../initialize/InitializeNcbiSubspecies.sql "./$DIRECTORY/"
cp ../initialize/InitializeNcbiTermIdColumns.sql "./$DIRECTORY/"
#cp ../initialize/InitializeTempVocabularyAndTerm.sql "./$DIRECTORY/"
cp ../initialize/PopulateIctvAppsFromTemp.sql "./$DIRECTORY/"
cp ../initialize/UpdateNcbiNonScientificNames.sql "./$DIRECTORY/"
cp ../initialize/UpdateVocabularyAndTerms.sql "./$DIRECTORY/"

# Copy the deployment scripts to the deployment directory.
cp ../automation/update_ictv_apps_temp.sh "./$DIRECTORY/"
cp ../automation/repopulate_ictv_apps.sh "./$DIRECTORY/"

# Copy function(s) to the deployment directory.
cp ../functions/GetFilteredName.sql "./$DIRECTORY/"

# Copy stored procedure(s) to the deployment directory.
cp ../storedProcedures/QuerySearchableTaxon.sql "./$DIRECTORY/"

# Copy the Python code to the deployment directory.
cp ../../../scripts/VirusNameLookup/common.py "./$DIRECTORY/"
cp ../../../scripts/VirusNameLookup/dbSettings.py "./$DIRECTORY/"
cp ../../../scripts/VirusNameLookup/importDiseaseOntology.py "./$DIRECTORY/"

# Copy the disease ontology CSV file to the deployment directory.
cp ../../../data/diseaseOntologyData_021825.csv "./$DIRECTORY/"

# Remove carriage return characters from the scripts.
sed -i 's/\r$//' "./$DIRECTORY/update_ictv_apps_temp.sh"
sed -i 's/\r$//' "./$DIRECTORY/repopulate_ictv_apps.sh"

# Zip the deployment directory.
zip -r "$ZIP_FILE" "./$DIRECTORY"

# Copy the zip file name to the clipboard.
echo -e "$ZIP_FILE" | clip

