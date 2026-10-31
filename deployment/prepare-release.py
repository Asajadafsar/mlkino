#!/usr/bin/env python3
"""Build an allowlisted release from this dirty worktree without shipping secrets/media."""
import argparse, hashlib, json, pathlib, shutil, subprocess, tarfile, datetime
ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--release', required=True)
parser.add_argument('--baseline', default='deployment/audit/server-files.json', help='Reviewed current server hashes relative to repository root')
args = parser.parse_args()
if not args.release.replace('-', '').isalnum(): raise SystemExit('Invalid release identifier')
out = ROOT/'deployment/artifacts'/args.release
out.mkdir(parents=True, exist_ok=False)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
base = json.loads((ROOT/args.baseline).read_text())['files']
files = [f'accounts/{name}.py' for name in ['authentication','client_ip','cookies','models','serializers','urls','validators','views','middleware','notices','profile_api','sessions']]
files += [f'panel/{name}.py' for name in ['models','serializers','urls','views','settings_api','settings_models','settings_runtime','ws_auth','ws_consumers','ws_events','ws_routing']]
files += ['panel/settings_defaults.json','mlkino/asgi.py','mlkino/production_release.py','accounts/migrations/0011_user_profile_updated_at_accountnotification_and_more.py']
sources = {name:ROOT/name for name in files}
# Retain the exact already-applied production history. Never ship local 0003/0004.
for path in (ROOT/'deployment/server-reference/panel/migrations').glob('*.py'):
    sources[str(path.relative_to(ROOT/'deployment/server-reference'))] = path
sources['accounts/migrations/0010_agencyprofile_expertprofile.py'] = ROOT/'deployment/server-reference/accounts/migrations/0010_agencyprofile_expertprofile.py'
with tarfile.open(out/'backend.tar.gz','w:gz') as archive:
    for name, path in sorted(sources.items()): archive.add(path, arcname=name, recursive=False)
manifest = {'release':args.release,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'backend_base_revision':'a9db304','baseline':base,'files':{name:sha(path) for name,path in sorted(sources.items())},'new_migrations':['accounts.0011_user_profile_updated_at_accountnotification_and_more'],'protected':['mlkino/settings.py','mlkino/urls.py','accounts/services/','accounts/utils.py','accounts/permissions.py','media/','venv/','.env*','staticfiles/']}
for name,repo in [('backend',ROOT),('frontend',ROOT/'frontend')]:
    manifest[name+'_revision'] = subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
    (out/(name+'-worktree-status.txt')).write_text(subprocess.check_output(['git','-C',str(repo),'status','--short'],text=True))
build=ROOT/'frontend/build'
if not (build/'index.html').is_file(): raise SystemExit('Run production frontend build first')
js='\n'.join(p.read_text() for p in (build/'static/js').glob('*.js'))
if 'https://api.mlkino.com' not in js or 'wss://api.mlkino.com' not in js: raise SystemExit('Production API/WS origin missing')
# Only reject actual local URL literals, not explanatory text or host-name normalization.
if 'http://127.0.0.1:8000' in js or 'http://localhost:8000' in js: raise SystemExit('Local API URL in production bundle')
with tarfile.open(out/'frontend.tar.gz','w:gz') as archive:
    for path in sorted(build.rglob('*')):
        if path.is_file() and path.suffix not in ['.map','.zip']: archive.add(path,arcname=str(path.relative_to(build)),recursive=False)
manifest['frontend_files']={str(p.relative_to(build)):sha(p) for p in build.rglob('*') if p.is_file() and p.suffix not in ['.map','.zip']}
manifest['archives']={name:sha(out/name) for name in ['frontend.tar.gz','backend.tar.gz']}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'SHA256SUMS').write_text(''.join(f'{value}  {name}\n' for name,value in manifest['archives'].items()))
(out/'DIFF-REVIEW.txt').write_text('\n'.join(f'{"NEW" if name not in base else "CHANGED" if base[name]!=digest else "UNCHANGED"} {name}' for name,digest in manifest['files'].items())+'\n')
print(out)

# Deployment tooling is a separate root-private upload, never part of the web root.
tools = [ROOT/name for name in ['DEPLOYMENT.md','PRODUCTION_CHECKLIST.md','deploy-frontend.sh','deploy-backend.sh','rollback-frontend.sh','rollback-backend.sh']]
tools += [p for p in (ROOT/'deployment').rglob('*') if p.is_file() and 'artifacts' not in p.parts and '__pycache__' not in p.parts]
with tarfile.open(out/'deployment-tools.tar.gz','w:gz') as archive:
    for path in sorted(tools):archive.add(path,arcname=str(path.relative_to(ROOT)),recursive=False)
(out/'TOOLS-SHA256SUMS').write_text(f"{sha(out/'deployment-tools.tar.gz')}  deployment-tools.tar.gz\n")
