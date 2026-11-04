package com.amniscient.amnitest

import android.content.Intent
import android.os.Bundle
import android.os.CancellationSignal
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.core.content.ContextCompat
import androidx.credentials.Credential
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Native sign-in. Google: Credential Manager returns a Google ID token whose
 * audience is the WEB client ID; the API verifies it (POST /api/auth/google).
 * When GET /api/config reports devAuth (local dev only), an email field signs
 * in through POST /api/auth/dev instead.
 */
class SignInActivity : ComponentActivity() {

    private val io: ExecutorService = Executors.newSingleThreadExecutor()
    private var pendingCredential: CancellationSignal? = null
    private var busy = false

    private lateinit var googleButton: Button
    private lateinit var devGroup: View
    private lateinit var devEmail: EditText
    private lateinit var devButton: Button
    private lateinit var progress: ProgressBar
    private lateinit var error: TextView

    private val googleConfigured get() = BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotBlank()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sign_in)
        googleButton = findViewById(R.id.google_sign_in)
        devGroup = findViewById(R.id.dev_group)
        devEmail = findViewById(R.id.dev_email)
        devButton = findViewById(R.id.dev_sign_in)
        progress = findViewById(R.id.progress)
        error = findViewById(R.id.error)

        googleButton.visibility = if (googleConfigured) View.VISIBLE else View.GONE
        googleButton.setOnClickListener { signInWithGoogle() }
        devButton.setOnClickListener { signInDev() }
        devEmail.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                signInDev()
                true
            } else {
                false
            }
        }
        findViewById<Button>(R.id.terms).setOnClickListener {
            Links.open(this, AppLogic.termsUrl(BuildConfig.SITE_URL))
        }
        findViewById<Button>(R.id.privacy).setOnClickListener {
            Links.open(this, AppLogic.privacyUrl(BuildConfig.SITE_URL))
        }
        loadConfig()
    }

    override fun onDestroy() {
        pendingCredential?.cancel()
        io.shutdownNow()
        super.onDestroy()
    }

    /** Asks the API whether dev sign-in is on (local dev servers only). */
    private fun loadConfig() {
        io.execute {
            val devAuth: Boolean? = try {
                Api().get("/api/config").optBoolean("devAuth", false)
            } catch (e: IOException) {
                null
            }
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                devGroup.visibility = if (devAuth == true) View.VISIBLE else View.GONE
                if (!googleConfigured && devAuth != true) {
                    showError(getString(if (devAuth == null) R.string.error_network else R.string.error_not_configured))
                }
            }
        }
    }

    // ------------------------------------------------------------------ Google

    private fun signInWithGoogle() {
        if (busy || !googleConfigured) return
        setBusy(true)
        val option = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build()
        val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
        val cancel = CancellationSignal().also { pendingCredential = it }
        CredentialManager.create(this).getCredentialAsync(
            this,
            request,
            cancel,
            ContextCompat.getMainExecutor(this),
            object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                override fun onResult(result: GetCredentialResponse) {
                    pendingCredential = null
                    onCredential(result.credential)
                }

                override fun onError(e: GetCredentialException) {
                    pendingCredential = null
                    setBusy(false)
                    when (e) {
                        is GetCredentialCancellationException -> Unit
                        is NoCredentialException -> showError(getString(R.string.error_no_google_account))
                        else -> showError(getString(R.string.error_google, e.message ?: e.type))
                    }
                }
            },
        )
    }

    private fun onCredential(credential: Credential) {
        val idToken = if (credential is CustomCredential &&
            credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
        ) {
            try {
                GoogleIdTokenCredential.createFrom(credential.data).idToken
            } catch (e: GoogleIdTokenParsingException) {
                null
            }
        } else {
            null
        }
        if (idToken == null) {
            setBusy(false)
            showError(getString(R.string.error_google_unexpected))
            return
        }
        exchange("/api/auth/google", JSONObject().put("credential", idToken))
    }

    // ------------------------------------------------------------------ dev

    private fun signInDev() {
        if (busy) return
        val email = devEmail.text.toString().trim()
        if (!EMAIL.matches(email)) {
            showError(getString(R.string.error_email))
            return
        }
        setBusy(true)
        exchange("/api/auth/dev", JSONObject().put("email", email))
    }

    // ------------------------------------------------------------------ shared

    /** POSTs [body] to [path] and expects `{ token, user }`. */
    private fun exchange(path: String, body: JSONObject) {
        io.execute {
            var token: String? = null
            var message: String? = null
            try {
                token = Api().post(path, body).optString("token", "").takeIf { it.isNotBlank() }
                if (token == null) message = getString(R.string.error_server)
            } catch (e: ApiException) {
                message = getString(R.string.error_sign_in, e.message)
            } catch (e: IOException) {
                message = getString(R.string.error_network)
            }
            val signedInToken = token
            val failure = message
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                if (signedInToken != null) {
                    Account.signedIn(this, signedInToken)
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                } else {
                    setBusy(false)
                    showError(failure ?: getString(R.string.error_server))
                }
            }
        }
    }

    private fun setBusy(value: Boolean) {
        busy = value
        googleButton.isEnabled = !value
        devButton.isEnabled = !value
        progress.visibility = if (value) View.VISIBLE else View.GONE
        if (value) error.visibility = View.GONE
    }

    private fun showError(text: String) {
        error.text = text
        error.visibility = View.VISIBLE
    }

    private companion object {
        val EMAIL = Regex("[^@\\s]+@[^@\\s]+")
    }
}
