#!/usr/bin/env python3
"""Validate the production migration graph without connecting to production."""
import pathlib,shutil,subprocess,sys,tarfile,tempfile
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='mlkino-migration-test-') as directory:
    target=pathlib.Path(directory)
    for name in ['accounts','panel','mlkino']:
        shutil.copytree(root/name,target/name,ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copy2(root/'manage.py',target/'manage.py')
    shutil.rmtree(target/'panel/migrations');(target/'panel/migrations').mkdir()
    for path in (root/'panel/migrations').glob('*.py'):
        if path.name in ['__init__.py','0001_initial.py','0002_impersonationsession_impersonationaudit_and_more.py']:shutil.copy2(path,target/'panel/migrations'/path.name)
    with tarfile.open(pathlib.Path(sys.argv[1])/'backend.tar.gz') as archive:archive.extractall(target,filter='data')
    code="""
import os
os.environ['DJANGO_SETTINGS_MODULE']='mlkino.settings'
from django.conf import settings
settings.DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':':memory:'}}
import django;django.setup()
from django.core.management import call_command
call_command('migrate',verbosity=0)
call_command('makemigrations',check=True,dry_run=True,verbosity=1)
from django.db.migrations.recorder import MigrationRecorder
applied=set(MigrationRecorder.Migration.objects.values_list('app','name'))
assert ('panel','0006_panelsettings') in applied
assert ('accounts','0011_user_profile_updated_at_accountnotification_and_more') in applied
assert ('panel','0003_support_tickets') not in applied
print('Production migration lineage validated; no fake migrations, no production DB connection.')
"""
    subprocess.run([sys.executable,'-B','-c',code],cwd=target,check=True)
