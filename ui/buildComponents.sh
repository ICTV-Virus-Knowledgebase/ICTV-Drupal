#!/usr/bin/env sh

# https://devhints.io/bash

#------------------------------------------------------------------------------
# Run webpack in all component directories.
#------------------------------------------------------------------------------

# The subdirectory for ICTV components.
componentPath="src/components"

# The relative path to the webpack executable.
webpack="node_modules/.bin/webpack"

printf "\n"

#------------------------------------------------------------------------------
# Member species table
#------------------------------------------------------------------------------
printf "Building the member species table component \n\n"
"${webpack}" --config "$componentPath/MemberSpeciesTable/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Proposal submission
#------------------------------------------------------------------------------
printf "Building the proposal submission component \n\n"
"${webpack}" --config "$componentPath/ProposalSubmission/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Sequence classifier
#------------------------------------------------------------------------------
printf "Building the sequence classifier component \n\n"
"${webpack}" --config "$componentPath/SequenceClassifier/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Taxonomy browser
#------------------------------------------------------------------------------
printf "Building the taxonomy browser component \n\n"
"${webpack}" --config "$componentPath/TaxonomyBrowser/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Taxon release history
#------------------------------------------------------------------------------
printf "Building the taxon release history component \n\n"
"${webpack}" --config "$componentPath/TaxonReleaseHistory/webpack.config.js"

printf "\n\n"

#------------------------------------------------------------------------------
# Virus name lookup
#------------------------------------------------------------------------------
printf "Building the virus name lookup component \n\n"
"${webpack}" --config "$componentPath/VirusNameLookup/webpack.config.js"

printf "\n\n"



