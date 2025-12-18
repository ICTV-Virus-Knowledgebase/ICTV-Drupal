#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Taxon Details component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Taxon Details component \n\n"
"${webpack}" --config "$componentPath/TaxonDetails/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy JavaScript files to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxonDetails.js to ictv_taxon_details/assets/js\n\n"

cp ./dist/ICTV_TaxonDetails.js ../ictv_taxon_details/assets/js/

#------------------------------------------------------------------------------
# Copy the Taxon Details CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_taxon_details/assets/css\n\n"

cp ./css/TaxonDetails.css ../ictv_taxon_details/assets/css/
cp ./css/TaxonHistory.css ../ictv_taxon_details/assets/css/
cp ./css/MemberSpeciesTable.css ../ictv_taxon_details/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_taxon_details/assets/css/
