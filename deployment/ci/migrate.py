"""Run from a staged release as the mlkino service account."""
import os
import sys

import django

sys.path.insert(0, os.getcwd())
django.setup()

from django.db import connection, migrations, models
from django.db.migrations.executor import MigrationExecutor

if (
    connection.vendor != "postgresql"
    or connection.settings_dict["NAME"] != "mlkino_db"
    or connection.settings_dict["HOST"] != "127.0.0.1"
    or str(connection.settings_dict["PORT"]) != "5432"
):
    raise SystemExit("Production database differs from the configured backup target.")

with connection.cursor() as cursor:
    cursor.execute("SET lock_timeout = '5s'")
    cursor.execute("SET statement_timeout = '60s'")

executor = MigrationExecutor(connection)
loader = executor.loader
loader.check_consistent_history(connection)
if set(loader.applied_migrations) - set(loader.disk_migrations):
    raise SystemExit("Applied migrations missing from the release. Reconcile the production graph first.")
conflicts = loader.detect_conflicts()
if conflicts:
    raise SystemExit(f"Conflicting migrations: {conflicts}")

targets = loader.graph.leaf_nodes()
plan = executor.migration_plan(targets)
for migration, backwards in plan:
    if backwards or not migration.atomic or not migration.operations:
        raise SystemExit(f"Migration requires a reviewed maintenance procedure: {migration}")
    for operation in migration.operations:
        allowed = type(operation) is migrations.CreateModel or (
            type(operation) is migrations.AddField
            and operation.field.concrete
            and operation.field.null
            and not operation.field.db_index
            and not operation.field.unique
            and not operation.field.has_default()
            and operation.field.db_default is models.NOT_PROVIDED
            and not operation.field.generated
        )
        if not allowed:
            raise SystemExit(f"Migration is outside the automatic allowlist: {migration}: {operation}")
if sys.argv[1:] == ["--apply"]:
    executor.migrate(targets, plan=plan)
    if MigrationExecutor(connection).migration_plan(targets):
        raise SystemExit("Pending migrations after apply.")
elif sys.argv[1:] != ["--plan"]:
    raise SystemExit("Expected --plan or --apply")
print(f"Validated {len(plan)} forward-compatible migrations.", flush=True)
