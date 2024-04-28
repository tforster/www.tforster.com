#!/usr/bin/env bash
####################################################################################################################################
# deploy.sh is used, with arguments, to deploy the full stack to either production or preview
#
# Usage: ./scripts/deploy.sh [reminder|app] [stage|prod]
####################################################################################################################################

# Exit immediately if a command exits with a non-zero status
set -o errexit
# Treat unset variables as an error when substituting
set -o nounset
# Fails entire pipeline if any command fails
set -euo pipefail

##
# Description: Simple function to echo out the help message.
##
function help() {
  echo '
Usage
  ./scripts/deploy.sh app [stage|prod]
  or
  npm run deploy app [stage|prod]

  app [stage|prod]: Deploy the app and API to stage or production
  help:             Display this help message
'
  exit 1
}

## 
# Description:  Deploys the app and api as a CloudFlare Pages project. 
# Notes:        - Doppler secrets are synchronised using the Doppler integration for Cloudflare Pages projects
#               - Cloudflare Pages cannot use variables from wrangler.toml. Wrangler.toml is ignored except for local Pages dev
#               - Pages bindings such as D1 and environment variables must be set in the Cloudflare UI
##
function deployApp() {  
  ## Set a default and bound variable
  stage=${2:-default}

  ## Check the argument variable is one of the two allowed, otherwise display help and exit
  if [[ ! $stage =~ ^(stage|prod)$   ]]; then
    help
  fi 

  ## Get the current Git branch 
  currentBranch=$(git rev-parse --abbrev-ref HEAD)

  if [[ $stage = stage ]]; then 
    ## Note "--branch=stage" will force Cloudflare pages to ignore production and use "preview" settings and bindings. 
    npx wrangler pages deploy --project-name=famstat --branch=stage ./dist
    printf "\nPlease allow a few moments for your deployment to complete at https://stage.famstat.pages.dev\n"

  elif [[ $stage = prod && $currentBranch = "main" ]]; then
    npx wrangler pages deploy --project-name=famstat --branch=main ./dist
    printf "\nPlease allow a few moments for your deployment to complete at https://www.famstat.com\n"

  else     
    printf "\nBranch mismatch. You can only deploy the main branch to production.\n"
    exit 1
  fi
}

# Parse the arguments
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  # Display help message
  help

elif [[ "${1-}" = app ]]; then
  deployApp "$@"

else 
  help
fi


