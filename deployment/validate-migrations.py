"""Run against staged code with the preserved production environment; read-only DB plan."""
import os,sys
sys.path.insert(0,os.getcwd())
import django;django.setup()
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
executor=MigrationExecutor(connection)
plan=executor.migration_plan(executor.loader.graph.leaf_nodes())
allowed={('accounts','0014_user_address_source'),('accounts','0013_agency_office_area'),('accounts','0012_user_national_code_image'),('panel','0007_property_records'),('panel','0008_estate_activity'),('accounts','0015_contract_relations_and_saved_reports'),('accounts','0016_versioned_expert_share'),('panel','0009_estate_workflows'),('panel','0010_private_financial_receipt'),('panel','0011_contract_relations_and_saved_reports'),('panel','0012_versioned_expert_share')}
pending={(migration.app_label,migration.name) for migration,backwards in plan}
allowed.add(('panel','0013_public_catalog_index'))
if any(backwards for migration,backwards in plan) or pending-allowed:
    raise SystemExit('Unexpected migration plan: '+str(sorted(pending)))
print('Validated additive migration plan:',sorted(pending))
