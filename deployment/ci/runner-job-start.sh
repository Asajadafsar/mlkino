#!/bin/bash
set -euo pipefail

protected=${GITHUB_REF_PROTECTED:-}
if [[ "${GITHUB_REPOSITORY:-}" != Asajadafsar/mlkino ||
      "${GITHUB_REF:-}" != refs/heads/codex/latest ||
      "${protected,,}" != true ||
      "${GITHUB_WORKFLOW_REF:-}" != Asajadafsar/mlkino/.github/workflows/production.yml@refs/heads/codex/latest ||
      "${GITHUB_JOB:-}" != production ||
      ( "${GITHUB_EVENT_NAME:-}" != push && "${GITHUB_EVENT_NAME:-}" != workflow_dispatch ) ]]; then
    echo "This runner accepts only the protected MLKino production workflow." >&2
    exit 1
fi
