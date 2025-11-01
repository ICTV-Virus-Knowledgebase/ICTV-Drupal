#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Member Species Table component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Member Species Table component \n\n"
"${webpack}" --config "$componentPath/MemberSpeciesTable/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_MemberSpeciesTable.js to ictv_member_species_table/assets/js\n\n"

cp ./dist/ICTV_MemberSpeciesTable.js ../ictv_member_species_table/assets/js/

#------------------------------------------------------------------------------
# Copy the Member Species Table CSS files to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_member_species_table/assets/css\n\n"

cp ./css/MemberSpeciesTable.css ../ictv_member_species_table/assets/css/
cp ./css/ICTV.css ../ictv_member_species_table/assets/css/
cp ./css/fa-regular.css ../ictv_member_species_table/assets/css/
cp ./css/fa-solid.css ../ictv_member_species_table/assets/css/
cp ./css/fontawesome.css ../ictv_member_species_table/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_member_species_table/assets/css/
cp ./css/light-border.css ../ictv_member_species_table/assets/css/
cp ./css/tippy.css ../ictv_member_species_table/assets/css/

