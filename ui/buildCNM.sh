#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Curated Name Manager component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Curated Name Manager component \n\n"
"${webpack}" --config "$componentPath/CuratedNameManager/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_CuratedNameManager.js to ictv_curated_name_manager/assets/js\n\n"

cp ./dist/ICTV_CuratedNameManager.js ../ictv_curated_name_manager/assets/js/

#------------------------------------------------------------------------------
# Copy the Curated Name Manager CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_curated_name_manager/assets/css\n\n"

cp ./css/CuratedNameManager.css ../ictv_curated_name_manager/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_curated_name_manager/assets/css/
