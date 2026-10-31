#!/usr/bin/env python3
"""Server-side guarded release operations. Never run before owner approval."""
import atexit, datetime, fcntl, hashlib, json, os, pathlib, shutil, subprocess, sys, tarfile, tempfile
HERE=pathlib.Path(__file__).resolve().parent

def die(message): raise SystemExit(message)
def run(command, **kw): return subprocess.run([str(x) for x in command],check=True,**kw)
def output(command): return subprocess.check_output(command,text=True).strip()
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def save(path,data):
    path.write_text(json.dumps(data,indent=2)+'\n');os.chmod(path,0o600)
def approve():
    if os.geteuid()!=0: die('Run as root on the reviewed production server.')
    if os.environ.get('MLKINO_APPROVED')!='YES': die('Owner deployment approval is required: MLKINO_APPROVED=YES')
    if pathlib.Path('/etc/os-release').read_text().find('Debian')<0: die('Unreviewed operating system')
def pathvar(name,expected):
    value=pathlib.Path(os.environ.get(name,expected))
    if str(value)!=expected: die(f'{name}: path differs from reviewed server; re-audit first')
    return value
def manifest(release):
    data=json.loads((release/'manifest.json').read_text())
    if not data['release'].replace('-','').isalnum():die('Invalid release name')
    for name,digest in data['archives'].items():
        if name not in ['backend.tar.gz','frontend.tar.gz'] or sha(release/name)!=digest:die('Archive checksum mismatch')
    return data
def extract(archive,destination,expected):
    with tarfile.open(archive) as tar:
        members=tar.getmembers()
        if any(not m.isfile() or pathlib.PurePosixPath(m.name).is_absolute() or '..' in pathlib.PurePosixPath(m.name).parts for m in members):die('Unsafe archive')
        if len({m.name for m in members})!=len(members) or {m.name for m in members}!=set(expected):die('Archive manifest mismatch')
        tar.extractall(destination,filter='data')
    for name,digest in expected.items():
        if sha(destination/name)!=digest:die('Extracted checksum mismatch: '+name)
def lock(name):
    fd=open('/run/lock/mlkino-'+name+'.lock','w');fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB);return fd

def backup_backend(base,folder):
    folder.mkdir(parents=True,exist_ok=False);os.chmod(folder,0o700)
    # Root-private archives intentionally retain production secrets for recovery, never publish them.
    run(['tar','--exclude=./venv','--exclude=./media','--exclude=./staticfiles','--exclude=./.git','--exclude=__pycache__','-czf',folder/'code-before.tar.gz','-C',base,'.'])
    run(['tar','-czf',folder/'system-config.tar.gz','-C','/','etc/nginx','etc/systemd/system','etc/letsencrypt'])
    env=os.environ.copy();env['DJANGO_SETTINGS_MODULE']='mlkino.settings';env['PYTHONDONTWRITEBYTECODE']='1'
    run([base/'venv/bin/python','-B',HERE/'backup-db.py',folder/'database.dump'],cwd=base,env=env)
    run(['tar','-czf',folder/'media.tar.gz','-C',base,'media'])
    for name in ['code-before.tar.gz','media.tar.gz','system-config.tar.gz']:
        run(['tar','-tzf',folder/name],stdout=subprocess.DEVNULL)
    save(folder/'checksums.json',{p.name:sha(p) for p in folder.iterdir() if p.is_file()})
    (folder/'git-before.txt').write_text(output(['git','-C',base,'status','--short'])+'\n'+output(['git','-C',base,'rev-parse','HEAD'])+'\n')

def backend_deploy(release):
    base=pathvar('BACKEND_DIR','/var/www/mlkino');data=manifest(release)
    if os.environ.get('MLKINO_MIGRATIONS_APPROVED')!='YES':die('Migration approval is required separately')
    if os.environ.get('MLKINO_DUAL_GUNICORN_REVIEWED')!='YES':die('Review duplicate Gunicorn services first')
    # The live socket currently has two masters. Never restart both into the same pathname.
    if os.environ.get('MLKINO_DUPLICATE_ACTION')!='stop-disable-django-app':die('Explicit duplicate-service decision required')
    for name,digest in data['baseline'].items():
        if not (base/name).is_file() or sha(base/name)!=digest:die('Server code drift; re-audit before replacing '+name)
    if output(['git','-C',base,'rev-parse','--short','HEAD'])!=data['backend_base_revision']:die('Server revision changed')
    for command in ['pg_dump','pg_restore','tar','systemctl']:
        if not shutil.which(command):die('Missing server tool: '+command)
    observed={line.split('==')[0].lower().replace('_','-'):line.split('==')[1] for line in (HERE/'requirements-production-observed.txt').read_text().splitlines() if '==' in line}
    packages=json.loads(output([base/'venv/bin/python','-m','pip','list','--format=json']))
    installed={p['name'].lower().replace('_','-'):p['version'] for p in packages}
    if any(installed.get(name)!=version for name,version in observed.items()):die('Production dependencies drifted; review before release')
    for name,digest in json.loads((HERE/'audit/server-config-hashes.json').read_text()).items():
        if 'systemd' in name and sha(pathlib.Path(name))!=digest:die('Service definition drifted: '+name)
    stamp=data['release'];folder=pathlib.Path(os.environ.get('BACKUP_ROOT','/var/backups/mlkino'))/('backend-'+stamp)
    stage=pathlib.Path(tempfile.mkdtemp(prefix='mlkino-stage-',dir='/var/www'))
    os.chmod(stage,0o700)
    atexit.register(lambda: shutil.rmtree(stage,ignore_errors=True))
    shutil.copytree(base,stage,dirs_exist_ok=True,ignore=shutil.ignore_patterns('venv','media','staticfiles','.git','.env*','__pycache__'))
    incoming=stage/'_incoming';incoming.mkdir();extract(release/'backend.tar.gz',incoming,data['files'])
    for name in data['files']:
        target=stage/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(incoming/name,target)
    # Resolve BASE_DIR from the untouched original settings, not the temporary staging root.
    (stage/'mlkino/settings.py').unlink();(stage/'mlkino/settings.py').symlink_to(base/'mlkino/settings.py')
    env=os.environ.copy();env.update(DJANGO_SETTINGS_MODULE='mlkino.production_release',PYTHONDONTWRITEBYTECODE='1')
    keyfile=pathlib.Path('/etc/mlkino/release.env')
    if not keyfile.is_file() or keyfile.stat().st_uid!=0 or keyfile.stat().st_mode & 0o077:
        die('Missing approved root-private release environment; no services changed')
    for line in keyfile.read_text().splitlines():
        if line.startswith('MLKINO_DJANGO_SECRET_KEY='):env['MLKINO_DJANGO_SECRET_KEY']=line.split('=',1)[1]
    if not env.get('MLKINO_DJANGO_SECRET_KEY'):die('New Django signing key must be generated securely before staging checks')
    python=base/'venv/bin/python'
    for args in [['check'],['check','--deploy'],['check','--deploy','--tag','security','--fail-level','WARNING'],['makemigrations','--check','--dry-run'],['migrate','--plan']]:
        run([python,'-B',stage/'manage.py',*args],cwd=stage,env=env)
    backup_backend(base,folder)
    units=['gunicorn.service','mlkino-asgi.service'];duplicate='django-app.service'
    states={unit:{'active':output(['systemctl','is-active',unit])=='active','enabled':subprocess.run(['systemctl','is-enabled',unit],capture_output=True,text=True).stdout.strip()} for unit in [*units,duplicate]}
    dropins={}
    for unit in units:
        p=pathlib.Path('/etc/systemd/system')/(unit+'.d')/'90-mlkino-release.conf'
        dropins[str(p)]=p.read_text() if p.exists() else None
    save(folder/'release.json',{'release':stamp,'units':states,'dropins':dropins,'files':data['files'],'schema_rollback':'Never reverse migrations or restore DB automatically.'})
    try:
        run(['systemctl','stop',duplicate,*units])
        # Existing code/config/media are retained. Only reviewed allowlisted files change.
        for name in data['files']:
            target=base/name;target.parent.mkdir(parents=True,exist_ok=True)
            temp=target.with_name(target.name+'.mlkino-new');shutil.copy2(incoming/name,temp);os.chmod(temp,0o644);os.replace(temp,target)
        for name in dropins:
            p=pathlib.Path(name);p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(HERE/'systemd/90-mlkino-release.conf',p)
        run([python,'-B',base/'manage.py','migrate','--noinput'],cwd=base,env=env)
        run([python,'-B',base/'manage.py','collectstatic','--noinput'],cwd=base,env=env)
        run(['systemctl','disable',duplicate]);run(['systemctl','daemon-reload']);run(['systemctl','start',*units])
        for unit in units:run(['systemctl','is-active','--quiet',unit])
        run(['curl','--fail','--silent','--show-error','--retry','10','--retry-connrefused','--retry-delay','2','--unix-socket','/run/gunicorn.sock','-H','Host: api.mlkino.com','-H','X-Forwarded-Proto: https','http://localhost/api/schema/'],stdout=subprocess.DEVNULL)
        print('Backend activated. Run PRODUCTION_CHECKLIST.md. Rollback snapshot:',folder)
    except BaseException:
        print('Deployment failed. Services/code may be partially updated. Database was NOT reversed.',file=sys.stderr)
        print('Restoring the pre-deploy code/service state without touching database/media.',file=sys.stderr)
        try:backend_rollback(folder)
        except BaseException:print('Automatic code rollback failed; use rollback-backend.sh with '+str(folder),file=sys.stderr)
        raise
    finally: shutil.rmtree(stage)

def backend_rollback(folder):
    base=pathvar('BACKEND_DIR','/var/www/mlkino');record=json.loads((folder/'release.json').read_text())
    checks=json.loads((folder/'checksums.json').read_text())
    if sha(folder/'code-before.tar.gz')!=checks['code-before.tar.gz']:die('Backup checksum mismatch')
    units=list(record['units']);run(['systemctl','stop',*units])
    # Restore CODE ONLY. Database, media and the current production settings are never restored here.
    temp=pathlib.Path(tempfile.mkdtemp(prefix='mlkino-rollback-'))
    try:
        with tarfile.open(folder/'code-before.tar.gz') as archive:archive.extractall(temp,filter='data')
        for name in record['files']:
            source=temp/name
            if source.is_file():shutil.copy2(source,base/name)
            # Newly introduced additive migrations/source files may stay on disk, dormant.
        for name,previous in record['dropins'].items():
            path=pathlib.Path(name)
            if previous is None:path.unlink(missing_ok=True)
            else:path.write_text(previous)
        run(['systemctl','daemon-reload'])
        for unit,state in record['units'].items():
            if state['enabled']=='enabled':run(['systemctl','enable',unit])
            if state['active']:run(['systemctl','start',unit])
        print('Code rolled back. Additive schema retained; database/media/secrets untouched.')
    finally:shutil.rmtree(temp)

def frontend_deploy(release):
    root=pathvar('FRONTEND_DIR','/var/www/mlkino-frontend');data=manifest(release)
    if not pathlib.Path('/etc/letsencrypt/live/panel.mlkino.com/fullchain.pem').is_file():die('Panel certificate not issued; complete approved bootstrap first')
    run(['nginx','-t']);root.mkdir(parents=True,exist_ok=True);os.chmod(root,0o755)
    current=root/'current'
    if current.exists() and not current.is_symlink():die('Current is an active directory; explicit path migration required')
    releases=root/'releases';releases.mkdir(exist_ok=True);os.chmod(releases,0o755);target=releases/data['release']
    target.mkdir(exist_ok=False);os.chmod(target,0o755);extract(release/'frontend.tar.gz',target,data['frontend_files'])
    for path in target.rglob('*'):os.chmod(path,0o755 if path.is_dir() else 0o644)
    previous=str(current.resolve()) if current.is_symlink() else None
    state=root/'shared/release-state';state.mkdir(parents=True,exist_ok=True);os.chmod(state,0o700)
    save(state/(data['release']+'.json'),{'previous':previous,'release':data['release']})
    link=root/('.current-'+data['release']);link.symlink_to(target);os.replace(link,current)
    # A static release swap does not require any service restart or nginx reload.
    try:
        served=subprocess.check_output(['curl','--fail','--silent','--show-error','--resolve','panel.mlkino.com:443:127.0.0.1','https://panel.mlkino.com/'])
        if hashlib.sha256(served).hexdigest()!=data['frontend_files']['index.html']:die('Nginx is not serving the expected release')
    except BaseException:
        if previous:frontend_swap(root,pathlib.Path(previous))
        raise
    print('Frontend activated:',target,'Previous:',previous)
def frontend_swap(root,target):
    if not target.is_dir() or target.parent.resolve()!=(root/'releases').resolve():die('Unreviewed rollback target')
    if not (target/'index.html').is_file():die('Rollback release missing index.html')
    link=root/('.rollback-'+str(os.getpid()));link.symlink_to(target);os.replace(link,root/'current')
def frontend_rollback(target):
    root=pathvar('FRONTEND_DIR','/var/www/mlkino-frontend');frontend_swap(root,target)
    print('Frontend reverted to',target)

if __name__=='__main__':
    os.umask(0o077);approve()
    if len(sys.argv)!=3:die('Usage: runtime.py ACTION RELEASE_OR_SNAPSHOT_PATH')
    action=sys.argv[1];handle=lock('backend' if action.startswith('backend') else 'frontend')
    {'backend-backup':lambda path:backup_backend(pathvar('BACKEND_DIR','/var/www/mlkino'),path),'backend-deploy':backend_deploy,'backend-rollback':backend_rollback,'frontend-deploy':frontend_deploy,'frontend-rollback':frontend_rollback}[action](pathlib.Path(sys.argv[2]).resolve())
