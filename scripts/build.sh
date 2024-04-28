#!/usr/bin/env bash
####################################################################################################################################
# build.sh is used, with arguments, to build individually the app, OAS, or both.
#
# Usage: ./scripts/build/build.sh [app[watch]|oas|all|help]
####################################################################################################################################

# Exit immediately if a command exits with a non-zero status
set -o errexit
# Treat unset variables as an error when substituting
set -o nounset
# Fails entire pipeline if any command fails
set -euo pipefail

# Simple function to echo out the help message.
function help() {
  echo '
Commands:
  build app [watch]:                  Build the web app and optionally watch for changes
  build oas:                          Build the Open API Specification schema
  build all:                          Build all the things
  build help:                         Display this help message
'
  exit 0
}

function buildOas() {
  # Build the JSON OAS file using the APIDevTools Swagger CLI
  npx @apidevtools/swagger-cli bundle docs/oas/openapi.yaml -o api/openapi.json
  # Validate the resulting file
  npx @apidevtools/swagger-cli validate api/openapi.json
  # Create a YAML version of the OAS file
  docker run -i --rm mikefarah/yq -p=json <api/openapi.json >api/openapi.yaml
  # Sort the components/schemas section of the OAS file to make it easier to read in StopLight, Swagger, etc
  docker run -i --rm mikefarah/yq '.components.schemas |= sort_keys(.)' <api/openapi.yaml >api/openapi.sorted.yaml
  # Replace the original YAML file with the sorted one
  cp api/openapi.sorted.yaml api/openapi.yaml
  # Remove the sorted YAML file
  rm api/openapi.sorted.yaml
  # Copy the JSON version to the static server folder for Swagger viewing
  cp api/openapi.json scripts/serve
}

function buildWebApp() {
  # Parse the argument
  if [[ "${1-}" = stage ]]; then
    # Set the Doppler config to preview (fka stage)
    DOPPLER_CONFIG=stage

  elif [[ "${1-}" = prod ]]; then
    # Set the Doppler config to production
    DOPPLER_CONFIG=prod

  elif [[ "${1-}" = dev ]]; then
    # Set the Doppler config to development
    DOPPLER_CONFIG=dev

  else
    # Default to development - Note this option allows for $1 = watch instead
    printf "WARNING: The stage $1 was not found. Defaulting to dev.\n\n"
    DOPPLER_CONFIG=dev
  fi

  # Run Gilbert to compile the web app, including the environment specific config.js file - optionally watching for changes
  if [[ "${1-}" =~ watch ]]; then
    # Watch for changes and build each time
    node --watch-path ./src --watch-path ./cms scripts/build.js
  else
    # Build once
    node scripts/build.js
  fi
}

# Parse the arguments
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  help

elif [[ "${1-}" =~ oas ]]; then
  buildOas

elif [[ "${1-}" =~ app ]]; then
  buildWebApp "${2-}"

elif [[ "${1-}" = all ]]; then
  buildOas
  buildWebApp

else
  # Default to help
  help
fi
