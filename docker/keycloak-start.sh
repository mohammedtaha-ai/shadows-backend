#!/bin/bash
set -eu
export KC_DB_PASSWORD="$(cat /run/secrets/identity-db-password)"
export KC_BOOTSTRAP_ADMIN_PASSWORD="$(cat /run/secrets/admin-password)"
exec /opt/keycloak/bin/kc.sh start --import-realm
