package com.bluraypos.terminal.ui.tables

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.api.DiningTableDto
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.table.TableSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TablesUiState(
    val tables: List<DiningTableDto> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

class TablesViewModel(
    private val sessionStore: SessionStore,
    private val tableSession: TableSession,
) : ViewModel() {
    private val _state = MutableStateFlow(TablesUiState())
    val state: StateFlow<TablesUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val storeId = sessionStore.storeId.first() ?: throw IllegalStateException("No store selected")
                val res = ApiClient.create(sessionStore).getTables(storeId)
                if (!res.success) throw IllegalStateException(res.error ?: "Failed to load tables")
                _state.update { it.copy(tables = res.data.orEmpty(), loading = false) }
            } catch (ex: Exception) {
                _state.update { it.copy(loading = false, error = ex.message) }
            }
        }
    }

    fun onTableSelected(table: DiningTableDto, onOpenPos: () -> Unit) {
        tableSession.selectTable(table.id, table.name)
        table.activeOrderId?.let { orderId ->
            tableSession.setActiveOrder(orderId, table.id, table.name)
        }
        onOpenPos()
    }
}
