package com.bluraypos.terminal.data.auth

import com.bluraypos.terminal.data.api.LoginResponse
import com.bluraypos.terminal.data.api.StoreDto
import com.bluraypos.terminal.data.api.UserDto

data class ResolvedSession(
    val user: UserDto,
    val store: StoreDto,
    val roles: List<String>,
)

object SessionResolver {
    fun displayName(user: UserDto): String {
        val full = "${user.firstName} ${user.lastName}".trim()
        return full.ifBlank { user.email }
    }

    /**
     * Picks the branch from the login response using server default, single assignment,
     * or an explicit user selection when multiple branches exist.
     */
    fun resolveStore(
        data: LoginResponse,
        selectedStoreId: String? = null,
    ): StoreDto? {
        val stores = data.stores
        if (stores.isEmpty()) return null

        selectedStoreId?.let { id ->
            stores.firstOrNull { it.id == id }?.let { return it }
        }

        data.user.defaultStoreId?.let { id ->
            stores.firstOrNull { it.id == id }?.let { return it }
        }

        if (stores.size == 1) return stores.first()

        return null
    }

    fun needsBranchSelection(data: LoginResponse, selectedStoreId: String? = null): Boolean =
        resolveStore(data, selectedStoreId) == null && data.stores.size > 1
}
