# Panel redesign integration — 2026-11-25

Source: https://github.com/mhk8691/mlkino, frontend at commit 17f4d42.
The frontend design changes were merged against the shared 4dfd04d baseline.
Current CSRF bootstrap, same-origin local proxy, Windows start scripts, /panel
router basename, mandatory registration and OTP password-change flow were retained.
No backend, migrations, production environment or user media are part of this release.

Files and archives retain the source repository defaults, including its local
design demo data and local interactions. Their real API modes remain accessible
with ?demo=0. Requests retain the source ?demo=1 preview mode.
Plan management remains the source repository's clearly labelled browser-only demo.

Validation: full frontend tests, TypeScript and production build; isolated Chrome
registration, profile/avatar editing, password/OTP login, authenticated OTP password
change and recovery; authenticated desktop/mobile dashboard without horizontal overflow.
Real SMS and Jibit were simulated only in the isolated QA server. Production accounts
were not modified for testing.

All 205 frontend tests in 55 suites passed. TypeScript and production build passed.
Desktop/mobile authenticated screenshots were inspected; the mobile viewport and
document width both measured 390px. Full isolated auth lifecycle passed.

Deployed release: `20261125-0a0f02e-redesign`. Previous production build and backup
are recorded in `REDESIGN-DEPLOYMENT.json`. Live panel HTML and main JS/CSS hashes
match this build; CORS/CSRF smoke passed. No backend or database changes were made.

Complete-design correction: the source demo defaults were restored after the owner
requested the exact complete design behavior. 116 of 120 changed source frontend
files match byte-for-byte; the four differences are the root auth destination,
Home registration gate, Profile OTP security integration and its API-call test.
All new design modules/routes are included.

Superseding complete release: `20261125-254289c-redesign`. All 56 served build
files (including lazy chunks) were verified against SHA256; ten feature routes
returned the new HTML. All 205 tests passed. The source preview feature defaults
are now active. The earlier live-data-default substitution was removed.
