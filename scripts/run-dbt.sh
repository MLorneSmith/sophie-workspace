#!/bin/bash
set -euo pipefail

cd /home/ubuntu/clawd/dbt
source /home/ubuntu/clawd/.venv-dbt/bin/activate
export DBT_PROFILES_DIR=/home/ubuntu/clawd/dbt
export GOOGLE_APPLICATION_CREDENTIALS=/home/ubuntu/.openclaw/gcp-service-account.json

dbt run "$@"
