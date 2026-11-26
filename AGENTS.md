# MLKino repository instructions

## Development and review

- Repository and HTTPS clone URL: `https://github.com/Asajadafsar/mlkino.git`
- Start every development task from the latest `origin/codex/latest`. Use a
  feature branch and open a pull request targeting `codex/latest`. Respect
  branch protection. Keep `main` untouched and never force-push or overwrite
  existing commits.
- Complete the requested change, run the relevant tests and fix failures.
  Build the React admin panel and Next.js landing application when affected.
  Keep unrelated functionality and UI outside the change.
- Commit and push only the intended changes. Report the exact clone URL,
  feature branch, full commit SHA and PR URL. Report a blocked PR as pending.
- Use local development and testing. Production deployment is manual only.
  Do not use GitHub Actions, self-hosted runners, automated CI/CD deployment
  or direct SSH connections. The server operator runs the deployment commands
  manually as root after merging the approved PR. Do not ask the operator to
  edit individual source files.

## Production architecture

| Component | Production value |
| --- | --- |
| Server | Debian 12 at `87.248.139.252` |
| Operator SSH port | `9011` |
| Active application symlink | `/opt/mlkino/current` |
| Versioned releases | `/opt/mlkino/releases` |
| Python environment | `/opt/mlkino/venv` |
| Django service | `mlkino-backend.service` |
| Next.js service | `mlkino-landing.service` |
| PostgreSQL database | `mlkino_db` |
| Production environment | `/etc/mlkino/mlkino.env` |
| Uploaded media | `/var/lib/mlkino/media` |
| Shared Django static files | `/var/www/mlkino/staticfiles` |
| Public landing | `https://mlkino.com/` |
| React admin panel | `https://mlkino.com/panel/` |
| Public catalog API | `https://mlkino.com/api/panel/public/catalog/` |

The single-domain systemd and Nginx configuration is the production reference.
The older shared-Gunicorn layout and archived CI setup are historical material.

## Manual release instructions

For each change that requires a production release, provide one complete,
copy-paste-ready Bash block for the operator to run as root. The block must:

1. Fetch the approved source from GitHub and verify its exact full commit SHA
   and its presence on `codex/latest` before making any production change.
   Use the approved merged SHA. If it is unknown at handoff, require the
   operator to supply it and reject an empty or mismatched value. Never
   silently deploy an unverified branch tip.
2. Preflight the actual services, runtime, release paths and live symlink
   layout. Acquire a deployment lock and record the current release target
   before preparing the new release.
3. Build affected applications from the approved source in a separate release
   directory. Handle changed manifests and lockfiles using compatible,
   isolated runtime preparation. Preserve the existing Python environment
   and record how to restore it if a runtime change is required.
4. Preserve the production environment and configuration, uploaded media,
   shared static files and database. Back up and verify the PostgreSQL
   database before migrations. Check the migration plan and stop for a
   separately reviewed maintenance procedure if code-only rollback would
   be unsafe. Never restore a database dump or reverse migrations
   automatically.
5. Activate the staged release by atomically changing the live symlink.
   Preserve existing releases and relative build links. Never blindly
   overwrite or delete `/opt/mlkino/current`. Restart only the needed
   services. Check the active release, service status, landing page, panel
   and catalog API. Include a rollback command that restores the previous
   release and verifies its health after restarting the needed services.

Do not place credentials in the commands, source, commits or release files.
Treat the release as unverified until the operator runs the commands and
provides successful production verification.

## Completion reports

Write every completion report in Persian. Include the implemented changes,
test and build results, GitHub source and exact clone URL, feature branch and
full commit SHA, PR URL or concrete PR blocker, a single complete Bash block
for applicable manual deployment, the rollback command, the exact production
URLs above, and concrete steps to test the change. For documentation-only
changes, state whether any server deployment or rollback is required. Claim
production success only after the operator reports passing verification.
