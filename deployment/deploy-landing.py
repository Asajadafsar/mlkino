#!/usr/bin/env python3
"""Build a new standalone landing release under its unprivileged runtime user.

Does not change Nginx/certificates or activate the symlink. Activation follows
successful loopback checks and TLS setup; retain the previous target for rollback.
"""
import argparse,os,pathlib,subprocess,tarfile,pwd,shutil
p=argparse.ArgumentParser();p.add_argument('release');p.add_argument('archive');p.add_argument('--demo',action='store_true');a=p.parse_args()
if os.geteuid()!=0 or os.environ.get('MLKINO_APPROVED')!='YES':raise SystemExit('Root and owner-approved deployment required')
if not a.release.replace('-','').isalnum():raise SystemExit('Invalid release id')
def run(args,**kw):subprocess.run(args,check=True,**kw)
try:user=pwd.getpwnam('mlkino-landing')
except KeyError:
 run(['useradd','--system','--no-create-home','--home-dir','/var/cache/mlkino-landing','--shell','/usr/sbin/nologin','mlkino-landing']);user=pwd.getpwnam('mlkino-landing')
root=pathlib.Path('/var/www/mlkino-landing');release=root/'releases'/a.release
if release.exists():raise SystemExit('Release exists; do not overwrite')
release.mkdir(parents=True,mode=0o750)
cache=pathlib.Path('/var/cache/mlkino-landing');cache.mkdir(exist_ok=True,mode=0o750);os.chown(cache,user.pw_uid,user.pw_gid)
with tarfile.open(a.archive) as tar:
 members=tar.getmembers()
 if any(not x.isfile() or pathlib.PurePosixPath(x.name).is_absolute() or '..' in pathlib.PurePosixPath(x.name).parts for x in members):raise SystemExit('Unsafe source archive')
 tar.extractall(release,filter='data')
for path in [release,*release.rglob('*')]:os.chown(path,user.pw_uid,user.pw_gid)
env={'LANG':'C.UTF-8','PATH':'/opt/mlkino-node/bin:/usr/bin:/bin','HOME':str(cache),'NEXT_TELEMETRY_DISABLED':'1','NEXT_PUBLIC_PANEL_URL':'https://panel.mlkino.com','NEXT_PUBLIC_API_URL':'https://api.mlkino.com'}
if a.demo:env.update(NEXT_PUBLIC_PANEL_URL='http://demo.localhost:4200',NEXT_PUBLIC_API_URL='http://demo.localhost:8102')
for cmd in [['npm','ci','--include=dev','--no-audit','--no-fund'],['npm','run','build']]:
 run(['/usr/sbin/runuser','-u','mlkino-landing','--',*cmd],cwd=release,env=env)
standalone=release/'.next/standalone'
if not (standalone/'server.js').is_file():raise SystemExit('Missing standalone output')
shutil.copytree(release/'public',standalone/'public')
shutil.copytree(release/'.next/static',standalone/'.next/static')
(standalone/'.next/cache').mkdir(exist_ok=True)
for path in [standalone,*standalone.rglob('*')]:
 if not path.is_symlink():os.chown(path,user.pw_uid,user.pw_gid)
print('Built isolated landing release:',standalone)
