#!/usr/bin/env bash
####################################################################################################################################
# serve.sh is used, with arguments, to serve various developer tools and apps
#
# Usage: ./scripts/serve/serve.sh [app|oas|sql|help]
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
  serve app:                          Serve the web app and API on port 8788
  serve rem:                          Serve the reminder scheduled worker on port 8787
  serve oas:                          serve the Open API Specification via Swagger on port 9080
  serve sql:                          serve the SQLite CLI
  serve help:                         Display this help message
'
  exit 0
}

## Set the version of Node that we know works
pinnedNodeVersion=v21.6.2

##
# @Description: Checks the version of Node and if it does not match pinnedNodeVersion, uses NVM to set pinnedNodeVersion
##
function checkNode() {
  currentNodeVersion=$(node -v)
  if [[ $currentNodeVersion != $pinnedNodeVersion ]]; then
    printf "WARNING: Expected Node $pinnedNodeVersion but found $currentNodeVersion\n"
    . ${NVM_DIR}/nvm.sh && nvm use $pinnedNodeVersion    
    printf "\n"
  fi
}

##
# @Description: Serve the app, aka CloudFlare Pages and Page Functions, on the default port 8788
##
function serveApp() {
  checkNode
  # Check if a local env file is present to override Doppler
  [ -f .dev.vars ] && export $(cat .dev.vars)
  # Serve the app and bind the variables, falling back to Doppler values
  npx wrangler pages dev ./dist \
    --port 8788 \
    --compatibility-date=2023-05-12 \
    --live-reload=true \
    --binding KINDE_JWKS="${KINDE_JWKS:-$(doppler secrets get KINDE_JWKS --plain)}" \
    --binding KINDE_DOMAIN="${KINDE_DOMAIN:-$(doppler secrets get KINDE_DOMAIN --plain)}" \
    --binding KINDE_API_AUDIENCE="${KINDE_API_AUDIENCE:-$(doppler secrets get KINDE_API_AUDIENCE --plain)}" \
    --binding SENDGRID_TOKEN="${SENDGRID_TOKEN:-$(doppler secrets get SENDGRID_TOKEN --plain)}" \
    --binding INVITATION_SECRET="${INVITATION_SECRET:-$(doppler secrets get INVITATION_SECRET --plain)}" \
    --binding FAMSTAT_PUSH_PRIVATE_KEY="${FAMSTAT_PUSH_PRIVATE_KEY:-$(doppler secrets get FAMSTAT_PUSH_PRIVATE_KEY --plain)}"
}

##
# @Description: Serves the CloudFlare worker that implements the reminder service, on the default port 8787
##
function serveReminder() {
  checkNode
  npx wrangler dev --test-scheduled  ./services/reminder/api.js \
    --compatibility-date=2023-05-12 \
    --live-reload=true \
    --env=dev \
    --var KINDE_JWKS:$(doppler secrets get KINDE_JWKS --plain) \
    KINDE_DOMAIN:$(doppler secrets get KINDE_DOMAIN --plain) \
    KINDE_API_AUDIENCE:$(doppler secrets get KINDE_API_AUDIENCE --plain) \
    SENDGRID_TOKEN:$(doppler secrets get SENDGRID_TOKEN --plain) \
    INVITATION_SECRET:$(doppler secrets get INVITATION_SECRET --plain) \
    FAMSTAT_PUSH_PRIVATE_KEY:$(doppler secrets get FAMSTAT_PUSH_PRIVATE_KEY --plain)
}

##
# @Description: Serves a minimal Swagger UI and the latest openapi.yaml on port 9080
##
function serveOas() {
  echo "Note: Running 'npm run build oas' is recommended to ensure the latest OAS file is available."
  npx static-server scripts/serve
}

##
# @Description: Serves the SQLite 3 CLI with the current dev database as default
##
function serveSql() {
  ## TODO: dynamically obtain the database name from wrangler.toml
  sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7352547963de7050bd7d94658afc4fe78b61811b7815da12d90be8e863abf4d.sqlite
}

# Parse the arguments
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  # Display help message
  help

elif [[ "${1-}" =~ app ]]; then
  serveApp

elif [[ "${1-}" =~ oas ]]; then
  serveOas

elif [[ "${1-}" =~ rem ]]; then
  serveReminder

elif [[ "${1-}" =~ sql ]]; then
  serveSql

else
  # Default to help
  help
fi
