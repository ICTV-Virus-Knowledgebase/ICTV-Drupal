#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Taxon Release History component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Taxon History component \n\n"
"${webpack}" --config "$componentPath/TaxonHistory/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxonHistory.js to ictv_taxon_history/assets/js\n\n"

cp ./dist/ICTV_TaxonHistory.js ../ictv_taxon_history/assets/js/

#------------------------------------------------------------------------------
# Copy the Taxon History CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_taxon_history/assets/css\n\n"

cp ./css/TaxonHistory.css ../ictv_taxon_history/assets/css/
