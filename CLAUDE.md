# Head Detective Dashboard (مكتب رئيس التحقيق)

Arabic RTL PWA for a head investigator to track detectives, cases, leaves, attendance and the monthly duty schedule. Secretaries log in by phone number (no OTP) and enter data; the head reviews everything, approves edits and receives notifications.

## Stack
- Single-file app: `index.html` (vanilla JS, no build step). All UI, data layer and logic live there.
- Firebase project `hasan-head-detective`:
  - Firestore collections: `users`, `detectives`, `cases`, `leaves`, `attendance`, `schedules`, `requests`, `activity`
  - Storage for case attachments and schedule photos
  - Anonymous Auth (silent sign-in so rules can require `request.auth != null`)
  - Cloud Messaging for push (VAPID key goes in `CONFIG.fcmVapidKey` in `index.html`)
- `sw.js` = service worker (offline shell cache + FCM background messages)
- `manifest.json` + `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` = installable PWA
- `functions/index.js` = 2nd-gen Cloud Function (Node 22, region `europe-west1`) that pushes a notification to every head device on each secretary write to `activity`
- `firebase.json` points Functions at `functions/`

## Hosting
- GitHub Pages, repo `head-detective/hasan`, branch `main`, root folder
- Live URL: https://head-detective.github.io/hasan/
- The site lives under `/hasan/`, so every asset path must stay RELATIVE (`./`, `icon-192.png`, `sw.js`, `manifest.json`). Never use leading-slash paths.
- Deploy web: `git push` (Pages builds automatically, ~1 min)
- Deploy function: `firebase deploy --only functions` (project is already selected with `firebase use`)

## Roles & permissions (do not bypass)
- `head` = رئيس التحقيق: sees everything, edits directly, approves/rejects `requests`, manages `users`
- `secretary` = سكرتارية: sees only entry forms and their own entries. Adds (new case, leave, attendance, case movement, file upload) are written directly. Edits/deletes of existing records create a `requests` doc with `status: pending` that the head approves.
- Every write logs to `activity` with `by`, `byName`, `role`, `at` so the head can see who entered what.
- First registered phone becomes head unless `CONFIG.headPhones` lists specific numbers.

## Conventions
- UI is Arabic RTL. UI strings in Arabic; code comments may be Arabic or English.
- Dates stored as ISO strings `YYYY-MM-DD`; timestamps as ISO strings. No Firestore Timestamp objects.
- After ANY change to `index.html`, bump `CACHE` in `sw.js` (`hd-v2` → `hd-v3` …) so installed phones pick up the update.
- Keep it one file. Don't introduce a bundler, framework or npm build for the web app.
- Never commit secrets beyond the public Firebase web config already in `index.html` and `sw.js`. `functions/node_modules` and `.firebase/` are git-ignored.
- Test on a phone-width viewport (≤860px) after UI changes: bottom tab bar, card-style tables, full-width buttons.

## Business rules
- Permission (استئذان) limit: 4 per month / 12 hours per month per detective (`PERM_MAX_COUNT`, `PERM_MAX_HOURS`).
- Open case with no movement for 7+ days → alert.
- Leave types: `annual` دورية, `sick` طبية, `emergency` طارئة, `permission` استئذان.
- Case statuses: قيد التحقيق, محالة للنيابة, محفوظة, مغلقة (first two count as open).
- Duty schedule (`schedules`) is one doc per month `{ month: "YYYY-MM", days: { "01": [detectiveIds] }, imageUrl }`; home page shows today's and tomorrow's detectives from it.

## Firebase rules currently in use
Firestore and Storage both: `allow read, write: if request.auth != null;`
Authorized Auth domain must include `head-detective.github.io`.
