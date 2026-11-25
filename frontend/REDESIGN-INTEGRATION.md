# Panel redesign integration — 2026-11-25

Source: https://github.com/mhk8691/mlkino, frontend at commit 17f4d42.
The frontend design changes were merged against the shared 4dfd04d baseline.
Current CSRF bootstrap, same-origin local proxy, Windows start scripts, /panel
router basename, mandatory registration and OTP password-change flow were retained.
No backend, migrations, production environment or user media are part of this release.

Files and archives use real API data by default. Explicit development demos remain
available for design tests; production does not enable them through query strings.
Plan management remains the source repository's clearly labelled browser-only demo.

Validation: full frontend tests, TypeScript and production build; isolated Chrome
registration, profile/avatar editing, password/OTP login, authenticated OTP password
change and recovery; authenticated desktop/mobile dashboard without horizontal overflow.
Real SMS and Jibit were simulated only in the isolated QA server. Production accounts
were not modified for testing.
