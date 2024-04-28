#!/usr/bin/env bash
####################################################################################################################################
# build.sh is used, with arguments, to build individually the app, OAS, or both.
#
# Usage: ./scripts/test.sh [auth|user|family|families|all|help]
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
  test auth                           Run authentication and authorisation tests
  test user:                          Run user tests
  test family:                        Run family tests
  test families:                      Run families tests
  test notifications:                 Run push notification tests
  test reminders:                     Run scheduled Reminder tests
  test all:                           Run all tests
  test help:                          Display this help message
'
  exit 0
}

testAuth() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/auth-tests.js
}

testUser() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/user-tests.js
}

testFamily() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/family-tests.js
}

testFamilies() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/families-tests.js
}

testNotifications() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/notification-tests.js
}

testReminders() {
  doppler run --mount test.env -c dev_personal -- node --test --test-reporter spec --env-file test.env tests/reminder-tests.js
}

# Parse the arguments
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  help

elif [[ "${1-}" =~ auth ]]; then
  testAuth

elif [[ "${1-}" =~ user ]]; then
  testUser

elif [[ "${1-}" =~ family ]]; then
  testFamily

elif [[ "${1-}" =~ families ]]; then
  testFamilies

elif [[ "${1-}" =~ notifications ]]; then
  testNotifications

elif [[ "${1-}" =~ reminders ]]; then
  testReminders

elif [[ "${1-}" = all ]]; then
  testAuth
  testUser
  testFamily
  testNotifications
  testReminders

else
  # Default to help
  help
fi
