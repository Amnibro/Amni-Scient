// Amni-Test tester app: a native shell around the Test Town web scene.
//
// The repo-wide .gitignore ignores every `src/` directory, so this module does
// not use the standard src/main layout: sources live in `kotlin/`, resources in
// `res/` (debug-only overrides in `res-debug/`), unit tests in `test/` and the
// manifest at the module root.
//
// Configuration comes from Gradle properties (-P or ~/.gradle/gradle.properties):
//   amniTestWebClientId        Google WEB OAuth client ID (the worker's GOOGLE_CLIENT_ID)
//   amniTestSiteUrl            release site, default https://amni-scient.com
//   amniTestApiUrl             release API, default https://amni-test.amnibro7.workers.dev
//   amniTestDebugSiteUrl       debug site, default http://10.0.2.2:8080 (emulator -> host)
//   amniTestDebugApiUrl        debug API,  default http://10.0.2.2:8787
//   amniTestKeystore, amniTestKeystorePassword, amniTestKeyAlias, amniTestKeyPassword
//                              release signing; without all four the release APK is unsigned
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

fun prop(name: String): String? =
    providers.gradleProperty(name).orNull?.trim()?.takeIf { it.isNotEmpty() }

fun quoted(value: String): String =
    "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

val webClientId = prop("amniTestWebClientId") ?: ""
val siteUrl = prop("amniTestSiteUrl") ?: "https://amni-scient.com"
val apiUrl = prop("amniTestApiUrl") ?: "https://amni-test.amnibro7.workers.dev"
val debugSiteUrl = prop("amniTestDebugSiteUrl") ?: "http://10.0.2.2:8080"
val debugApiUrl = prop("amniTestDebugApiUrl") ?: "http://10.0.2.2:8787"

val signingProps = listOf("amniTestKeystore", "amniTestKeystorePassword", "amniTestKeyAlias", "amniTestKeyPassword")
val hasReleaseSigning = signingProps.all { prop(it) != null }

android {
    namespace = "com.amniscient.amnitest"
    compileSdk = 34

    // APKs are named amni-test-<buildType>.apk
    base.archivesName.set("amni-test")

    defaultConfig {
        applicationId = "com.amniscient.amnitest"
        minSdk = 26
        targetSdk = 34
        // Bump both for every published APK, and publish the same numbers in
        // /test/app/latest.json (see README.md).
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "SITE_URL", quoted(siteUrl))
        buildConfigField("String", "API_URL", quoted(apiUrl))
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", quoted(webClientId))
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(prop("amniTestKeystore")!!)
                storePassword = prop("amniTestKeystorePassword")
                keyAlias = prop("amniTestKeyAlias")
                keyPassword = prop("amniTestKeyPassword")
            }
        }
    }

    buildTypes {
        debug {
            // Emulator against local dev servers: 10.0.2.2 is the host machine.
            // Cleartext is allowed only for 10.0.2.2/localhost (res-debug/xml).
            buildConfigField("String", "SITE_URL", quoted(debugSiteUrl))
            buildConfigField("String", "API_URL", quoted(debugApiUrl))
        }
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("release")
        }
    }

    sourceSets["main"].apply {
        java.srcDirs("kotlin")
        res.srcDirs("res")
        manifest.srcFile("AndroidManifest.xml")
    }
    sourceSets["debug"].apply {
        res.srcDirs("res-debug")
    }
    sourceSets["test"].apply {
        java.srcDirs("test")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

// Task-level compilerOptions work on Kotlin 1.8 through 2.x (the android
// `kotlinOptions {}` block is an error from Kotlin 2.2).
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

// Versions are the newest that still build against compileSdk 34.
dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.work:work-runtime:2.9.1")
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    testImplementation("junit:junit:4.13.2")
    // android.jar only has org.json stubs; the JVM tests need the real thing.
    testImplementation("org.json:json:20240303")
}
