#!/usr/bin/env python3
"""Provision a new isolated Demo DB/user + loopback services. Never seed Production.

Input is a source archive built from the workspace (without settings/secrets),
a static panel archive, and a standalone landing release built for demo.localhost.
Run only after owner-authorized server deployment. Does not activate Production.
"""
import argparse,json,os,pathlib,pwd,secrets,shutil,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('--release',required=True);p.add_argument('--source',required=True);p.add_argument('--panel',required=True);p.add_argument('--landing',required=True);a=p.parse_args()
if os.geteuid()!=0 or os.environ.get('MLKINO_APPROVED')!='YES':raise SystemExit('Root and owner deployment approval required')
if not a.release.replace('-','').isalnum():raise SystemExit('Invalid release id')
root=pathlib.Path('/var/www/mlkino-demo')
if root.exists():raise SystemExit('Existing Demo directory; refusing to overwrite')
name='mlkino_demo_'+a.release.replace('-','_')
if len(name)>60:raise SystemExit('Demo identifier too long')
def run(args,**kwargs):return subprocess.run(args,check=True,**kwargs)
def pg(query):return subprocess.check_output(['/usr/sbin/runuser','-u','postgres','--','psql','-XAt','-v','ON_ERROR_STOP=1','-c',query],text=True).strip()
if pg(f"SELECT datname FROM pg_database WHERE datname='{name}'") or pg(f"SELECT rolname FROM pg_roles WHERE rolname='{name}'"):raise SystemExit('Demo DB/role already exists; manual review required')
root.mkdir(mode=0o755)
for folder in ('backend','panel','landing','media'): (root/folder).mkdir(mode=0o755)
try:user=pwd.getpwnam('mlkino-demo')
except KeyError:
 run(['useradd','--system','--no-create-home','--home-dir','/var/cache/mlkino-demo','--shell','/usr/sbin/nologin','mlkino-demo']);user=pwd.getpwnam('mlkino-demo')
cache=pathlib.Path('/var/cache/mlkino-demo');cache.mkdir(mode=0o750,exist_ok=True)
for folder in (cache,root/'media'):os.chown(folder,user.pw_uid,user.pw_gid)
def extract(archive,target):
 with tarfile.open(archive) as tar:
  members=tar.getmembers()
  if any(not m.isfile() or pathlib.PurePosixPath(m.name).is_absolute() or '..' in pathlib.PurePosixPath(m.name).parts for m in members):raise SystemExit('Unsafe archive')
  tar.extractall(target,filter='data')
extract(a.source,root/'backend');extract(a.panel,root/'panel');extract(a.landing,root/'landing')
if (root/'backend/mlkino/settings.py').exists():raise SystemExit('Demo must not include Production/local settings.py')
password=secrets.token_urlsafe(40);key=secrets.token_urlsafe(64)
private=pathlib.Path('/etc/mlkino/demo.env');private.parent.mkdir(exist_ok=True)
if private.exists():raise SystemExit('Demo env exists; refusing to replace')
env={'MLKINO_DEMO_SECRET_KEY':key,'MLKINO_DEMO_DB_NAME':name,'MLKINO_DEMO_DB_USER':name,'MLKINO_DEMO_DB_PASSWORD':password,'MLKINO_DEMO_MEDIA_ROOT':str(root/'media'),'DJANGO_SETTINGS_MODULE':'mlkino.demo','PYTHONDONTWRITEBYTECODE':'1'}
fd=os.open(private,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:f.write(''.join(k+'='+v+'\n' for k,v in env.items()))
# Credentials go to psql stdin, never argv or terminal output.
sql=f"CREATE ROLE {name} LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;\nCREATE DATABASE {name} OWNER {name};\n"
run(['/usr/sbin/runuser','-u','postgres','--','psql','-Xq','-v','ON_ERROR_STOP=1'],input=sql,text=True,stdout=subprocess.DEVNULL)
# Reject this new role for every other DB, independent of PUBLIC CONNECT grants.
hba=pathlib.Path(pg('SHOW hba_file'));backup=hba.with_name(hba.name+'.mlkino-demo-'+a.release);shutil.copy2(hba,backup)
block=f'# isolated MLKINO Demo {a.release}\nhost {name} {name} 127.0.0.1/32 scram-sha-256\nhost all {name} 0.0.0.0/0 reject\nhost all {name} ::0/0 reject\nlocal all {name} reject\n'
hba.write_text(block+hba.read_text());pg('SELECT pg_reload_conf()')
if pg('SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL')!='0':
 shutil.copy2(backup,hba);pg('SELECT pg_reload_conf()');raise SystemExit('HBA check failed and restored')
python='/var/www/mlkino/venv/bin/python'
manage_env={**os.environ,**env,'PATH':'/opt/mlkino-node/bin:/usr/bin:/bin'}
for command in (['migrate','--noinput'],['check'],['seed_demo','--profile=full','--dry-run'],['seed_demo','--profile=full']):
 run(['/usr/sbin/runuser','-u','mlkino-demo','--',python,str(root/'backend/manage.py'),*command],cwd=root/'backend',env=manage_env)
print('Demo database, restricted role and guarded seed created. Install reviewed loopback units before opening the SSH tunnel.')
