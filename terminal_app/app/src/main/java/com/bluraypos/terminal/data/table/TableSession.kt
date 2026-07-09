package com.bluraypos.terminal.data.table

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Shared table context across POS and Tables tabs. */
class TableSession {
    private val _selectedTableId = MutableStateFlow<String?>(null)
    private val _selectedTableName = MutableStateFlow<String?>(null)
    private val _activeOrderId = MutableStateFlow<String?>(null)

    val selectedTableId: StateFlow<String?> = _selectedTableId.asStateFlow()
    val selectedTableName: StateFlow<String?> = _selectedTableName.asStateFlow()
    val activeOrderId: StateFlow<String?> = _activeOrderId.asStateFlow()

    fun selectTable(id: String, name: String) {
        _selectedTableId.value = id
        _selectedTableName.value = name
    }

    fun setActiveOrder(orderId: String?, tableId: String? = null, tableName: String? = null) {
        _activeOrderId.value = orderId
        if (tableId != null) _selectedTableId.value = tableId
        if (tableName != null) _selectedTableName.value = tableName
    }

    fun clear() {
        _selectedTableId.value = null
        _selectedTableName.value = null
        _activeOrderId.value = null
    }
}
