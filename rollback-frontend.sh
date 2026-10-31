#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 2 ]]; then
    echo "Usage: $0 /root/mlkino-deploy.env /absolute/release-or-snapshot/path" >&2
    exit 2
fi
config=$1
[[ -f "$config" ]] || { echo "Missing reviewed config" >&2; exit 2; }
set -a
# Only source your own reviewed root-private configuration file.
source "$config"
set +a
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
exec python3 "$script_dir/deployment/runtime.py" frontend-rollback "$2"
