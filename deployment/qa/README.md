# Isolated browser auth verification

These fixtures force temporary SQLite, random signing keys, loopback listeners,
temporary media and fake SMS/Jibit. They never use production settings or users.
The browser checks an isolation marker before sending any fixture credentials.
They are not included in runtime backend release archives.

Start the backend in one terminal:

```bash
python3 deployment/qa/auth_fixture_server.py > /private/tmp/mlkino-auth-qa-backend.log 2>&1
```

Build a dedicated frontend from `frontend/`:

```bash
PUBLIC_URL= BUILD_PATH=/private/tmp/mlkino-auth-qa-frontend-build \
REACT_APP_API_URL=http://127.0.0.1:3002 REACT_APP_WS_URL=ws://127.0.0.1:8104 \
GENERATE_SOURCEMAP=false npm run build
```

From the repository root, start its loopback static/proxy server:

```bash
MLKINO_QA_FRONTEND_BUILD=/private/tmp/mlkino-auth-qa-frontend-build \
node deployment/qa/auth_fixture_frontend.cjs
```

Start a dedicated Chrome debugging profile, never a personal browser profile:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
--headless=new --remote-debugging-port=9227 \
--user-data-dir=/private/tmp/mlkino-full-auth-chrome \
--no-first-run --no-default-browser-check about:blank
node deployment/qa/auth_browser.mjs
```

The browser enables third-party cookie restriction and exercises registration with
mandatory identity/address/photo, profile display/avatar/edit, password login,
OTP login, authenticated OTP password change, rejected incorrect OTP, password
recovery and login with the recovered password. It rejects browser runtime errors
and observed API 5xx responses. Its fixed OTP and identity/postal responses exist
only inside the isolated fixture process; no real SMS or identity lookup is made.

Stop these three servers/browser after verification. A new backend process creates
a fresh temporary database for a new run. Production cookie security and CSRF
checks are not bypassed: the tested application still uses its real middleware,
serializers, JWT sessions and local same-origin proxy.
