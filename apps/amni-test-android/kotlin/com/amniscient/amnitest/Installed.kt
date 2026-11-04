package com.amniscient.amnitest

import android.content.pm.PackageManager
import android.os.Build

/** Installed-app lookups. Needs QUERY_ALL_PACKAGES to see arbitrary packages. */
object Installed {

    /** The installed versionCode of [pkg], or 0 when it is not installed. */
    fun versionCode(pm: PackageManager, pkg: String): Long = try {
        val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(pkg, 0)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            info.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            info.versionCode.toLong()
        }
    } catch (e: PackageManager.NameNotFoundException) {
        0L
    }

    fun installedSet(pm: PackageManager, packages: Collection<String>): Set<String> =
        packages.filterTo(HashSet()) { versionCode(pm, it) > 0 }
}
