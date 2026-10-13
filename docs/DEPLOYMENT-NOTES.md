# Deployment notes

## Web (GitHub Pages)

- Repo: `RahulTarigoppula/self-learn-napkin` (public). Pages source = **GitHub Actions** (set via the API on first deploy).
- Every push to `main` runs `.github/workflows/pages.yml`: unit tests → `npm run build` with `VITE_BASE_PATH=/self-learn-napkin/` → deploy.
- URL: https://rahultarigoppula.github.io/self-learn-napkin/
- Rollback: re-run an older successful "Deploy to GitHub Pages" run, or `git revert` and push. The service worker uses `skipWaiting: true`: a new deploy downloads in the background, takes over, and the page reloads once onto it (during a review session it asks first). Progress in IndexedDB/localStorage is never touched by an update, and Settings has a "Get the latest version" button that clears only the cached app files.

## Android (signed APK)

- `.github/workflows/android-release.yml` builds the same site with `VITE_BASE_PATH=/` and `VITE_PLATFORM=android`, runs `npx cap sync android`, and `./gradlew :app:assembleRelease` with Temurin 21.
- Push a tag `vX.Y.Z` → the APK (`napkin.apk` and `napkin-X.Y.Z.apk`) plus `SHA256SUMS.txt` are attached to a GitHub Release. Pushes to `main` upload the APK as a workflow artifact.
- `versionCode` = workflow run number (always increasing), `versionName` = tag without the `v`.

### Signing key: back it up

- The PKCS12 keystore and its password were generated locally with OpenSSL and live in `.secrets/` in this folder (git-ignored):
  - `.secrets/napkin-release.p12` (alias `release`)
  - `.secrets/napkin-release.password.txt` (store password = key password)
- The same values are stored as repository secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- **Copy `.secrets/` to a password manager and an offline backup.** Losing the key means future APKs cannot update an installed app (an uninstall would wipe local progress, so export a backup first in Settings).

## Local commands

On Windows Git Bash, prefix commands that pass a leading-slash value with `MSYS_NO_PATHCONV=1`, otherwise `VITE_BASE_PATH=/` becomes `C:/Program Files/Git/`:

```bash
MSYS_NO_PATHCONV=1 VITE_BASE_PATH=/self-learn-napkin/ npm run build
MSYS_NO_PATHCONV=1 VITE_BASE_PATH=/ VITE_PLATFORM=android npm run build && npx cap sync android
```
