# Full auth verification — 2026-11-19

Results:

- All 168 accounts/panel backend tests passed with isolated SQLite.
- All 149 frontend tests in 34 suites passed.
- All 6 deployment safety tests passed.
- Panel production build, landing standalone build and dedicated browser-QA build passed.
- Full Chrome auth lifecycle passed with third-party cookie restriction enabled.
- Landing Chrome smoke passed: desktop/mobile avatar, feed growth and return to the first card.
- Live CORS/CSRF smoke covers both local origins, production origin, four API paths,
  cookie/token matching, rejection of missing cookie/token and foreign origins, and
  CORS on 401/403/404 and gateway 413 responses.

The complete browser lifecycle includes real isolated Django registration and
HttpOnly JWT cookies, avatar upload/render, national/postal fields, profile update,
password login, OTP login, OTP password change inside the profile, incorrect OTP
rejection, password recovery and successful login with the new password.
SMS and identity/postal providers are simulated in that environment. No production
accounts were created, deleted or edited; no real SMS was sent by these tests.

A profile bug was found and fixed: explicitly clearing a postal code previously
fell back to the old code and triggered a provider request. Posting an unchanged,
previously verified postal address also triggered a needless lookup. Clearing is
now handled explicitly, unchanged verified addresses are preserved, and changed
or manually supplied addresses still go through the provider policy. Regression
tests cover clearing and avoiding unnecessary provider calls.

Old test mocks were updated to model the masked-CSRF bootstrap and complete-user
registration contract, without weakening production checks.

Reproduction: `deployment/qa/README.md`, `deployment/check-landing-browser.mjs`,
and `deployment/check-cors-production.py`.
Existing React test `act` warnings and pre-existing lint/deprecation warnings were
not treated as passing runtime checks; the isolated browser itself had no runtime
exceptions or observed API 5xx responses.
