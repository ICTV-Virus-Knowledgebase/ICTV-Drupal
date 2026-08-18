#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Find the species component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Find the species component \n\n"
webpackOutput=$("${webpack}" --config "$componentPath/FindTheSpecies/webpack.config.js" 2>&1)
webpackStatus=$?

# Check that the build completed successfully before continuing
if [ $webpackStatus -ne 0 ]; then
   printf "%s\n" "$webpackOutput" >&2
   exit 1
fi

printf "%s\n" "$webpackOutput"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_FindTheSpecies.js to ictv_virus_name_lookup/assets/js\n\n"

cp ./dist/ICTV_FindTheSpecies.js ../ictv_virus_name_lookup/assets/js/

#------------------------------------------------------------------------------
# Copy the CSS files to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_virus_name_lookup/assets/css\n\n"

cp ./css/FindTheSpecies.css ../ictv_virus_name_lookup/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_virus_name_lookup/assets/css/


# Copy JavaScript and CSS files to the "ICTV Find the Species component" module (used on the home page).

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_FindTheSpecies.js to ictv_find_the_species_component/assets/js\n\n"

cp ./dist/ICTV_FindTheSpecies.js ../ictv_find_the_species_component/assets/js/

#------------------------------------------------------------------------------
# Copy the find the species CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_find_the_species_component/assets/css\n"

cp ./css/FindTheSpecies.css ../ictv_find_the_species_component/assets/css/


