#!/usr/bin/env python3
"""Add only reviewed private-media denials and caching to the existing API site."""
import argparse,hashlib,os,pathlib,re,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--expected-sha',required=True);p.add_argument('--backup',required=True);p.add_argument('--apply',action='store_true');a=p.parse_args()
site=pathlib.Path('/etc/nginx/sites-available/api.mlkino.com')
original=site.read_bytes()
if hashlib.sha256(original).hexdigest()!=a.expected_sha:raise SystemExit('Nginx drift; review again')
text=original.decode()
paths=('private_chat/','private_tickets/','private_finance/','private_activities/','identity/','agencies/licenses/','experts/documents/')
missing=[x for x in paths if 'location ^~ /media/'+x not in text]
match=re.search(r'location\s+/media/\s*\{[^{}]*\}',text)
if not match or 'alias /var/www/mlkino/media/;' not in match[0]:raise SystemExit('Unreviewed media block')
block=match[0]
if 'expires ' not in block:block=block.replace('{','{\n        expires 7d;\n        add_header X-Content-Type-Options nosniff always;',1)
text=text[:match.start()]+''.join('location ^~ /media/'+x+' { return 404; }\n    ' for x in missing)+block+text[match.end():]
if not a.apply:
 print('Dry-run: deny',missing,'and cache public media for seven days');raise SystemExit()
if os.geteuid()!=0 or os.environ.get('MLKINO_APPROVED')!='YES':raise SystemExit('Owner-approved root deployment required')
backup=pathlib.Path(a.backup)
if not (backup/'database.dump').is_file() or not (backup/'checksums.json').is_file():raise SystemExit('Full release backup missing')
target=backup/'api-private-media.before'
if target.exists():raise SystemExit('Backup exists; refusing to overwrite')
target.write_bytes(original);target.chmod(0o600)
try:
 site.write_text(text)
 subprocess.run(['nginx','-t'],check=True)
 subprocess.run(['systemctl','reload','nginx'],check=True)
except BaseException:
 site.write_bytes(original)
 subprocess.run(['nginx','-t'],check=True)
 subprocess.run(['systemctl','reload','nginx'],check=True)
 raise
print('Private media protected; original Nginx config retained in release backup.')
