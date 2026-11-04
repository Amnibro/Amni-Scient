package com.amniscient.amnitest

/**
 * Why a claim failed. [message] is safe to show to the tester: it is either the
 * server's `error` text or a short explanation written by the SDK.
 *
 * @property httpStatus the HTTP status the server answered with, or 0 when there
 * was no answer (bad code format, SDK not initialised, network failure).
 */
class AmniTestException(
    message: String,
    val httpStatus: Int = 0,
) : Exception(message)
