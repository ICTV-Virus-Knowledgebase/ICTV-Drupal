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
printf "Building the Taxon Release History component \n\n"
"${webpack}" --config "$componentPath/TaxonReleaseHistory/webpack.config.js"

printf "\n\n"


# This can be used to test locally.
#cp ./dist/ICTV_TaxonReleaseHistory.js /c/inetpub/wwwroot/ictvTest/js/
#cp ./css/TaxonReleaseHistory.css /c/inetpub/wwwroot/ictvTest/css/

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_TaxonReleaseHistory.js to ictv_taxon_history/assets/js\n\n"

cp ./dist/ICTV_TaxonReleaseHistory.js ../ictv_taxon_history/assets/js/

#------------------------------------------------------------------------------
# Copy the Taxon Release History CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_taxon_history/assets/css\n\n"

cp ./css/TaxonHistory.css ../ictv_taxon_history/assets/css/

#cp ./css/ICTV.css ../ictv_taxon_history/assets/css/

