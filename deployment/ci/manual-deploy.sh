#!/bin/bash
# Run as root from a verified tooling checkout. Argument: approved application SHA.
set -Eeuo pipefail
umask 077
export PATH=/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

if [[ $# != 1 || ! $1 =~ ^[0-9a-f]{40}$ || $(id -u) != 0 ]]; then
  echo "Run as root with one approved full application commit SHA." >&2
  exit 2
fi

sha=$1
repo=https://github.com/Asajadafsar/mlkino.git
tools=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
base=/opt/mlkino
venv=$base/venv
helpers=/usr/local/libexec
controller=$helpers/mlkino-deploy
checker=$helpers/mlkino-check-dependencies

test ! -L "$base"
test "$(stat -c '%u' "$base")" = 0
exec 9<"$base"
flock -n 9
test -L "$base/current"
active=$(readlink -e "$base/current")
[[ "$active" == "$base/releases/"* && -d "$active" ]]
test -r /etc/mlkino/mlkino.env
for svc in mlkino-backend.service mlkino-landing.service; do
  systemctl is-active --quiet "$svc"
done
"$venv/bin/python" -I -c 'import sys; sys.exit(sys.version_info < (3, 13))'
test "$(node -p 'process.versions.node.split(".")[0]')" = 24
nginx -t

work=$(mktemp -d /var/tmp/mlkino-reviewed.XXXXXX)
build=
cleanup() {
  if [[ -n "$build" ]]; then rm -rf -- "$build"; fi
  rm -rf -- "$work"
}
trap cleanup EXIT
chmod 0711 "$work"
(
  umask 022
  git clone --single-branch --branch codex/latest "$repo" "$work/src"
  git -C "$work/src" merge-base --is-ancestor "$sha" refs/remotes/origin/codex/latest
  git -C "$work/src" -c advice.detachedHead=false checkout --detach "$sha"
)
test "$(git -C "$work/src" rev-parse HEAD)" = "$sha"

# The checker runs inside the existing venv, as the application account.
# Do not install dependencies into production or edit its requirements files.
install -d -o root -g root -m 0755 "$helpers"
install -o root -g root -m 0644 "$tools/check_dependencies.py" "$checker"
runuser -u mlkino -g www-data -- "$venv/bin/python" -I "$checker" "$active" "$work/src"

build=$(mktemp -d /var/tmp/mlkino-build.XXXXXX)
cp -a "$work/src" "$build/src"
chown -R nobody:nogroup "$build"
runuser -u nobody -- env -i PATH="$PATH" HOME="$build" \
  bash -s -- "$build/src" "$build/artifact" "$sha" <<'BUILD'
set -Eeuo pipefail
cd "$1"
npm --prefix frontend ci --legacy-peer-deps --no-audit --no-fund
CI=false PUBLIC_URL=/panel REACT_APP_API_URL=https://mlkino.com \
  REACT_APP_WS_URL=wss://mlkino.com GENERATE_SOURCEMAP=false npm --prefix frontend run build
npm --prefix landing ci --no-audit --no-fund
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://mlkino.com \
  NEXT_PUBLIC_PANEL_URL=https://mlkino.com/panel npm --prefix landing run build
python3 deployment/ci/package.py "$3" "$2"
cd "$2"
sha256sum -c SHA256SUMS
BUILD

install -d -o root -g root -m 0700 /var/backups/mlkino/.ci
install -o root -g root -m 0755 "$tools/deploy.py" "$controller"
install -o root -g root -m 0644 "$tools/migrate.py" "$helpers/mlkino-migrate"
runuser -u nobody -- cat "$build/artifact/release.tar.gz" | "$controller"

test "$(readlink -e "$base/current")" = "$base/releases/$sha"
for svc in mlkino-backend.service mlkino-landing.service; do
  systemctl is-active "$svc"
done
for url in https://mlkino.com/ https://mlkino.com/panel/ https://mlkino.com/api/panel/public/catalog/; do
  test "$(curl -fsS --noproxy '*' --max-time 15 -o /dev/null -w '%{http_code}' "$url")" = 200
  printf 'HTTP 200 %s\n' "$url"
done
