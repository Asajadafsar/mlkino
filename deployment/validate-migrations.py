"""Run against staged code with the preserved production environment; read-only DB plan."""
import os,sys
sys.path.insert(0,os.getcwd())
import django;django.setup()
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
executor=MigrationExecutor(connection)
plan=executor.migration_plan(executor.loader.graph.leaf_nodes())
allowed={('accounts','0011_user_profile_updated_at_accountnotification_and_more')}
pending={(migration.app_label,migration.name) for migration,backwards in plan}
if any(backwards for migration,backwards in plan) or pending-allowed:
    raise SystemExit('Unexpected migration plan: '+str(sorted(pending)))
print('Validated additive migration plan:',sorted(pending))
