#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Virus Name Lookup component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the virus name lookup component \n\n"
"${webpack}" --config "$componentPath/VirusNameLookup/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_VirusNameLookup.js to ictv_virus_name_lookup/assets/js\n\n"

cp ./dist/ICTV_VirusNameLookup.js ../ictv_virus_name_lookup/assets/js/

#------------------------------------------------------------------------------
# Copy the virus name lookup's CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_virus_name_lookup/assets/css\n"

cp ./css/VirusNameLookup.css ../ictv_virus_name_lookup/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_virus_name_lookup/assets/css/


