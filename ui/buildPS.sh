#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack for the Proposal Submission component.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Build the TypeScript component.
#------------------------------------------------------------------------------
printf "Building the Proposal Submission component \n\n"
"${webpack}" --config "$componentPath/ProposalSubmission/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Copy the generated JavaScript file to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying ICTV_ProposalSubmission.js to ictv_proposal_submission/assets/js\n\n"

cp ./dist/ICTV_ProposalSubmission.js ../ictv_proposal_submission/assets/js/

#------------------------------------------------------------------------------
# Copy the Proposal Submission CSS files to the module's asset directory.
#------------------------------------------------------------------------------
printf "Copying CSS files to ictv_proposal_submission/assets/css\n\n"

cp ./css/ProposalSubmission.css ../ictv_proposal_submission/assets/css/
