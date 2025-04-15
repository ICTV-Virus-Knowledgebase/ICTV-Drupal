#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Taxonomy Browser component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Taxonomy Browser component \n\n"
"${webpack}" --config "$componentPath/TaxonomyBrowser/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxonomyBrowser.js to ictv_taxonomy_browser/assets/js\n\n"

cp ./dist/ICTV_TaxonomyBrowser.js ../ictv_taxonomy_browser/assets/js/

#------------------------------------------------------------------------------
# Copy the Taxonomy Browser CSS file(s) to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS file(s) to ictv_taxonomy_browser/assets/css\n\n"

cp ./css/ICTV.css ../ictv_taxonomy_browser/assets/css/
