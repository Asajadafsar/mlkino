# Auth and profile release — 2026-11-17

Registration requires first/last name, verified phone, email, profile photo,
national code matched to that phone, date of birth, postal code and provider address,
password confirmation and user type. Account ID, role and timestamps are server-managed.
Incomplete regular accounts resume registration; private panel APIs reject them.
Provider outages and manual addresses cannot bypass registration verification.

Passwords retain their exact characters through registration and OTP recovery.
Both password and OTP login follow `complete_register`. The registration client now
uses the same `/api/accounts/` routes as Django. Production uses the same site origin.
Local landing uses 3000, panel 3001 and API 8000; local LAN origins remain development-only.

Landing desktop and mobile account controls use the authenticated session avatar.
The infinite feed retains earlier cards and uses browser content visibility to reduce
offscreen painting, so returning to the start does not expose removed-card spacers.

Validation:

- 22 backend tests: registration contract, landing session and provider outage policy.
- 15 frontend tests: auth, postal lookup, destinations, API host selection and both OTP password flows.
- React production build for `/panel/` and Next standalone production build succeeded.
- Isolated Chrome: desktop/mobile avatar, feed growth and return to the first card; no runtime exceptions.
- Real Jibit token generation succeeded previously with server-side credentials; no real national code,
  postal address or SMS was submitted by automated tests.

Deployment target: `/opt/mlkino/current` on the new Debian server, services
`mlkino-backend` and `mlkino-landing`. Existing environment, provider code, database
and media must be preserved. Archive preparation: `python3 deployment/prepare-auth-release.py RELEASE`.
Compare backend baseline hashes, back up the database and replaced files, check Django,
then activate frontend and standalone landing and restart both services. Verify HTTPS,
API session and static files after activation.

At preparation time SSH stopped responding during banner exchange and public HTTPS
timed out. This record does not claim a successful server deployment.
