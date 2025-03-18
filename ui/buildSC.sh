#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Sequence Classifier component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Sequence Classifier component \n\n"
"${webpack}" --config "$componentPath/SequenceClassifier/webpack.config.js"

printf "\n\n"


# This can be used to test locally.
#cp ./dist/ICTV_SequenceClassifier.js /c/inetpub/wwwroot/ictvTest/js/
#cp ./css/SequenceClassifier.css /c/inetpub/wwwroot/ictvTest/css/

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_SequenceClassifier.js to ictv_sequence_classifier/assets/js\n\n"

cp ./dist/ICTV_SequenceClassifier.js ../ictv_sequence_classifier/assets/js/

#------------------------------------------------------------------------------
# Copy the Sequence Classifier CSS file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_sequence_classifier/assets/css\n\n"

cp ./css/SequenceClassifier.css ../ictv_sequence_classifier/assets/css/
cp ./css/dataTables.dataTables.min.css ../ictv_sequence_classifier/assets/css/
