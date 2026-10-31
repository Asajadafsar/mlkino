"""Keep all warnings visible; accept only the explicitly reviewed compatibility policy."""
import importlib,os,sys
sys.path.insert(0,os.getcwd())
import django;django.setup()
from django.conf import settings
from django.core import checks
legacy=importlib.import_module('mlkino.settings')
accepted={'security.W005','security.W021'}  # API-only HSTS; do not preload other domains.
if list(getattr(settings,'SECRET_KEY_FALLBACKS',[]))==[legacy.SECRET_KEY]:
    accepted.add('security.W025')  # Explicitly approved existing signed-session compatibility.
issues=checks.run_checks(tags=[checks.Tags.security],include_deployment_checks=True)
blocked=[issue for issue in issues if issue.level>=checks.WARNING and issue.id not in accepted]
for issue in issues:print(issue.id, 'BLOCKED' if issue in blocked else 'reviewed compatibility warning')
if blocked:raise SystemExit('Unexpected security check issue; refusing activation')
print('Security gate passed; reviewed warnings remain visible in deployment log.')
