#!/usr/bin/env python3
"""Approved, fingerprinted changes to the two reviewed Nginx sites only."""
import hashlib,json,os,pathlib,re,shutil,sys
from runtime import approve,run,save,sha,lock
HERE=pathlib.Path(__file__).resolve().parent
approve();handle=lock('nginx')
if len(sys.argv)!=2 or sys.argv[1] not in ['bootstrap','activate']:raise SystemExit('Usage: configure-nginx.py bootstrap|activate')
backup=pathlib.Path(os.environ.get('MLKINO_BACKUP_DIR','/missing'))
if not (backup/'database.dump').is_file() or not (backup/'checksums.json').is_file():raise SystemExit('Complete database/media/config backup first')
checks=json.loads((backup/'checksums.json').read_text())
for name in ['database.dump','media.tar.gz','code-before.tar.gz','system-config.tar.gz']:
    if sha(backup/name)!=checks[name]:raise SystemExit('Backup checksum mismatch: '+name)
api=pathlib.Path('/etc/nginx/sites-available/api.mlkino.com');panel=pathlib.Path('/etc/nginx/sites-available/panel.mlkino.com')
base=json.loads((HERE/'audit/server-config-hashes.json').read_text())
if sha(api)!=base[str(api)]:raise SystemExit('Existing API Nginx file changed; re-audit instead of overwriting it')
http=(HERE/'nginx/panel.mlkino.com.http.conf').read_text()
action=sys.argv[1]
if action=='bootstrap' and (panel.exists() or panel.is_symlink()):raise SystemExit('Existing panel configuration: manual review required')
if action=='activate':
    if not panel.is_file() or panel.read_text()!=http:raise SystemExit('Panel bootstrap configuration changed')
    if not pathlib.Path('/etc/letsencrypt/live/panel.mlkino.com/fullchain.pem').is_file():raise SystemExit('Panel certificate does not exist')
old_api=api.read_text();old_panel=panel.read_text() if panel.exists() else None
state=backup/('nginx-'+action);state.mkdir(mode=0o700,exist_ok=False)
shutil.copy2(api,state/'api.before');os.chmod(state/'api.before',0o600)
if old_panel is not None:(state/'panel.before').write_text(old_panel);os.chmod(state/'panel.before',0o600)
link=pathlib.Path('/etc/nginx/sites-enabled/panel.mlkino.com')
if link.exists() or link.is_symlink():
    if action=='bootstrap' or not link.is_symlink() or link.resolve()!=panel:raise SystemExit('Unexpected panel site link')
shared=pathlib.Path('/var/www/mlkino-frontend/shared/acme/.well-known/acme-challenge');shared.mkdir(parents=True,exist_ok=True)
for path in [shared,*list(shared.parents)[:4]]:os.chmod(path,0o755)
try:
    if action=='bootstrap':panel.write_text(http);os.chmod(panel,0o644);link.symlink_to(panel)
    else:
        text=old_api
        match=re.search(r'location\s+/ws/\s*\{[^{}]*\}',text)
        if not match:raise SystemExit('Existing /ws/ block shape changed')
        block=match.group(0)
        if 'proxy_pass http://127.0.0.1:8001;' not in block:raise SystemExit('ASGI upstream changed')
        if 'proxy_http_version' not in block:block=block.replace('{','{\n        proxy_http_version 1.1;',1)
        if 'proxy_buffering' not in block:block=block.replace('{','{\n        proxy_buffering off;',1)
        text=text[:match.start()]+block+text[match.end():]
        if 'location ^~ /media/private_chat/' not in text:
            location=re.search(r'location\s+/media/\s*\{',text)
            if not location:raise SystemExit('Existing media block changed')
            rules='location ^~ /media/private_chat/ { return 404; }\n    location ^~ /media/private_tickets/ { return 404; }\n    '
            text=text[:location.start()]+rules+text[location.start():]
        api.write_text(text);panel.write_text(http+'\n'+(HERE/'nginx/panel.mlkino.com.https.conf').read_text())
    run(['nginx','-t']);run(['systemctl','reload','nginx'])
except BaseException:
    api.write_text(old_api)
    if old_panel is None:panel.unlink(missing_ok=True);link.unlink(missing_ok=True)
    else:panel.write_text(old_panel)
    run(['nginx','-t'])
    raise
print('Reviewed Nginx configuration applied:',action)
