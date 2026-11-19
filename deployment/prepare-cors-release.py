"""Prepare the reviewed local-to-production CORS release, excluding secrets/media."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('release')
parser.add_argument('--baseline',required=True)
parser.add_argument('--nginx-baseline-sha256',required=True)
args=parser.parse_args()
if not args.release.replace('-','').isalnum():raise SystemExit('Invalid release')
output=root/'deployment/artifacts'/args.release
output.mkdir(parents=True,exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=['accounts/csrf_api.py','accounts/middleware.py','accounts/urls.py','mlkino/urls.py','mlkino/production_settings.py']
manifest={'release':args.release,'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'backend':{},'archives':{},
    'nginx_baseline_sha256':args.nginx_baseline_sha256}
with tarfile.open(output/'backend.tar.gz','w:gz') as archive:
    for name in files:
        baseline=subprocess.run(['git','show',args.baseline+':'+name],cwd=root,capture_output=True)
        manifest['backend'][name]={'sha256':sha(root/name),'baseline_sha256':hashlib.sha256(baseline.stdout).hexdigest() if baseline.returncode==0 else None}
        archive.add(root/name,arcname=name)
for part,source in [('frontend',root/'frontend/build'),('landing',root/'landing/.next/standalone'),('nginx',root/'deployment/nginx')]:
    if part=='frontend' and not (source/'index.html').is_file():raise SystemExit('Build frontend first')
    if part=='landing' and not (source/'.next/static').is_dir():raise SystemExit('Copy static/public into standalone first')
    paths=sorted(source.rglob('*')) if part!='nginx' else sorted(source.glob('api-cors-error-*.conf'))
    with tarfile.open(output/(part+'.tar.gz'),'w:gz') as archive:
        for path in paths:
            if path.is_file() and path.suffix not in ('.map','.zip'):archive.add(path,arcname=str(path.relative_to(source)),recursive=False)
for path in output.glob('*.tar.gz'):manifest['archives'][path.name]=sha(path)
(output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(output/'SHA256SUMS').write_text(''.join(f'{value}  {name}\n' for name,value in manifest['archives'].items()))
print(output)
