package com.bluraypos.terminal.ui.settings

import android.os.Build
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.BuildConfig
import com.bluraypos.terminal.data.ApiConfig
import com.bluraypos.terminal.data.network.ConnectionChecker
import com.bluraypos.terminal.data.network.ConnectionStatus
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.tenant.TenantFeatures
import com.bluraypos.terminal.data.tenant.TenantSync
import com.bluraypos.terminal.ui.branding.BrandAppIcon
import com.bluraypos.terminal.ui.branding.BrandTagline
import com.bluraypos.terminal.ui.branding.BlurayWordmark
import com.bluraypos.terminal.ui.components.MobileTopBar
import com.bluraypos.terminal.ui.components.ShadcnBadge
import com.bluraypos.terminal.ui.components.ShadcnButton
import com.bluraypos.terminal.ui.components.ShadcnButtonVariant
import com.bluraypos.terminal.ui.components.ShadcnCard
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.theme.BrandWarning
import com.bluraypos.terminal.ui.theme.ChargeGreen
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.util.Formatters
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val storeName: String = "",
    val displayName: String = "",
    val email: String = "",
    val roles: List<String> = emptyList(),
    val apiUrl: String = ApiConfig.PRODUCTION_URL,
    val tenantFeatures: TenantFeatures = TenantFeatures(),
    val connectionStatus: ConnectionStatus = ConnectionStatus.Checking,
    val testingConnection: Boolean = false,
    val refreshingProfile: Boolean = false,
)

class SettingsViewModel(
    private val sessionStore: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            loadProfile()
            testConnection()
        }
    }

    private suspend fun loadProfile() {
        _state.update {
            it.copy(
                storeName = sessionStore.storeName.first().orEmpty(),
                displayName = sessionStore.userDisplayName.first().orEmpty(),
                email = sessionStore.userEmail.first().orEmpty(),
                roles = sessionStore.userRoles.first(),
                apiUrl = BuildConfig.API_URL,
                tenantFeatures = sessionStore.tenantFeatures.first(),
            )
        }
    }

    fun refreshProfile() {
        viewModelScope.launch {
            _state.update { it.copy(refreshingProfile = true) }
            TenantSync.refresh(sessionStore)
            loadProfile()
            _state.update { it.copy(refreshingProfile = false) }
        }
    }

    fun testConnection() {
        viewModelScope.launch {
            _state.update { it.copy(testingConnection = true, connectionStatus = ConnectionStatus.Checking) }
            val status = ConnectionChecker.check(sessionStore)
            _state.update { it.copy(testingConnection = false, connectionStatus = status) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onLogout: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val features = state.tenantFeatures
    val roleLabel = state.roles.firstOrNull()?.let(Formatters::formatRole) ?: "Staff"
    val connectionLabel = when (val status = state.connectionStatus) {
        ConnectionStatus.Checking -> "Checking…"
        is ConnectionStatus.Online -> status.message
        is ConnectionStatus.Offline -> status.message
    }
    val connectionColor = when (state.connectionStatus) {
        ConnectionStatus.Checking -> ShadcnMutedForeground
        is ConnectionStatus.Online -> ChargeGreen
        is ConnectionStatus.Offline -> BrandWarning
    }

    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            MobileTopBar(
                title = "Settings",
                subtitle = state.storeName.ifBlank { "Your branch" },
            )
            HorizontalDivider(color = ShadcnBorder)

            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                ShadcnCard {
                    Text("Store type", style = MaterialTheme.typography.labelMedium, color = ShadcnMutedForeground)
                    Spacer(Modifier.height(8.dp))
                    Text(features.businessTypeLabel, style = MaterialTheme.typography.titleLarge, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                    Text(features.posModeLabel, style = MaterialTheme.typography.bodyMedium, color = ShadcnMutedForeground)
                    Spacer(Modifier.height(12.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        FeatureChip("Tables", features.posTables)
                        FeatureChip("Kitchen", features.posKitchen)
                        FeatureChip("Barcode POS", features.posBarcodeRetail)
                        FeatureChip("Recipes", features.catalogRecipes)
                        FeatureChip("Inventory", features.catalogInventory)
                        FeatureChip("Delivery", features.posDelivery)
                    }
                    Spacer(Modifier.height(12.dp))
                    ShadcnButton(
                        text = "Refresh store profile",
                        onClick = viewModel::refreshProfile,
                        modifier = Modifier.fillMaxWidth(),
                        loading = state.refreshingProfile,
                        variant = ShadcnButtonVariant.Outline,
                    )
                }

                ShadcnCard {
                    Text("Account", style = MaterialTheme.typography.labelMedium, color = ShadcnMutedForeground)
                    Spacer(Modifier.height(8.dp))
                    Text(state.displayName.ifBlank { state.email }, style = MaterialTheme.typography.titleLarge)
                    Text(state.email, style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider(color = ShadcnBorder)
                    Spacer(Modifier.height(12.dp))
                    SettingRow("Role", roleLabel)
                    SettingRow("Branch", state.storeName)
                    SettingRow("Server", state.apiUrl)
                    SettingRow("Connection", connectionLabel, connectionColor)
                    Spacer(Modifier.height(12.dp))
                    ShadcnButton(
                        text = "Test connection",
                        onClick = viewModel::testConnection,
                        modifier = Modifier.fillMaxWidth(),
                        loading = state.testingConnection,
                        variant = ShadcnButtonVariant.Outline,
                    )
                }

                ShadcnCard {
                    Text("Display", style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    SettingRow("Mode", "Fullscreen kiosk")
                    Text(
                        "Status bar and navigation buttons are hidden while BlurayPOS is open.",
                        style = MaterialTheme.typography.bodySmall,
                        color = ShadcnMutedForeground,
                    )
                }

                ShadcnCard {
                    Text("Device", style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    SettingRow("Model", "${Build.MANUFACTURER} ${Build.MODEL}")
                    SettingRow("Android", Build.VERSION.RELEASE)
                    SettingRow("App", "BlurayPOS ${BuildConfig.VERSION_NAME}")
                }

                ShadcnCard {
                    Text("Hardware", style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    if (features.isRetailMode) {
                        Text("Barcode scanner — scan in POS search field", style = MaterialTheme.typography.bodyMedium)
                        Text("Thermal printer — coming in v0.6", style = MaterialTheme.typography.bodyMedium, color = ShadcnMutedForeground)
                    } else if (features.isRestaurantMode) {
                        Text("Kitchen printer — coming in v0.6", style = MaterialTheme.typography.bodyMedium)
                        Text("Table management — floor plan coming soon", style = MaterialTheme.typography.bodyMedium, color = ShadcnMutedForeground)
                    } else {
                        Text("Barcode + kitchen printers — coming in v0.6", style = MaterialTheme.typography.bodyMedium)
                        Text("Supports both retail scan and restaurant menu flow", style = MaterialTheme.typography.bodySmall, color = ShadcnMutedForeground)
                    }
                }

                ShadcnButton(
                    text = "Sign out",
                    onClick = onLogout,
                    modifier = Modifier.fillMaxWidth(),
                    variant = ShadcnButtonVariant.Destructive,
                )

                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    BrandAppIcon(size = 48.dp)
                    Spacer(Modifier.height(8.dp))
                    BlurayWordmark(lightOnDark = false)
                    BrandTagline(lightOnDark = false)
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun FeatureChip(label: String, enabled: Boolean) {
    ShadcnBadge(
        text = label,
        tint = if (enabled) ChargeGreen else ShadcnMutedForeground,
    )
}

@Composable
private fun SettingRow(label: String, value: String, valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface) {
    Column(Modifier.padding(vertical = 6.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
        Text(value, style = MaterialTheme.typography.bodyLarge, color = valueColor)
    }
}
