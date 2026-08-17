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

# Check that the build completed successfully before continuing
if [ $? -ne 0 ]; then
   exit 1
fi

printf "\n\n"

#------------------------------------------------------------------------------------------------------------
# Copy the JavaScript and CSS files to the asset directories.
#------------------------------------------------------------------------------------------------------------
printf "Copying ICTV_TaxonomyBrowser.js to ictv_taxonomy_browser/assets/js\n\n"
cp ./dist/ICTV_TaxonomyBrowser.js ../ictv_taxonomy_browser/assets/js/

printf "Copying CSS files to ictv_taxonomy_browser/assets/css\n\n"
cp ./css/TaxonomyBrowser.css ../ictv_taxonomy_browser/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_taxonomy_browser/assets/css/
cp ./css/tippy.css ../ictv_taxonomy_browser/assets/css/
cp ./css/light-border.css ../ictv_taxonomy_browser/assets/css/
