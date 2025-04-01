#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Sequence Search component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Sequence Search component \n\n"
"${webpack}" --config "$componentPath/SequenceSearch/webpack.config.js"

printf "\n\n"


# This can be used to test locally.
#cp ./dist/ICTV_SequenceSearch.js /c/inetpub/wwwroot/ictvTest/js/
#cp ./css/SequenceSearch.css /c/inetpub/wwwroot/ictvTest/css/

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_SequenceSearch.js to ictv_seqsearch_ui/assets/js\n\n"

cp ./dist/ICTV_SequenceSearch.js ../ictv_seqsearch_ui/assets/js/

#------------------------------------------------------------------------------
# Copy the Sequence Search CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_seqsearch_ui/assets/css\n\n"

cp ./css/SequenceSearch.css ../ictv_seqsearch_ui/assets/css/
