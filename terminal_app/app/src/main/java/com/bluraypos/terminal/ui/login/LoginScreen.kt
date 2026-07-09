package com.bluraypos.terminal.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.BuildConfig
import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.api.LoginRequest
import com.bluraypos.terminal.data.api.LoginResponse
import com.bluraypos.terminal.data.api.StoreDto
import com.bluraypos.terminal.data.auth.SessionResolver
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.tenant.TenantSync
import com.bluraypos.terminal.ui.branding.BrandAppIcon
import com.bluraypos.terminal.ui.branding.BrandTagline
import com.bluraypos.terminal.ui.branding.BlurayWordmark
import com.bluraypos.terminal.ui.components.ShadcnButton
import com.bluraypos.terminal.ui.components.ShadcnCard
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.ui.theme.ShadcnRing
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val stores: List<StoreDto> = emptyList(),
    val selectedStoreId: String? = null,
    val needsBranchSelection: Boolean = false,
    val recognizedUserName: String? = null,
    val loading: Boolean = false,
    val error: String? = null,
)

class LoginViewModel(
    private val sessionStore: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    init {
        if (BuildConfig.DEBUG) {
            _state.update { it.copy(email = "cashier@demo.com", password = "Cashier123!") }
        }
    }

    fun onEmailChange(value: String) = _state.update {
        it.copy(email = value, error = null, needsBranchSelection = false, recognizedUserName = null)
    }

    fun onPasswordChange(value: String) = _state.update { it.copy(password = value, error = null) }

    fun onStoreSelected(storeId: String) = _state.update { it.copy(selectedStoreId = storeId, error = null) }

    fun login(onSuccess: () -> Unit) {
        val current = _state.value
        if (current.email.isBlank() || current.password.isBlank()) {
            _state.update { it.copy(error = "Email and password are required") }
            return
        }
        if (current.needsBranchSelection && current.selectedStoreId.isNullOrBlank()) {
            _state.update { it.copy(error = "Select a branch to continue") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val api = ApiClient.create(sessionStore)
                val response = api.login(
                    LoginRequest(
                        email = current.email.trim(),
                        password = current.password,
                        storeId = current.selectedStoreId,
                    ),
                )
                if (!response.success || response.data == null) {
                    _state.update { it.copy(loading = false, error = response.error ?: "Invalid email or password") }
                    return@launch
                }

                val data = response.data
                if (SessionResolver.needsBranchSelection(data, current.selectedStoreId)) {
                    _state.update {
                        it.copy(
                            loading = false,
                            stores = data.stores,
                            needsBranchSelection = true,
                            recognizedUserName = SessionResolver.displayName(data.user),
                            selectedStoreId = it.selectedStoreId ?: data.user.defaultStoreId,
                            error = null,
                        )
                    }
                    return@launch
                }

                completeLogin(api, current.email.trim(), current.password, data, current.selectedStoreId, onSuccess)
            } catch (ex: Exception) {
                _state.update {
                    it.copy(loading = false, error = ex.message ?: "Cannot reach BlurayPOS. Check your connection.")
                }
            }
        }
    }

    private suspend fun completeLogin(
        api: com.bluraypos.terminal.data.api.BlurayApi,
        email: String,
        password: String,
        data: LoginResponse,
        requestedStoreId: String?,
        onSuccess: () -> Unit,
    ) {
        val store = SessionResolver.resolveStore(data, requestedStoreId)
        if (store == null) {
            _state.update { it.copy(loading = false, error = "No branch assigned to this account") }
            return
        }

        val sessionData = if (requestedStoreId == null && data.stores.size > 1) {
            val retry = api.login(LoginRequest(email, password, store.id))
            if (retry.success && retry.data != null) retry.data else data
        } else {
            data
        }

        sessionStore.saveLogin(
            accessToken = sessionData.accessToken,
            refreshToken = sessionData.refreshToken,
            storeId = store.id,
            storeName = store.name,
            userId = sessionData.user.id,
            email = sessionData.user.email,
            displayName = SessionResolver.displayName(sessionData.user),
            roles = sessionData.roles,
        )
        TenantSync.refresh(sessionStore)
        _state.update { it.copy(loading = false) }
        onSuccess()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoggedIn: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val expanded = androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = ShadcnRing,
        unfocusedBorderColor = ShadcnBorder,
        focusedLabelColor = ShadcnForeground,
        cursorColor = ShadcnForeground,
    )

    ShadcnScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            BrandAppIcon(size = 72.dp)
            Spacer(Modifier.height(12.dp))
            BlurayWordmark(lightOnDark = false)
            BrandTagline(lightOnDark = false)
            Spacer(Modifier.height(32.dp))

            ShadcnCard {
                if (state.needsBranchSelection && state.recognizedUserName != null) {
                    Text("Welcome back", style = MaterialTheme.typography.labelMedium)
                    Text(
                        state.recognizedUserName!!,
                        style = MaterialTheme.typography.headlineSmall,
                        color = ShadcnForeground,
                    )
                    Text(
                        "Choose your branch",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
                    )
                } else {
                    Text("Sign in", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        "Enter your staff credentials",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
                    )
                }

                if (!state.needsBranchSelection) {
                    OutlinedTextField(
                        value = state.email,
                        onValueChange = viewModel::onEmailChange,
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        enabled = !state.loading,
                        shape = MaterialTheme.shapes.medium,
                        colors = fieldColors,
                    )
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = state.password,
                        onValueChange = viewModel::onPasswordChange,
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        enabled = !state.loading,
                        shape = MaterialTheme.shapes.medium,
                        colors = fieldColors,
                    )
                }

                if (state.needsBranchSelection && state.stores.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    ExposedDropdownMenuBox(
                        expanded = expanded.value,
                        onExpandedChange = { expanded.value = !expanded.value },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        val label = state.stores.firstOrNull { it.id == state.selectedStoreId }?.name ?: "Select branch"
                        OutlinedTextField(
                            value = label,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Branch") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded.value) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            colors = fieldColors,
                        )
                        ExposedDropdownMenu(expanded = expanded.value, onDismissRequest = { expanded.value = false }) {
                            state.stores.forEach { store ->
                                DropdownMenuItem(
                                    text = { Text(store.name) },
                                    onClick = {
                                        viewModel.onStoreSelected(store.id)
                                        expanded.value = false
                                    },
                                )
                            }
                        }
                    }
                }

                state.error?.let {
                    Text(
                        it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                }

                Spacer(Modifier.height(20.dp))
                ShadcnButton(
                    text = if (state.needsBranchSelection) "Continue" else "Sign in",
                    onClick = { viewModel.login(onLoggedIn) },
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.loading,
                )
            }

            if (BuildConfig.DEBUG) {
                Spacer(Modifier.height(16.dp))
                Text("Dev API: ${BuildConfig.API_URL}", style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
            }
        }
    }
}
