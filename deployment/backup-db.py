"""Run with the EXISTING backend venv, from the existing backend directory."""
import os, pathlib, subprocess, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE','mlkino.settings')
sys.path.insert(0,os.getcwd())
import django
django.setup()
from django.conf import settings
db=settings.DATABASES['default']
if db['ENGINE'] != 'django.db.backends.postgresql': raise SystemExit('Unreviewed database engine')
output=pathlib.Path(sys.argv[1]);env=os.environ.copy()
for key,pg in [('NAME','PGDATABASE'),('USER','PGUSER'),('PASSWORD','PGPASSWORD'),('HOST','PGHOST'),('PORT','PGPORT')]:
    if db.get(key):env[pg]=str(db[key])
# Connection credentials are not command arguments or files.
subprocess.run(['pg_dump','--format=custom','--no-owner','--no-acl','--file',str(output)],env=env,check=True)
subprocess.run(['pg_restore','--list',str(output)],stdout=subprocess.DEVNULL,check=True)
os.chmod(output,0o600)
