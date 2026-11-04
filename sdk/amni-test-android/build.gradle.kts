// Amni-Test SDK (Android library).
//
// The repo-wide .gitignore ignores every `src/` directory, so this module does
// not use the standard src/main layout: sources live in `kotlin/`, unit tests in
// `test/` and the manifest at the module root.
//
// Plugin versions are deliberately not declared here: they come from
// settings.gradle.kts in the standalone build, or from the host app's build
// when this folder is included as a local module.
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.amniscient.amnitest"
    compileSdk = 34

    defaultConfig {
        minSdk = 21
        consumerProguardFiles("consumer-rules.pro")
    }

    sourceSets["main"].apply {
        java.srcDirs("kotlin")
        manifest.srcFile("AndroidManifest.xml")
    }
    sourceSets["test"].apply {
        java.srcDirs("test")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = false
    }

    lint {
        abortOnError = true
    }
}

// Task-level compilerOptions work on Kotlin 1.8 through 2.x (the android
// `kotlinOptions {}` block is an error from Kotlin 2.2).
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.android.installreferrer:installreferrer:2.2")
    testImplementation("junit:junit:4.13.2")
}
