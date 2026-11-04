package com.amniscient.amnitest

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Runs about every 6 hours with a network connection:
 * 1. GET /api/assignments with the stored token (401: sign out and stop).
 * 2. Reports which active-test apps are installed: POST /api/app/installs.
 * 3. Posts reminders for open check-ins, invites and missing apps, once each.
 */
class CheckInWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        val ctx = applicationContext
        val token = Session.token(ctx) ?: return Result.success()
        val api = Api()

        val assignments = try {
            AppLogic.parseAssignments(api.get("/api/assignments", token).toString())
        } catch (e: ApiException) {
            if (e.status == 401) return signedOut(ctx)
            return if (e.status >= 500) Result.retry() else Result.success()
        } catch (e: JSONException) {
            return Result.success()
        } catch (e: IOException) {
            return Result.retry()
        }

        val active = AppLogic.activePackages(assignments)
        val installed = Installed.installedSet(ctx.packageManager, active)
        val report = AppLogic.installsReport(assignments, installed)
        if (report.isNotEmpty()) {
            try {
                api.post("/api/app/installs", JSONObject().put("installed", JSONArray(report)), token)
            } catch (e: ApiException) {
                if (e.status == 401) return signedOut(ctx)
                // Other errors (e.g. an older API without this route) are not fatal.
            } catch (e: IOException) {
                // Best effort; the next run reports again.
            }
        }

        val already = Session.notifiedKeys(ctx)
        val plan = AppLogic.planNotices(assignments, installed, already)
        val posted = Notifier.post(ctx, plan.post)
        Session.setNotifiedKeys(ctx, plan.remember(already, posted))
        return Result.success()
    }

    private fun signedOut(ctx: Context): Result {
        Session.clear(ctx)
        cancel(ctx)
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "amni-checkins"
        private const val WORK_NOW = "amni-checkins-now"

        private val online = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<CheckInWorker>(6, TimeUnit.HOURS)
                .setConstraints(online)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.MINUTES)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        /** One extra check now, e.g. right after notifications were allowed. */
        fun runNow(context: Context) {
            val request = OneTimeWorkRequestBuilder<CheckInWorker>().setConstraints(online).build()
            WorkManager.getInstance(context).enqueueUniqueWork(WORK_NOW, ExistingWorkPolicy.REPLACE, request)
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NOW)
        }
    }
}
