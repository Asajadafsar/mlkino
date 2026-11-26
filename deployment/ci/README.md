# MLKino production deployment

The pipeline targets the **single-domain** configuration documented in
[the previous release](../../docs/auth-profile-release-20261117.md) and
[the service and Nginx files](../single-domain/). It expects Debian 12 x64,
`/opt/mlkino/current`, `/opt/mlkino/venv`, the existing
`mlkino-backend.service` and `mlkino-landing.service`, and local PostgreSQL
`mlkino_db` on 5432. The endpoints are <https://mlkino.com/>,
<https://mlkino.com/panel/>, and <https://mlkino.com/api/panel/public/catalog/>.
The older `deployment/runtime.py` shared-Gunicorn layout has a different
deployment model.

GitHub-hosted jobs run Django, React and deployment controller tests, then
build React and type-check/build Next.js. Only the deployment job runs on the
production runner. It accepts an artifact from its own workflow run and checks
the SHA against the current remote branch tip. The production host needs
outbound HTTPS to GitHub Actions and its artifact storage. No inbound SSH
connection from Actions is used.

## GitHub administrator setup

1. Protect `codex/latest` with repository rules requiring reviews for changes
   (including workflow and deployment files), blocking force pushes and
   deletion, and limiting bypass to the explicitly trusted release
   administrators. Restrict workflow/runner settings to trusted admins. Verify
   that GitHub sets `github.ref_protected` on this ref.
2. Create the **production** environment. Set deployment branches to only
   `codex/latest`, require an authorized reviewer, prevent self-review and
   disable administrator bypass where supported. Verify that those settings
   are available for this repository and plan before registering the runner.
   Keep fork/untrusted PR jobs off self-hosted runners. Treat workflow writers
   and repository/runner administrators as trusted. When organization runner
   groups are available, dedicate a runner group to this repository and
   restrict it to
   `Asajadafsar/mlkino/.github/workflows/production.yml@refs/heads/codex/latest`.
   The root-installed runner hook checks the server-supplied workflow context
   before executing steps, including for a repository-scoped runner.
3. Open **Settings → Actions → Runners → New self-hosted runner**. Use the
   short-lived registration token only in the interactive server prompt. The
   production runner should have the custom label `mlkino-production`.
4. Pushes to `codex/latest` trigger the workflow. To use **Run workflow**,
   select `codex/latest`. GitHub requires the workflow to exist on the
   repository's default branch for manual dispatch. If an administrator wants
   dispatch without adding any workflow to `main`, they can set
   `codex/latest` as the default branch after reviewing that repository-wide
   change.

## One-time install on Debian 12

Run these commands in an existing root administrative session on
`87.248.139.252`. Verify the service definitions and data locations before
installing. Use an administrator-controlled checkout containing the reviewed
pipeline commit; `SOURCE` is the full path to that checkout. The commands do
not change service units, PostgreSQL configuration, Nginx, or the production
environment file.

```bash
set -euo pipefail
SOURCE=/root/mlkino-reviewed
# If absent, clone with your existing approved read-only GitHub access.
# git clone --single-branch --branch codex/latest https://github.com/Asajadafsar/mlkino.git "$SOURCE"
git -C "$SOURCE" log -1 --oneline
test -f "$SOURCE/deployment/ci/deploy.py"
test "$(dpkg --print-architecture)" = amd64
systemctl cat mlkino-backend.service mlkino-landing.service
sudo -u postgres psql --no-psqlrc --dbname=mlkino_db --command='SELECT current_database();'
test -r /etc/mlkino/mlkino.env
test -x /opt/mlkino/venv/bin/python
# If current is a real directory, complete the baseline conversion below first.
test -L /opt/mlkino/current
baseline=$(readlink -e /opt/mlkino/current)
case "$baseline" in
  /opt/mlkino/releases/baseline/app) release_root=/opt/mlkino/releases/baseline ;;
  *) test "$(dirname "$baseline")" = /opt/mlkino/releases; release_root="$baseline" ;;
esac
test -f "$baseline/mlkino/production_settings.py"
test -f "$baseline/requirements.txt"
test -f "$baseline/requirements-extra.txt"
test -f "$baseline/frontend/build/asset-manifest.json"
test -f "$baseline/landing/.next/standalone/server.js"
test -z "$(find /opt/mlkino /opt/mlkino/releases "$release_root" -maxdepth 0 \( ! -user root -o -perm /022 \) -print)"
nginx -t
curl --fail --silent --show-error --resolve mlkino.com:443:127.0.0.1 \
  https://mlkino.com/api/panel/public/catalog/?page_size=1 >/dev/null

apt-get update
apt-get install --yes ca-certificates curl jq sudo postgresql-client libicu72
id mlkino-deploy >/dev/null 2>&1 || useradd --system --user-group \
  --home-dir /var/lib/mlkino-runner --shell /usr/sbin/nologin mlkino-deploy
test "$(id -Gn mlkino-deploy)" = mlkino-deploy
if runuser -u mlkino-deploy -- test -r /etc/mlkino/mlkino.env; then exit 1; fi
install -d -o mlkino-deploy -g mlkino-deploy -m 0700 /var/lib/mlkino-runner
install -d -o root -g root -m 0700 /var/backups/mlkino/.ci
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$SOURCE/deployment/ci/deploy.py" /usr/local/libexec/mlkino-deploy
install -o root -g root -m 0644 "$SOURCE/deployment/ci/migrate.py" /usr/local/libexec/mlkino-migrate
install -o root -g root -m 0755 "$SOURCE/deployment/ci/runner-job-start.sh" /usr/local/libexec/mlkino-runner-job-start
visudo -cf "$SOURCE/deployment/ci/mlkino-deploy.sudoers"
install -o root -g root -m 0440 "$SOURCE/deployment/ci/mlkino-deploy.sudoers" /etc/sudoers.d/mlkino-deploy
visudo -c
sudo -l -U mlkino-deploy
```

Check that the account has only its own group, no access to
`/etc/mlkino/mlkino.env`, no Docker access, and only the displayed zero-argument
deployment command in sudo. Admin-only rollback is run directly by root.
Do not install a runner for the old shared-Gunicorn layout.

Fetch the runner and compare the SHA-256 digest from the official GitHub
release API before extracting it. This block expects an empty runner home.

```bash
set -euo pipefail
tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT
curl --fail --silent --show-error --location \
  https://api.github.com/repos/actions/runner/releases/latest > "$tmp/release.json"
jq -er '.assets[] | select(.name | test("^actions-runner-linux-x64-[0-9.]+\\.tar\\.gz$")) | .browser_download_url' "$tmp/release.json" > "$tmp/url"
jq -er '.assets[] | select(.name | test("^actions-runner-linux-x64-[0-9.]+\\.tar\\.gz$")) | .digest | select(test("^sha256:[a-f0-9]{64}$"))' "$tmp/release.json" > "$tmp/digest"
url=$(cat "$tmp/url")
[[ "$url" == https://github.com/actions/runner/releases/download/* ]]
curl --fail --silent --show-error --location "$url" > "$tmp/runner.tar.gz"
printf '%s  %s\n' "$(cut -d: -f2 "$tmp/digest")" "$tmp/runner.tar.gz" | sha256sum -c -
test -z "$(ls -A /var/lib/mlkino-runner)"
runuser -u mlkino-deploy -- tar -xzf - -C /var/lib/mlkino-runner < "$tmp/runner.tar.gz"
cd /var/lib/mlkino-runner
runuser -u mlkino-deploy -- ./config.sh \
  --url https://github.com/Asajadafsar/mlkino --name mlkino-prod-debian12 \
  --labels mlkino-production --work _work
# Paste the registration token in the prompt. Verify the group in GitHub.
install -o root -g root -m 0644 "$SOURCE/deployment/ci/mlkino-runner.service" /etc/systemd/system/mlkino-runner.service
systemctl daemon-reload
systemctl enable --now mlkino-runner.service
systemctl status mlkino-runner.service --no-pager
```

In GitHub, verify the runner is **Idle** and has the required labels.
If the first push queued a deployment before setup, approve its production
review or re-run the build for the current SHA once GitHub sees the runner.

## Convert the existing production baseline

For the host where `/opt/mlkino/current` is a real directory, run the following
as root from a reviewed checkout after merging the fix. Keep the GitHub runner
offline through this maintenance window. The application services will be
briefly stopped and restarted. Inspect the units first and confirm they work
through `/opt/mlkino/current`.

```bash
set -euo pipefail
SOURCE=/root/mlkino-reviewed
git -C "$SOURCE" log -1 --oneline
systemctl cat mlkino-backend.service mlkino-landing.service
systemctl is-active mlkino-backend.service mlkino-landing.service
test -d /opt/mlkino/current && test ! -L /opt/mlkino/current
stat -c '%a %U:%G %n' /opt/mlkino /opt/mlkino/current
readlink /opt/mlkino/current/frontend/build
readlink /opt/mlkino/current/landing/.next/standalone
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$SOURCE/deployment/ci/deploy.py" /usr/local/libexec/mlkino-deploy
install -d -o root -g root -m 0700 /var/backups/mlkino/.ci
/usr/local/libexec/mlkino-deploy --migrate-baseline
test "$(readlink -e /opt/mlkino/current)" = /opt/mlkino/releases/baseline/app
systemctl is-active mlkino-backend.service mlkino-landing.service
```

The controller checks the live service working directories, TLS/Nginx, API
data and frontend JavaScript before stopping the services and again after
conversion. It renames the existing tree on the same filesystem and retains
its inode, ownership and modes, including both relative build symlinks. The
only ownership transition is the deployment anchor `/opt/mlkino` becoming
`root:www-data` on this host, with its existing group and mode retained. The
root-controlled anchor prevents service users from replacing the live pointer.
The environment file, database, media, static directory and shared venv stay
in place. On an ordinary failure the controller restores the original
directory and restarts and checks it before reporting the failure.

To reverse the conversion **before the first CI deployment**, while the
runner is offline and the baseline is still active:

```bash
/usr/local/libexec/mlkino-deploy --restore-baseline-directory
test -d /opt/mlkino/current && test ! -L /opt/mlkino/current
systemctl is-active mlkino-backend.service mlkino-landing.service
```

After a later deployment, retain the symlink layout and use the normal
application rollback. If the process was forcibly terminated, inspect
`current`, `releases/baseline/app` and the service journal before retrying.
Once baseline health passes, continue the [runner installation](#one-time-install-on-debian-12)
or start the already configured runner. Cancel any queued production job for
the old controller commit and approve only the run for the merged fix.

## Release and rollback behavior

- The controller copies the previous production settings file into the
  staged release. The existing environment file, shared venv, Nginx,
  systemd units, database, uploads and shared Django static directory are
  kept in place. Dependency changes require an admin-provisioned runtime.
- The controller takes a PostgreSQL custom-format dump and verifies it with
  `pg_restore --list` and a full decode to `/dev/null` before applying migrations. The backup directory is
  root-only. Keep enough free disk space and schedule backup retention and
  off-host recovery tests through the site's backup policy.
- A database schema mismatch fails before activation. Automated pending
  migrations are limited to atomic table creation and simple nullable
  columns. Other changes require a reviewed maintenance release. Migrations
  run as the existing service account with database statement and lock limits.
- One filesystem lock covers deployment and rollback. The live release is
  switched atomically. Django and Next.js restart. The controller verifies the
  service process directories, catalog JSON, release marker and JavaScript
  assets through both local TLS/Nginx and the public HTTPS URLs. A failure
  restores the prior pointer, restarts services and checks origin health. The
  workflow still fails.
- For a manual application rollback, root runs
  `/usr/local/libexec/mlkino-deploy --rollback`. It uses the prior release
  pointer and verifies health. Database dumps are for reviewed recovery only.
  The controller never automatically restores a dump or reverses migrations.
  Retain the active and previous release directories. If a failed activation
  left an inactive directory for the same SHA, investigate and archive that
  directory outside `releases` before repeating that exact release.
