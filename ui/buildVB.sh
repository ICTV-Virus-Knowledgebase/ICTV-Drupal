#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Visual Browser component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Visual Browser component \n\n"
"${webpack}" --config "$componentPath/VisualBrowser/webpack.config.js"

printf "\n\n"


# This is temporary...
cp ./dist/ICTV_VisualBrowser.js /c/inetpub/wwwroot/ictvTest/js/
cp ./css/VisualBrowser.css /c/inetpub/wwwroot/ictvTest/css/

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
#printf "Copying ICTV_CuratedNameManager.js to ictv_curated_name_manager/assets/js\n\n"

#cp ./dist/ICTV_CuratedNameManager.js ../ictv_curated_name_manager/assets/js/

#------------------------------------------------------------------------------
# Copy the Curated Name Manager CSS file to the module's asset directory.
#------------------------------------------------------------------------------
#printf "Copying CSS files to ictv_curated_name_manager/assets/css\n\n"

#cp ./css/CuratedNameManager.css ../ictv_curated_name_manager/assets/css/
#cp ./css/dataTables.dataTables.min.css ../ictv_curated_name_manager/assets/css/
