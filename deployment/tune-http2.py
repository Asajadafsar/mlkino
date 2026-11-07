#!/usr/bin/env python3
"""Fingerprint-checked HTTP/2 and text compression for the three reviewed sites."""
import argparse,hashlib,json,os,pathlib,re,subprocess
p=argparse.ArgumentParser();p.add_argument('--expected',required=True);p.add_argument('--backup',required=True);p.add_argument('--apply',action='store_true');a=p.parse_args()
names=('mlkino.com','panel.mlkino.com','api.mlkino.com')
expected=json.loads(pathlib.Path(a.expected).read_text())
if set(expected)!=set(names):raise SystemExit('Only three reviewed site names allowed')
root=pathlib.Path('/etc/nginx/sites-available');originals={};updated={}
for name in names:
 path=root/name;raw=path.read_bytes();text=raw.decode()
 if hashlib.sha256(raw).hexdigest()!=expected[name]:raise SystemExit('Nginx drift: '+name)
 if re.search(r'^\s*(http2|gzip_types|gzip_comp_level)\s',text,re.M):raise SystemExit('Existing custom performance directives; review first')
 text,count=re.subn(r'(^\s*listen 443 ssl;[^\n]*\n)',lambda m:m[0]+'    http2 on;\n    gzip_vary on;\n    gzip_comp_level 5;\n    gzip_types text/css application/javascript application/json image/svg+xml;\n',text,flags=re.M)
 if count!=(2 if name=='mlkino.com' else 1):raise SystemExit('Unexpected TLS server structure')
 originals[path]=raw;updated[path]=text
if not a.apply:print('Dry-run: HTTP/2 and text compression for four existing TLS server blocks');raise SystemExit()
if os.geteuid()!=0 or os.environ.get('MLKINO_APPROVED')!='YES':raise SystemExit('Owner-approved root deployment required')
backup=pathlib.Path(a.backup)
if not (backup/'database.dump').is_file():raise SystemExit('Release backup missing')
for path,raw in originals.items():
 target=backup/(path.name+'.http2.before')
 fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'wb') as f:f.write(raw)
try:
 for path,text in updated.items():path.write_text(text)
 subprocess.run(['nginx','-t'],check=True)
 subprocess.run(['systemctl','reload','nginx'],check=True)
except BaseException:
 for path,raw in originals.items():path.write_bytes(raw)
 subprocess.run(['nginx','-t'],check=True);subprocess.run(['systemctl','reload','nginx'],check=True)
 raise
print('HTTP/2 and text compression enabled; TLS and private-media rules retained.')
