# MLKINO Production acceptance checklist

Do not check post-deployment items until tested against the live domains. Current preparation is not a deployment.

Before approval:
- [x] CRA detected; local worktree and separate frontend repository inspected.
- [x] SSH read-only audit, actual service paths and current socket master identified.
- [x] Production uses Django 6.1.2/Python 3.13.5; local uses Django 6.0.8. No automatic upgrade/downgrade.
- [x] Redis responds PONG; both socket and port 8001 are active.
- [x] Backend settings, secrets, provider code and media excluded from release payload.
- [x] Production panel migration lineage validated in isolated SQLite, without `--fake`.
- [ ] Owner approves deployment, additive migration, short API maintenance window, duplicate Gunicorn resolution, separate Django secret and Nginx/SSL setup.

After approval, before activation:
- [ ] Database custom dump, media, code, Nginx/systemd/SSL config backed up under root-only `/var/backups/mlkino/`.
- [ ] Backup checksums, `pg_restore --list`, and tar listings validated; restore drill on an isolated database scheduled/performed. Listing is not a full restore drill.
- [ ] Recheck server source and service fingerprints; abort on any new drift.
- [ ] New root-private Django key generated without printing it; current JWT signing key retained deliberately.
- [ ] Panel certificate issued for its own domain; existing API certificate untouched.
- [ ] Staged production `check`, `check --deploy`, security checks, migration plan and `makemigrations --check` pass.
- [ ] Only accounts.0011 is pending; no existing ticket/chat/settings table recreated.
- [ ] `nginx -t` passes before every reload.

After activation:
- [ ] Valid HTTPS for API and panel; API certificate/domain unaffected.
- [ ] `/`, `/profile`, `/users/expert`, `/tickets/ID`, `/tasks/ID` survive direct navigation/reload.
- [ ] JS/CSS/fonts/images return correct types; missing assets return 404; HTML is not cached permanently.
- [ ] Browser API calls use `https://api.mlkino.com`; WS uses `wss://api.mlkino.com`; no loopback/mixed content.
- [ ] Login response has Secure/HttpOnly host-only auth cookies; profile GET succeeds after reload and access-token refresh.
- [ ] Credentialed CORS allows panel, rejects unknown origins; CSRF-protected impersonation start/exit works across subdomains.
- [ ] Existing users and sessions retained; old JWTs still validate; device revocation works.
- [ ] Superadmin sees users; agency sees/edits only its own experts; ordinary/expert roles cannot access user management.
- [ ] User/admin ticket creation/reply/status/file download works; private attachments cannot be fetched via public `/media/`.
- [ ] Future and today tasks appear correctly; status and edits persist without forced refresh.
- [ ] Settings persist and profile preferences/devices/activity load.
- [ ] Two authorized test accounts: instant chat message, read receipt, typing, reconnect, inbox notifications, ping/pong.
- [ ] Member-only `/ws/chats/{id}/`; unrelated account/origin rejected.
- [ ] `/ws/inbox/` works: the new UI uses it for all conversations, calls and notifications.
- [ ] Calls tested between two networks. Existing STUN-only setup may require a separately configured TURN service; no public build contains private TURN credentials.
- [ ] Gunicorn and ASGI use the SAME Redis layer; Redis was not restarted/rebuilt.
- [ ] Service logs monitored for errors without printing tokens or message contents.
- [ ] Frontend rollback and code-only backend rollback targets recorded. No automatic DB/media restore or reverse migration.

Optional credential-safe smoke test after approval:
```bash
cd /root/mlkino-release-tools
/var/www/mlkino/venv/bin/python deployment/smoke-production.py --chat-id EXISTING_TEST_CHAT_ID
```
The script prompts for credentials via `getpass`, does not save them, and tests API/cookie/WS ping. It creates a normal login/device session; message tests remain explicit.
