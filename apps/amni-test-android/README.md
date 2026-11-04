# Amni-Test for Android (tester app)

A native Android shell around **Test Town**, the 3D web scene at `/test/town/` (see [`/docs/amni-test/game/README.md`](../../docs/amni-test/game/README.md)). Testers use it to take Google Play closed tests, file check-ins and get reminders.

- **Sign-in:** native Google sign-in through Credential Manager. The app sends the Google ID token to `POST /api/auth/google` and keeps the Amni-Test session token in private storage.
- **Town:** a full-screen WebView that loads `<SITE>/test/town/?app=1`. The page reaches native features through `window.AmniApp` (below).
- **Background check (about every 6 hours):**
  - It reads `GET /api/assignments` and reports which active-test apps are installed (`POST /api/app/installs`).
  - It reminds the tester when a check-in window opens, when they are invited to a test, and when an active test's app is missing.
- **Updates:** on launch the app reads `<SITE>/test/app/latest.json` and offers newer APKs.

The app is **downloaded from amni-scient.com and sideloaded**. It is not on Google Play. This is why it may use `QUERY_ALL_PACKAGES`, which Play restricts.

| | |
|---|---|
| Application ID | `com.amniscient.amnitest` |
| minSdk / targetSdk / compileSdk | 26 / 34 / 34 |
| Language | Kotlin, plain Views, Gradle Kotlin DSL |

## Layout

The repo-wide `.gitignore` ignores every `src/` directory, so the module uses custom source sets (as `/sdk/amni-test-android` does):

| Path | What |
|---|---|
| `AndroidManifest.xml` | Manifest |
| `kotlin/com/amniscient/amnitest/` | App code |
| `res/` | Resources |
| `res-debug/` | Debug-only resources: a network security config that allows cleartext to `10.0.2.2`/`localhost` |
| `test/` | JVM unit tests |
| `build.gradle.kts`, `settings.gradle.kts`, `gradlew`, `gradle/wrapper/` | Build |

### Code

| File | Role |
|---|---|
| `AppLogic.kt` | Pure logic with no Android dependencies, fully unit-tested. It covers bridge input validation, origin checks, navigation rules, `latest.json` parsing and version comparison, assignment parsing, and which reminders to post. |
| `SignInActivity.kt` | Google sign-in through Credential Manager, plus a dev-only email sign-in |
| `MainActivity.kt` | WebView, navigation rules, error view, resume event, permission prompt, update dialog |
| `Bridge.kt` | `window.AmniApp` |
| `CheckInWorker.kt` | WorkManager periodic job |
| `Notifier.kt` | The "Check-ins" notification channel and posting |
| `Api.kt` | A small `HttpURLConnection` JSON client |
| `Session.kt` | Token and state in private SharedPreferences |
| `Account.kt` | Sign-in and sign-out side effects |
| `Installed.kt` | PackageManager lookups |
| `Links.kt` | Opens URLs in other apps; Play Store links go to the Play Store app |

## The `AmniApp` bridge

Every method takes and returns strings. Each one first checks that the WebView's current top-level page has exactly the origin of `SITE_URL` (scheme, host and port). If it does not, the method returns `""` or does nothing.

| Method | Returns / does |
|---|---|
| `getToken()` | The session token, for `Authorization: Bearer` |
| `getApiBase()` | The API base URL, without a trailing slash |
| `appVersion()` | The `versionName`, e.g. `"0.1.0"` |
| `installed(packagesJson)` | Takes a JSON array of at most 50 package names and returns `{"<pkg>": versionCode, …}`, with `0` for apps that are not installed. Returns `"{}"` if the input is not a valid array. |
| `openExternal(url)` | Opens an `http`/`https` URL outside the app. `play.google.com` links open the Play Store app when it is installed. |
| `haptic(kind)` | `light`, `success` or `warning` |
| `share(text)` | Opens the system share sheet. Text is cut to 4,000 characters. |
| `signOut()` | Clears the token, calls `POST /api/auth/logout` (best effort) and returns to sign-in |

Things the page should know:

- **Resume event.** When the app returns to the foreground, it runs `window.dispatchEvent(new CustomEvent('amniapp', {detail: {type: 'resume'}}))`.
- **User agent.** The WebView's user agent ends in `AmniTestApp/<version>`.
- **Navigation.**
  - Same-origin pages stay in the WebView.
  - Other `http(s)`, `market:` and `mailto:` links open in other apps.
  - Every other scheme is blocked.
- **No third-party iframes.** A JavaScript interface is visible to every frame of a page, but the origin check looks only at the top-level page. Pages on the site must not embed cross-origin iframes. Serve `Content-Security-Policy: frame-src 'self'` on `/test/town/`.

## Build

You need JDK 17 or newer and the Android SDK (platform 34, build-tools 34). Set `ANDROID_HOME` or write `sdk.dir` in `local.properties`.

```sh
./gradlew testDebugUnitTest      # JVM unit tests (AppLogic)
./gradlew assembleDebug          # build/outputs/apk/debug/amni-test-debug.apk
./gradlew assembleRelease        # build/outputs/apk/release/amni-test-release.apk (signed) or amni-test-release-unsigned.apk
./gradlew lintDebug              # build/reports/lint-results-debug.html
```

Configuration comes from Gradle properties. Pass them with `-P…` or put them in `~/.gradle/gradle.properties`. Never put them in this folder.

| Property | Default | Used for |
|---|---|---|
| `amniTestWebClientId` | empty (the Google button is hidden) | `BuildConfig.GOOGLE_WEB_CLIENT_ID` |
| `amniTestSiteUrl` | `https://amni-scient.com` | Release `SITE_URL` |
| `amniTestApiUrl` | `https://amni-test.amnibro7.workers.dev` | Release `API_URL` |
| `amniTestDebugSiteUrl` | `http://10.0.2.2:8080` | Debug `SITE_URL` |
| `amniTestDebugApiUrl` | `http://10.0.2.2:8787` | Debug `API_URL` |
| `amniTestKeystore`, `amniTestKeystorePassword`, `amniTestKeyAlias`, `amniTestKeyPassword` | none | Release signing; without all four the release APK is unsigned |

## Google sign-in setup

Credential Manager returns a Google ID token whose audience (`aud`) is the **web** OAuth client ID. That is the same client ID the Worker already verifies (`GOOGLE_CLIENT_ID`), so the API needs no changes. For Google to issue that token to this app, the Google Cloud project also needs an **Android** OAuth client that matches the app's package name and signing certificate.

1. In Google Cloud Console, open **APIs & Services → Credentials** in the project that owns the web client used on `/test/`.
2. Copy the **Web application** client ID, which ends in `.apps.googleusercontent.com`. Build with it:
   ```sh
   ./gradlew assembleRelease -PamniTestWebClientId=1234-abc.apps.googleusercontent.com
   ```
3. **Create credentials → OAuth client ID → Android:**
   - **Package name:** `com.amniscient.amnitest`
   - **SHA-1 certificate fingerprint:** the SHA-1 of the key that signs the APK. Get it with:
     ```sh
     keytool -list -v -keystore /path/to/release.jks -alias <alias>      # release key
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android   # debug key
     ```
     Or run `./gradlew signingReport`.
   - Create one Android client per signing key you use (release, and each developer's debug key).
   - The app never uses the Android client's ID. Google only checks that the client exists.
4. The OAuth consent screen must be published, or list your test accounts as test users.

If sign-in shows "Google sign-in didn't work: … [16] Account reauth failed" or a "developer console is not set up correctly" error, the Android client is missing, or its package name or SHA-1 does not match the APK's signing key.

## Release signing

Create a keystore once and keep it outside the repo. Back it up: every update must be signed with the same key, or Android refuses to install it over the old one.

```sh
keytool -genkeypair -v -keystore ~/keys/amni-test-release.jks -alias amnitest \
  -keyalg RSA -keysize 4096 -validity 10000
```

In `~/.gradle/gradle.properties`:

```properties
amniTestKeystore=/home/you/keys/amni-test-release.jks
amniTestKeystorePassword=…
amniTestKeyAlias=amnitest
amniTestKeyPassword=…
amniTestWebClientId=1234-abc.apps.googleusercontent.com
```

Then build with `./gradlew assembleRelease`. The output is `build/outputs/apk/release/amni-test-release.apk`. `*.jks`, `*.keystore` and `keystore.properties` are git-ignored here. Never commit them.

## Publishing on amni-scient.com

1. Bump `versionCode` (by 1 or more) and `versionName` in `build.gradle.kts`.
2. Build and sign the release APK.
3. Upload it to the site, for example `/test/app/amni-test-0.2.0.apk`. Serve it as `application/vnd.android.package-archive`.
4. Publish `/test/app/latest.json`:
   ```json
   { "versionCode": 2, "versionName": "0.2.0", "url": "https://amni-scient.com/test/app/amni-test-0.2.0.apk" }
   ```
   - `url` must be `https`. Plain `http` is accepted only on the site's own origin, for local testing.
   - If the file is missing or malformed, the app skips the update check.
   - Installed apps with a lower `versionCode` show an **Update available** dialog on launch. **Download** opens the URL in the browser.
5. Link the APK from the tester pages. Testers need to allow "Install unknown apps" for their browser once. Publishing the APK's SHA-256 next to the link lets careful users verify it: `sha256sum amni-test-release.apk`.

## Local testing with the emulator

The debug build talks to `http://10.0.2.2:8080` (site) and `http://10.0.2.2:8787` (API). `10.0.2.2` is the host machine as seen from the Android emulator. Cleartext HTTP is allowed only to `10.0.2.2`, `localhost` and `127.0.0.1`, and only in debug builds.

1. Start the API on the host:
   ```sh
   cd workers/amni-test && npx wrangler dev --env dev --port 8787 --ip 0.0.0.0
   ```
   - The `dev` environment sets `DEV_AUTH=1`, so the sign-in screen shows an email field for dev sign-in.
   - **CORS:** the town page calls the API from origin `http://10.0.2.2:8080`. Add that origin to `ALLOWED_ORIGINS` for the dev environment (in `wrangler.toml` `[env.dev.vars]` or `.dev.vars`). Native calls (sign-in, background check) send no `Origin` header and are not affected.
2. Serve the site root on port 8080 from the repo root, for example `npx http-server -p 8080 .`, so that `/test/town/` and `/test/app/latest.json` resolve.
3. Build and install:
   ```sh
   ./gradlew installDebug
   adb shell am start -n com.amniscient.amnitest/.MainActivity
   ```
4. Debug WebView pages from desktop Chrome at `chrome://inspect`. WebView debugging is on in debug builds only.
5. To run the background check now instead of waiting up to 6 hours:
   ```sh
   adb shell dumpsys jobscheduler | grep -A3 com.amniscient.amnitest   # find the job id (JOB #u0a…/<id>)
   adb shell cmd jobscheduler run -f com.amniscient.amnitest <id>
   ```
   Android Studio's App Inspection → Background Task Inspector shows the job and its runs.

**Physical device:** run `adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8787 tcp:8787`, then build with `-PamniTestDebugSiteUrl=http://localhost:8080 -PamniTestDebugApiUrl=http://localhost:8787`. The dev worker already allows the `http://localhost:8080` origin.

**Google sign-in in debug:** pass `-PamniTestWebClientId=…` and register the debug key's SHA-1 as an Android OAuth client (see above). The emulator image must include Google Play services, and a Google account must be signed in on it. The local worker also needs `GOOGLE_CLIENT_ID` set to the same web client ID.

## Notes

- **Session token storage.** The token is kept in private SharedPreferences and is excluded from cloud backup and device-to-device transfer (`allowBackup=false` plus `res/xml/data_extraction_rules.xml`). A `401` from the background check clears it and stops the periodic job. The next app launch then shows the sign-in screen.
- **Reminders.** Each reminder has a key: `checkin:<id>:<day>`, `invited:<id>` or `missing:<id>`. A reminder is not posted again while its condition still holds. A key is forgotten once its condition ends, so if a test app is uninstalled a second time, the reminder comes back.
- **Notification permission.** On Android 13+ the app asks once, the first time the town opens after sign-in. If the tester allows it, a check runs right away. If they say no, nothing is posted and nothing breaks.
- **Install reports.** Installs reported by the app are recorded with `src = 'app'` and never approve a completion automatically; only SDK pings do (see the game README).
