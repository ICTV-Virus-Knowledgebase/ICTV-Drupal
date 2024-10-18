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
# Virus name lookup
#------------------------------------------------------------------------------
printf "Building the virus name lookup component \n\n"
"${webpack}" --config "$componentPath/VirusNameLookup/webpack.config.js"

printf "\n\n"



