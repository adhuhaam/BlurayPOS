package com.bluraypos.terminal.util

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

object Formatters {
    private val orderTime = DateTimeFormatter.ofPattern("MMM d, HH:mm")
    private val refreshedTime = DateTimeFormatter.ofPattern("HH:mm")

    fun timeGreeting(): String {
        val hour = LocalTime.now().hour
        return when {
            hour < 12 -> "Good morning"
            hour < 17 -> "Good afternoon"
            else -> "Good evening"
        }
    }

    fun formatRole(role: String): String = when (role.lowercase()) {
        "cashier" -> "Cashier"
        "waiter" -> "Waiter"
        "storemanager" -> "Branch Manager"
        "orgadmin" -> "Manager"
        "superadmin" -> "Super Admin"
        else -> role.replaceFirstChar { it.uppercase() }
    }

    fun formatRelativeRefresh(epochMillis: Long): String {
        val minutes = ChronoUnit.MINUTES.between(Instant.ofEpochMilli(epochMillis), Instant.now())
        return when {
            minutes < 1 -> "Updated just now"
            minutes < 60 -> "Updated ${minutes}m ago"
            else -> "Updated at ${Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).format(refreshedTime)}"
        }
    }

    fun formatOrderTime(iso: String?): String {
        if (iso.isNullOrBlank()) return ""
        return try {
            Instant.parse(iso).atZone(ZoneId.systemDefault()).format(orderTime)
        } catch (_: Exception) {
            iso.take(16).replace('T', ' ')
        }
    }

    fun formatMoney(amount: Double): String = String.format("%.2f MVR", amount)
}
