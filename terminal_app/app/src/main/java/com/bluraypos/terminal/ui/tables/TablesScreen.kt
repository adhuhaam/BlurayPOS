package com.bluraypos.terminal.ui.tables

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.TableBar
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bluraypos.terminal.data.api.DiningTableDto
import com.bluraypos.terminal.ui.components.EmptyState
import com.bluraypos.terminal.ui.components.LoadingCenter
import com.bluraypos.terminal.ui.components.MobileTopBar
import com.bluraypos.terminal.ui.components.ShadcnBadge
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.theme.BrandBlue
import com.bluraypos.terminal.ui.theme.BrandWarning
import com.bluraypos.terminal.ui.theme.ChargeGreen
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.ui.theme.ShadcnPrimary
import com.bluraypos.terminal.util.Formatters

@Composable
fun TablesScreen(
    viewModel: TablesViewModel,
    onOpenPos: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val free = state.tables.count { it.status.equals("Available", ignoreCase = true) }
    val busy = state.tables.size - free

    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            MobileTopBar(
                title = "Tables",
                subtitle = "$free free · $busy in use",
                trailing = {
                    IconButton(onClick = viewModel::load, enabled = !state.loading) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
            )
            HorizontalDivider(color = ShadcnBorder)

            when {
                state.loading -> LoadingCenter(Modifier.fillMaxSize())
                state.error != null -> EmptyState(
                    title = "Could not load tables",
                    message = state.error ?: "",
                    icon = Icons.Default.TableBar,
                    modifier = Modifier.fillMaxSize(),
                )
                state.tables.isEmpty() -> EmptyState(
                    title = "No tables configured",
                    message = "Ask your manager to set up dining tables in admin.",
                    icon = Icons.Default.TableBar,
                    modifier = Modifier.fillMaxSize(),
                )
                else -> LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(state.tables, key = { it.id }) { table ->
                        TableCard(table) { viewModel.onTableSelected(table, onOpenPos) }
                    }
                }
            }
        }
    }
}

@Composable
private fun TableCard(table: DiningTableDto, onClick: () -> Unit) {
    val statusColor = when (table.status.lowercase()) {
        "available" -> ChargeGreen
        "occupied" -> BrandBlue
        "billrequested" -> BrandWarning
        else -> ShadcnMutedForeground
    }

    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(116.dp)
            .border(1.dp, ShadcnForeground.copy(alpha = 0.1f), MaterialTheme.shapes.large),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(table.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(statusColor),
                )
            }
            table.activeOrderTotal?.let { total ->
                Text(
                    Formatters.formatMoney(total),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.People, contentDescription = null, modifier = Modifier.size(14.dp), tint = ShadcnMutedForeground)
                    Spacer(Modifier.size(4.dp))
                    Text("${table.capacity} seats", style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
                }
                ShadcnBadge(text = table.status, tint = statusColor)
            }
        }
    }
}