# Amni-Test SDK for Android

A small Android library for apps tested through [Amni-Test](https://amni-scient.com/test/).
Amni-Test pays testers to stay in your Google Play closed test for 14 days. When a
campaign uses SDK verification, this library proves two things:

1. **Which tester installed the build.** The tester's claim code reaches the app
   through the Play Install Referrer (or the tester types it in), and the SDK claims it.
2. **That the app is opened during the test.** The SDK sends one ping per UTC day,
   when an activity of your app comes to the foreground.

Completion is approved automatically only if a ping arrives on day 13 or later.

- Kotlin, `minSdk` 21, compiled against API 34.
- One dependency: `com.android.installreferrer:installreferrer:2.2`.
- No AndroidX, AppCompat or Material. The claim dialog is a plain `android.app.AlertDialog`.
- Adds the `INTERNET` permission.
- Never throws into your app. Problems are logged at debug level under the tag `AmniTest`.

## Put it in your closed-test build only

The SDK exists for the 14-day closed test. Keep it out of your production release.
Two easy ways to do that:

**A `testing` product flavor** (the SDK is only compiled into that flavor):

```kotlin
// app/build.gradle.kts
android {
    flavorDimensions += "track"
    productFlavors {
        create("testing") { dimension = "track" }
        create("production") { dimension = "track" }
    }
}

dependencies {
    "testingImplementation"(project(":amni-test"))
}
```

Then call `AmniTest.init(...)` from an `Application` class under `app/src/testing/`.

**A `BuildConfig` flag** (simpler, but the code ships in every build):

```kotlin
android {
    buildFeatures { buildConfig = true }
    defaultConfig { buildConfigField("boolean", "AMNI_TEST", "false") }
    buildTypes {
        create("closedTest") {
            initWith(getByName("release"))
            buildConfigField("boolean", "AMNI_TEST", "true")
        }
    }
}
```

```kotlin
if (BuildConfig.AMNI_TEST) AmniTest.init(this, "YOUR_SDK_KEY")
```

## Install

### As a local module (for now)

1. Copy this folder into your project, for example as `amni-test/`.
2. Include it in `settings.gradle.kts`:

   ```kotlin
   include(":amni-test")
   project(":amni-test").projectDir = file("amni-test")
   ```

3. Depend on it from your app (or only from the `testing` flavor, as above):

   ```kotlin
   dependencies {
       implementation(project(":amni-test"))
   }
   ```

The module's `build.gradle.kts` applies `com.android.library` and
`org.jetbrains.kotlin.android` without versions, so it uses the versions your
project already declares. Its own `settings.gradle.kts`, `gradlew` and
`gradle/` folder are only for building the library on its own; your build ignores them.
Your project must use the Kotlin Android plugin and the `google()` and
`mavenCentral()` repositories. This has been checked with AGP 8.5.2 + Kotlin 1.9.24
(the standalone build) and AGP 8.7.3 + Kotlin 2.1.0 (as a module of an app, with R8
on). AGP 9's built-in Kotlin has not been checked yet; if your build complains about
the `org.jetbrains.kotlin.android` plugin, remove that line from this module's
`build.gradle.kts`.

### JitPack (later)

A JitPack or Maven Central artifact is planned so you can add a single
`implementation("...")` line. Until then, use the local module.

## Set it up

### 1. Get your SDK key

Open your campaign on [amni-scient.com/test/](https://amni-scient.com/test/) and
choose SDK verification. The campaign page shows the campaign's **SDK key**. It
identifies the campaign. It is not a secret in the cryptographic sense, but it is
only useful together with your package name and a tester's claim code.

### 2. Call `init` in your `Application`

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        AmniTest.init(this, sdkKey = "YOUR_SDK_KEY")
    }
}
```

Register the class in your manifest with `android:name=".MyApp"` if you have not already.

Options:

```kotlin
AmniTest.init(
    context = this,
    sdkKey = "YOUR_SDK_KEY",
    baseUrl = AmniTest.DEFAULT_BASE_URL, // https://amni-test.amnibro7.workers.dev
    autoPrompt = true,                    // default false, see below
)
```

From Java: `AmniTest.init(this, "YOUR_SDK_KEY");` (overloads are generated).

What `init` does:

- Creates a random install ID (UUID) the first time and keeps it in the app's
  `SharedPreferences` file `amnitest`.
- If this install has not claimed a code yet, reads the Play Install Referrer once,
  looks for `amnitest=<CODE>` and claims that code with the server. If the network
  is down, it tries again on later launches.
- Watches your activities. Each time one resumes, it sends the daily ping if
  today's (UTC) ping has not been accepted yet. A day only counts as done when the
  server answers HTTP 200, so a failed ping is retried on the next resume (at most
  once a minute).
- If `sdkKey` is blank, the SDK does nothing.

### 3. The tester's install link

Amni-Test gives each tester a link like this, with their own code:

```
https://play.google.com/store/apps/details?id=<your.package>&referrer=amnitest%3DAT-XXXX-XXXX
```

Play passes `amnitest=AT-XXXX-XXXX` to the app as the install referrer, and the SDK
claims it on first launch. The tester needs no extra steps.

The referrer can be missing: the tester installed from the plain Play listing or
from the testing opt-in page, reinstalled, or the Play Store on the device does not
support the referrer. For those cases, let the tester type the code.

### 4. Let testers type the code: `showClaimDialog`

```kotlin
AmniTest.showClaimDialog(activity)
```

Shows a small dialog with one text field. Codes look like `AT-XXXX-XXXX`. Case, dashes
and spaces do not matter. On failure the dialog shows the server's message (for
example an unknown code, or a code already claimed by another install) and stays
open. On success it closes. Put it behind a "Enter Amni-Test code" item in a debug
or settings menu.

Or let the SDK show it for you: with `autoPrompt = true`, if the install is still
unclaimed after the referrer check, the dialog appears once per app process on the
next activity that resumes.

### Other calls

```kotlin
AmniTest.isClaimed(context)          // true once a code has been claimed

AmniTest.claimCode(context, "at-abcd-2345") { result ->   // runs on the main thread
    result.onSuccess { /* linked */ }
    result.onFailure { e -> showMessage(e.message) }      // e is AmniTestException
}
```

`AmniTestException.httpStatus` holds the server's HTTP status, or 0 when there was no
answer (bad code format, `init` not called, no network).

## What the SDK sends

Only these requests, to the Amni-Test server (`baseUrl`), as JSON over HTTPS:

| When | Request | Body |
|---|---|---|
| A code is claimed (once) | `POST /api/sdk/claim` | `key` (your SDK key), `package` (your app's package name), `code` (the tester's claim code), `installId` |
| At most once per UTC day, when the app is in the foreground | `POST /api/sdk/ping` | `key`, `package`, `installId` |

- `installId` is a random UUID made by the SDK on first launch. It is not derived from
  the device, and it is gone when the app is uninstalled or its data is cleared.
- The SDK does not read or send device identifiers (Android ID, advertising ID, IMEI,
  serial), account names, location, contacts or any other personal data.
- The User-Agent is `AmniTest-Android/<version>`. The server sees the device's IP
  address, as with any network request.
- The Install Referrer is read only to find the `amnitest=` parameter. Nothing else
  from it is sent.

If your app has a privacy policy or a Play Data safety form for the closed-test build,
this is the data to describe.

Note on backups: the SDK's `amnitest` preferences file follows your app's backup
settings. If your app allows Auto Backup, a restored device keeps the same install ID
and claim.

## Testing against a local server

Pass your local Worker as `baseUrl`, for example `http://10.0.2.2:8787` from the
emulator. Plain `http://` needs a network security config in your debug build that
allows cleartext traffic to that host.

## Building this library on its own

The repository ignores `src/` folders, so this module does not use the usual
`src/main` layout. Sources are in `kotlin/`, unit tests in `test/`, and the manifest is
`AndroidManifest.xml` at the module root (see `sourceSets` in `build.gradle.kts`).

```sh
export ANDROID_HOME=/path/to/android-sdk   # needs platforms;android-34
./gradlew :testDebugUnitTest :assembleRelease :lintRelease
```

The AAR is written to `build/outputs/aar/amni-test-android-release.aar`. Build
outputs are ignored by this folder's `.gitignore`.

The unit tests cover the pure logic in `AmniTestLogic` (code normalisation, referrer
parsing, the once-per-UTC-day rule, request JSON) and run on a plain JVM.
