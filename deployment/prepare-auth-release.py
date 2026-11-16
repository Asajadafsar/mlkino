"""Package the current server's auth/profile update without settings, secrets or media."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('release')
args = parser.parse_args()
if not args.release.replace('-', '').isalnum():
    raise SystemExit('Invalid release name')
output = root / 'deployment/artifacts' / args.release
output.mkdir(parents=True, exist_ok=False)
backend_files = ['accounts/authentication.py', 'accounts/models.py', 'accounts/serializers.py', 'accounts/views.py']
manifest = {
    'release': args.release,
    'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
    'protected': ['mlkino/settings.py', 'mlkino/production_settings.py', 'mlkino/urls.py',
                  'accounts/services/', '/etc/mlkino/', '/var/lib/mlkino/media/'],
    'backend': {}, 'archives': {},
}
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
with tarfile.open(output / 'backend.tar.gz', 'w:gz') as archive:
    for name in backend_files:
        archive.add(root / name, arcname=name)
        baseline = subprocess.check_output(['git', 'show', '51f047a:' + name], cwd=root)
        manifest['backend'][name] = {'sha256': sha(root/name), 'baseline_sha256': hashlib.sha256(baseline).hexdigest()}
for name, source in [('frontend', root/'frontend/build'), ('landing', root/'landing/.next/standalone')]:
    if not (source / ('index.html' if name == 'frontend' else 'server.js')).is_file():
        raise SystemExit(f'Missing {name} production build')
    if name == 'landing' and not (source/'public/images').is_dir():
        raise SystemExit('Copy landing public and .next/static into standalone before packaging')
    with tarfile.open(output / (name + '.tar.gz'), 'w:gz') as archive:
        for path in sorted(source.rglob('*')):
            if path.is_file() and path.suffix not in ('.map', '.zip'):
                archive.add(path, arcname=str(path.relative_to(source)), recursive=False)
for path in sorted(output.glob('*.tar.gz')):
    manifest['archives'][path.name] = sha(path)
(output/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
(output/'SHA256SUMS').write_text(''.join(f'{digest}  {name}\n' for name,digest in manifest['archives'].items()))
print(output)
