# MLKINO Production acceptance checklist

Do not check post-deployment items until tested against the live domains. Current preparation is not a deployment.

Before approval:
- [x] CRA detected; local worktree and separate frontend repository inspected.
- [x] SSH read-only audit, actual service paths and current socket master identified.
- [x] Production uses Django 6.1.2/Python 3.13.5; local uses Django 6.0.8. No automatic upgrade/downgrade.
- [x] Redis responds PONG; both socket and port 8001 are active.
- [x] Backend settings, secrets, provider code and media excluded from release payload.
- [x] Production panel migration lineage validated in isolated SQLite, without `--fake`.
- [x] Owner approves deployment, additive migration, short API maintenance window, duplicate Gunicorn resolution, separate Django secret and Nginx/SSL setup.

After approval, before activation:
- [x] Database custom dump, media, code, Nginx/systemd/SSL config backed up under root-only `/var/backups/mlkino/`.
- [ ] Backup checksums, `pg_restore --list`, and tar listings validated; restore drill on an isolated database scheduled/performed. Listing is not a full restore drill.
- [x] Recheck server source and service fingerprints; abort on any new drift.
- [x] New root-private Django key generated without printing it; current JWT signing key retained deliberately.
- [x] Panel certificate issued for its own domain; existing API certificate untouched.
- [x] Staged production `check`, `check --deploy`, security checks, migration plan and `makemigrations --check` pass.
- [x] Only accounts.0011 is pending; no existing ticket/chat/settings table recreated.
- [x] `nginx -t` passes before every reload.

After activation:
- [x] Valid HTTPS for API and panel; API certificate/domain unaffected.
- [x] `/`, `/profile`, `/users/expert`, `/tickets/ID`, `/tasks/ID` survive direct navigation/reload.
- [x] JS/CSS/fonts/images return correct types; missing assets return 404; HTML is not cached permanently.
- [x] Browser API calls use `https://api.mlkino.com`; WS uses `wss://api.mlkino.com`; no loopback/mixed content.
- [x] Login response has Secure/HttpOnly host-only auth cookies; profile GET succeeds after reload and access-token refresh.
- [x] Credentialed CORS allows panel, rejects unknown origins; CSRF-protected impersonation start/exit works across subdomains.
- [x] Existing users and sessions retained; old JWTs still validate; device revocation works.
- [x] Superadmin sees users; agency sees/edits only its own experts; ordinary/expert roles cannot access user management.
- [x] User/admin ticket creation/reply/status/file download works; private attachments cannot be fetched via public `/media/`.
- [x] Future and today tasks appear correctly; status and edits persist without forced refresh.
- [x] Settings persist and profile preferences/devices/activity load.
- [x] Two authorized test accounts: instant chat message, read receipt, typing, reconnect, inbox notifications, ping/pong.
- [ ] Separate authenticated outsider/live-origin rejection drill for `/ws/chats/{id}/` (covered in isolated backend tests; positive authenticated Production WS/ping passed).
- [x] `/ws/inbox/` works: the new UI uses it for all conversations, calls and notifications.
- [ ] Calls tested between two networks. Existing STUN-only setup may require a separately configured TURN service; no public build contains private TURN credentials.
- [x] Gunicorn and ASGI use the SAME Redis layer; Redis was not restarted/rebuilt.
- [x] Service logs monitored for errors without printing tokens or message contents.
- [x] Frontend emergency maintenance fallback and code-only backend rollback targets recorded. No automatic DB/media restore or reverse migration.

Optional credential-safe smoke test after approval:
```bash
cd /root/mlkino-release-tools
/var/www/mlkino/venv/bin/python deployment/smoke-production.py --chat-id EXISTING_TEST_CHAT_ID
```
The script prompts for credentials via `getpass`, does not save them, and tests API/cookie/WS ping. It creates a normal login/device session; message tests remain explicit.

Actual result: `deployment/audit/production-result.json`. Dedicated QA account 8 is inactive; its test ticket is closed and task is done. No test/database records were deleted. Independent-network/TURN testing and an isolated database restore drill remain unperformed.
