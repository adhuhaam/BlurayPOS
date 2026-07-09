package com.bluraypos.terminal.data.network

import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.prefs.SessionStore
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

sealed class ConnectionStatus {
    data object Checking : ConnectionStatus()
    data class Online(val message: String = "Connected") : ConnectionStatus()
    data class Offline(val message: String) : ConnectionStatus()
}

object ConnectionChecker {
    suspend fun check(sessionStore: SessionStore): ConnectionStatus {
        return try {
            val response = ApiClient.create(sessionStore).healthCheck()
            if (response.status.equals("healthy", ignoreCase = true)) {
                ConnectionStatus.Online()
            } else {
                ConnectionStatus.Offline("API returned: ${response.status}")
            }
        } catch (ex: Exception) {
            ConnectionStatus.Offline(toMessage(ex))
        }
    }

    fun isNetworkError(ex: Throwable): Boolean =
        ex is UnknownHostException ||
            ex is SocketTimeoutException ||
            ex is IOException && ex.message?.contains("Failed to connect", ignoreCase = true) == true

    fun toMessage(ex: Throwable): String = when {
        ex is UnknownHostException -> "Cannot reach server. Check Wi‑Fi and API URL."
        ex is SocketTimeoutException -> "Server timed out. Try again."
        ex.message?.contains("Failed to connect", ignoreCase = true) == true ->
            "Cannot connect to API. Is Docker running?"
        else -> ex.message ?: "Connection failed"
    }
}
