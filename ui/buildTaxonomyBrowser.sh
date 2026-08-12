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

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxonomyBrowser.js to ictv_taxonomy_browser/assets/js\n\n"
cp ./dist/ICTV_TaxonomyBrowser.js ../ictv_taxonomy_browser/assets/js/

printf "Copying ICTV_TaxonomyBrowser.js to ictv_release_history_taxonomy_browser/assets/js\n\n"
cp ./dist/ICTV_TaxonomyBrowser.js ../ictv_release_history_taxonomy_browser/assets/js/

#------------------------------------------------------------------------------
# Copy the Taxonomy Browser CSS file(s) to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS file(s) to ictv_taxonomy_browser/assets/css\n\n"

#cp ./css/ICTV.css ../ictv_taxonomy_browser/assets/css/
cp ./css/TaxonomyBrowser.css ../ictv_taxonomy_browser/assets/css/

printf "Copying CSS file(s) to ictv_release_history_taxonomy_browser/assets/css\n\n"

cp ./css/ICTV.css ../ictv_release_history_taxonomy_browser/assets/css/
# dmd 110125 cp ./css/TaxonomyBrowser.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/fa-regular.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/fa-solid.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/fontawesome.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/light-border.css ../ictv_release_history_taxonomy_browser/assets/css/
cp ./css/tippy.css ../ictv_release_history_taxonomy_browser/assets/css/
