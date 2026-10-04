# Important Things — Web App

A React web port of the "Important Things" Android app: a personal vault for
bank account, application, and note credentials, backed by Firestore.

This port is **byte-for-byte compatible** with your existing Firestore data —
same encryption, same document layout — so it reads and writes the same
records your Android app does.

## 1. Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your existing Firebase project's config, from the
[Firebase Console](https://console.firebase.google.com/) → your project →
Project settings → General → Your apps → SDK setup and configuration. (If
your Android app doesn't have a registered "Web" app yet, add one there
first — it's free and doesn't affect your existing Android app.)

```bash
npm run dev       # local development
npm run build     # production build -> dist/
```

Deploy `dist/` anywhere that serves static files (Firebase Hosting, Vercel,
Netlify, etc). Firebase Hosting is a natural fit since you're already on
Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point it at the dist/ folder
firebase deploy
```

### Firestore security rules

The original app has no Firebase Auth — "login" is just a username/PIN check
against Firestore, done from the client. That means, today, **your Firestore
rules are almost certainly wide open** (or the Android app couldn't read/
write). This web app doesn't change that model. If you haven't already,
it's worth at least restricting writes to the shape you expect, e.g.:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true; // as permissive as the Android app already requires
      match /{category}/{docId} {
        allow read, write: if true;
      }
    }
  }
}
```

Tightening this further would require adding real Firebase Authentication,
which is a bigger change than a straight port — happy to help with that as a
follow-up if you want it.

## 2. What was ported, and how

| Original (Java/Android)                                     | This app (JS/React)          |
|---------------------------------------------------------------|--------------------------------|
| `services/AES.java`, `AESHelper.java`                        | `src/lib/crypto.js`           |
| `firebase/dao/AuthenticationDao.java` + user mapping           | `src/lib/authService.js`      |
| `firebase/dao/UserDetailsDao.java` + detail mapping             | `src/lib/detailsService.js`   |
| `common/Context.java` (in-memory session/cache)                 | `src/context/AppContext.jsx`  |
| `data/model/*`, `common/constants/*`                              | `src/models/constants.js`     |

The AES port was verified against a real run of the original Java code
(`AES/ECB/PKCS5Padding`, key = `SHA-1(secret)` truncated to 16 bytes) to
confirm it produces identical ciphertext for identical inputs.

## 3. Known quirks carried over from the original app

You asked to keep the exact same scheme, so these are preserved as-is rather
than "fixed." Worth knowing about:

- **The encryption key isn't really secret.** For detail records (bank
  accounts, applications, notes), the AES key is derived from your
  *username*, not your PIN. Anyone who knows your username and can read your
  Firestore data can decrypt everything. This encrypts data *at rest against
  casual viewing* (e.g. someone glancing at the Firestore console), but it
  is not meaningful protection against a motivated attacker. If you ever
  want to upgrade this, the fix is to derive the key from the PIN (or a
  proper password) using a KDF like PBKDF2/scrypt instead of a plain SHA-1
  hash of a non-secret value — happy to build that migration whenever you're
  ready.
- **Register with matching Name and Username.** The original app's data
  model uses your "Name" field as the actual encryption/session key after
  login, and your "Username" field only as the initial registration
  document ID. If they differ, login will silently fail to decrypt your PIN
  correctly. Your existing account already follows this pattern (that's why
  it works), so just keep doing the same for any new accounts.
- **Detail names become Firestore document IDs, encrypted.** Each detail's
  "Name" field is AES-encrypted and that ciphertext is used as its Firestore
  document ID. Base64 ciphertext can occasionally contain a `/`, which
  Firestore document IDs can't contain — if that happens, saving will fail
  with a network/save error. This is a pre-existing limitation of the
  original app's design, not something this port introduces. It's rare, but
  if you hit it, renaming the entry to something else will usually resolve
  it (different plaintext -> different ciphertext).
- **No password hashing.** The PIN is stored AES-encrypted (reversible), not
  hashed. This is a design choice from the original app since it needs to
  be reversible for the AES-key comparison used here — again, not something
  this port changes.

## 4. App structure

```
src/
  lib/
    crypto.js              AES port
    firebase.js             Firebase app/Firestore init
    authService.js           login/register (port of AuthenticationDao)
    detailsService.js        CRUD for details (port of UserDetailsDao)
  models/
    constants.js             Categories, DetailKeys, error codes
  context/
    AppContext.jsx            session state, in-memory + cross-refresh cache
  pages/
    Login.jsx                  unlock / create vault
    Dashboard.jsx                category overview
    CategoryView.jsx              list of entries within a category
    DetailFormPage.jsx             add / edit an entry
  components/
    DetailPanel.jsx                 view a single entry (reveal/copy sensitive fields)
    Header.jsx, VaultDial.jsx, ProtectedRoute.jsx
```

Session (`{username, displayName}`) is kept in `sessionStorage` so a page
refresh doesn't log you out, but closing the tab does. The last-used
username is remembered in `localStorage` to pre-fill the login form,
mirroring the original app's `CacheHelper`.
