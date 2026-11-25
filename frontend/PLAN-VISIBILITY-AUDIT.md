# Plan visibility audit — 2026-11-25

The active production panel is `20261125-254289c-redesign`, based on redesign
source `17f4d42`. All 56 deployed files matched the deployment manifest when
checked again during this audit. Backend, landing and nginx services were active.

The redesign restricts both the plans menu and its routes to `superadmin`.
A read-only aggregate query of production accounts found three active ordinary
users and no superadmin accounts. Therefore none of the existing accounts can
see or open plan administration. Re-deploying the same assets cannot change
this permission result. The owner subsequently identified their account and
authorized granting it administrative access. Only that active account's
application role was changed from `user` to `superadmin`; its Django
`is_superuser` flag remains false. The original role was recorded in a private
server backup for rollback. No other accounts or environment settings changed.

`PlanNavigation.integration.test.tsx` renders the actual drawer and catalog
components. It verifies that the superadmin can navigate to plans and
capabilities and that all three other roles do not see these menu entries.
Together with the editor, local catalog, drawer permission and route access
tests, 37 tests across five suites passed.

The source plans feature is a frontend demo backed by `PlanDemoStore` and browser
localStorage. It does not persist subscriptions to PostgreSQL, implement billing,
or enforce purchased capabilities on backend API requests. Its preview warning
remains visible. Publishing the redesigned interface does not implement those
backend features. Prior asset-only verification did not establish authenticated
visibility or backend functionality; this audit records those limits explicitly.

The upstream `main` ref was checked again and still points to `17f4d42`. Its
subscription-related files are the plan editor, catalog, preview, capabilities,
local demo store and admin drawer entries. There is no separate role-specific
subscription selection or checkout flow to deploy from that source revision.
