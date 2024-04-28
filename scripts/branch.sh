#!/usr/bin/env bash
#########################################################################################################################
# branch.sh is used, with arguments, to create a new branch from main that uses a slugified ADO ticket number and title #
#########################################################################################################################

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
  branch "{number} {title}"           Create a new Git branch with the ADO ticket number and title. Double quotes not required but recommended.
  api help:                           Display this help message
'
  exit 0
}

# Help keep us branching from main
gitBranch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$gitBranch" != "main" ]]; then
  echo "Please create feature branches from main."
  exit 1
fi

# Parse the arguments as input into the git branch command
git checkout -b $(echo "$@" | iconv -t ascii//TRANSLIT | sed -r 's/[~\^]+//g' | sed -r 's/[^a-zA-Z0-9]+/-/g' | sed -r 's/^-+\|-+$//g' | sed -r 's/-$//g' | tr A-Z a-z)
