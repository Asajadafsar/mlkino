# Active redesign completion checklist

- [x] Responsive sidebar collapse/expand (desktop rail + mobile drawer).
- [x] Tasks: date visibility, Tehran timezone, list/search/status/scope, create/status/edit flow, dedicated design and today widget.
- [x] Tickets: nonadmin card/filter/create flow; admin management/filter/conversation/status/assignment; files; responsive.
- [x] Profile: shared personal details/avatar/postal editor used for self + user create/edit; only supported writable fields.
- [x] Profile backend/UI: password, preferences/notifications, privacy, tracked sessions and revocation, own activity.
- [x] Logs: responsive redesign, real stats/search/date/method/status/actor filters, details and CSV.
- [x] Settings: categorized responsive redesign; all displayed controls persist through API and are applied where relevant.
- [x] Relevant API/permission/regression tests + frontend tests + production build.
- [x] Browser verification for admin and nonadmin on desktop and mobile, including future task visibility and persistence.

References are the four images in ~/.codex/attachments/c81c8864-f8ad-4d8f-b352-6e4ec11e1c96/.
Verified on 2026-10-31:
- 33 backend tests passed in isolated SQLite, including user scope, future tasks, tickets, log filters/export, settings, profile preferences, session revocation and legacy upgrade, password changes, and privacy.
- 84 frontend tests passed; production build succeeded (existing unrelated lint warnings remain).
- Local database migration check passed.
- Real Chrome: desktop users/announcements/tasks/tickets/profile/logs/settings, sidebar persistence, current-device identification; mobile pages have no document-width overflow and no JavaScript errors.
- Real flows: future task appeared immediately and survived reload; settings saved/reloaded; all profile tabs loaded; agency expert routing; user ticket creation/reply and superadmin reply; ordinary-role users menu hidden and API denied; impersonation return without password.
- Only the ticket/task created by browser verification were removed after verifying their exact identities. Existing user data and conversations were retained.
