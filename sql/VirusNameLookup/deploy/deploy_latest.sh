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
cp ../initialize/CreateLatestReleaseOfIctvIDTable.sql "./$DIRECTORY/"
cp ../initialize/CreateNcbiTaxonomyTables.sql "./$DIRECTORY/"
cp ../initialize/CreateSearchableTaxonTable.sql "./$DIRECTORY/"
cp ../initialize/CreateTermTable.sql "./$DIRECTORY/"
cp ../initialize/CreateVocabularyTable.sql "./$DIRECTORY/"
cp ../initialize/ImportIctvSpeciesEpithets.sql "./$DIRECTORY/"
cp ../initialize/ImportLatestSpeciesIsolates.sql "./$DIRECTORY/"
cp ../initialize/ImportLatestTaxonomyNodes.sql "./$DIRECTORY/"
cp ../initialize/ImportNcbiScientificNames.sql "./$DIRECTORY/"
cp ../initialize/ImportNcbiSubspeciesNodes.sql "./$DIRECTORY/"
cp ../initialize/ImportSearchableTaxon.sql "./$DIRECTORY/"
cp ../initialize/InitializeLatestReleaseOfIctvID.sql "./$DIRECTORY/"
cp ../initialize/InitializeNcbiSubspecies.sql "./$DIRECTORY/"
cp ../initialize/InitializeNcbiTermIdColumns.sql "./$DIRECTORY/"
cp ../initialize/InitializeTempVocabularyAndTerm.sql "./$DIRECTORY/"
cp ../initialize/InitializeVocabularyAndTerms.sql "./$DIRECTORY/"
cp ../initialize/PopulateIctvAppsFromTemp.sql "./$DIRECTORY/"
cp ../initialize/PopulateTempNcbiTaxonomyTables.sql "./$DIRECTORY/"
cp ../initialize/UpdateNcbiNonScientificNames.sql "./$DIRECTORY/"

# Copy the deployment scripts to the deployment directory.
cp ../automation/create_and_initialize_ictv_apps_temp.sh "./$DIRECTORY/"
cp ../automation/repopulate_ictv_apps.sh "./$DIRECTORY/"

# Copy function(s) to the deployment directory.
cp ../functions/GetFilteredName.sql "./$DIRECTORY/"

# Copy stored procedure(s) to the deployment directory.
cp ../storedProcedures/QuerySearchableTaxon.sql "./$DIRECTORY/"

# Remove carriage return characters from the scripts.
sed -i 's/\r$//' "./$DIRECTORY/create_and_initialize_ictv_apps_temp.sh"
sed -i 's/\r$//' "./$DIRECTORY/repopulate_ictv_apps.sh"

# Zip the deployment directory.
zip -r "$ZIP_FILE" "./$DIRECTORY"

# Copy the zip file name to the clipboard.
echo -e "$ZIP_FILE" | clip

