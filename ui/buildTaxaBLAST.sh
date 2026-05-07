#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the TaxaBLAST component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the TaxaBLAST component \n\n"
"${webpack}" --config "$componentPath/TaxaBLAST/webpack.config.js"

# Check that the build completed successfully before continuing
if [ $? -ne 0 ]; then
   exit 1
fi

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxaBLAST.js to ictv_taxablast_ui/assets/js\n\n"

cp ./dist/ICTV_TaxaBLAST.js ../ictv_taxablast_ui/assets/js/

#------------------------------------------------------------------------------
# Copy the TaxaBLAST CSS files to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_taxablast_ui/assets/css\n\n"

cp ./css/TaxaBLAST.css ../ictv_taxablast_ui/assets/css/
cp ./css/tippy.css ../ictv_taxablast_ui/assets/css/
cp ./css/ictv_common.css ../ictv_taxablast_ui/assets/css/
