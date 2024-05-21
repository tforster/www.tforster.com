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
  serve help:                         Display this help message
'
  exit 0
}

##
# @Description: Serve the app, aka CloudFlare Pages and Page Functions, on the default port 8788
##
function serveApp() {
  npx wrangler pages dev ./dist \
    --port 8788 \
    --compatibility-date=2023-05-12 \
    --live-reload=true 
}

# Parse the arguments
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  # Display help message
  help

elif [[ "${1-}" =~ app ]]; then
  serveApp

else
  # Default to help
  help
fi
