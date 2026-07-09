package com.bluraypos.terminal.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bluraypos.terminal.ui.theme.ChargeGreen
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnDestructive
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMuted
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.ui.theme.ShadcnPrimary
import com.bluraypos.terminal.ui.theme.ShadcnPrimaryForeground

/** shadcn card: `rounded-xl bg-card ring-1 ring-foreground/10` */
@Composable
fun ShadcnCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, ShadcnForeground.copy(alpha = 0.1f), MaterialTheme.shapes.large),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
    ) {
        Column(Modifier.padding(16.dp), content = content)
    }
}

@Composable
fun ShadcnPageHeader(
    title: String,
    description: String? = null,
    modifier: Modifier = Modifier,
    trailing: @Composable (RowScope.() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 20.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold)
                if (!description.isNullOrBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(description, style = MaterialTheme.typography.bodyMedium)
                }
            }
            trailing?.invoke(this)
        }
        Spacer(Modifier.height(12.dp))
        HorizontalDivider(color = ShadcnBorder)
    }
}

/** Compact top bar for phone POS screens — less vertical padding than [ShadcnPageHeader]. */
@Composable
fun MobileTopBar(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    trailing: @Composable (RowScope.() -> Unit)? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
            if (!subtitle.isNullOrBlank()) {
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = ShadcnMutedForeground,
                    maxLines = 1,
                )
            }
        }
        trailing?.invoke(this)
    }
}

@Composable
fun ShadcnButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    variant: ShadcnButtonVariant = ShadcnButtonVariant.Primary,
) {
    val colors = when (variant) {
        ShadcnButtonVariant.Primary -> ButtonDefaults.buttonColors(
            containerColor = ShadcnPrimary,
            contentColor = ShadcnPrimaryForeground,
            disabledContainerColor = ShadcnPrimary.copy(alpha = 0.5f),
        )
        ShadcnButtonVariant.Destructive -> ButtonDefaults.buttonColors(
            containerColor = ShadcnDestructive.copy(alpha = 0.1f),
            contentColor = ShadcnDestructive,
        )
        ShadcnButtonVariant.Success -> ButtonDefaults.buttonColors(
            containerColor = ChargeGreen,
            contentColor = Color.White,
        )
        ShadcnButtonVariant.Outline -> ButtonDefaults.buttonColors()
    }

    when (variant) {
        ShadcnButtonVariant.Outline -> OutlinedButton(
            onClick = onClick,
            enabled = enabled && !loading,
            modifier = modifier.height(44.dp),
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(1.dp, ShadcnBorder),
        ) {
            ShadcnButtonLabel(text, loading)
        }
        else -> Button(
            onClick = onClick,
            enabled = enabled && !loading,
            modifier = modifier.height(44.dp),
            shape = MaterialTheme.shapes.medium,
            colors = colors,
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
        ) {
            ShadcnButtonLabel(text, loading)
        }
    }
}

enum class ShadcnButtonVariant { Primary, Outline, Destructive, Success }

@Composable
private fun ShadcnButtonLabel(text: String, loading: Boolean) {
    if (loading) {
        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
    } else {
        Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun ShadcnBadge(
    text: String,
    modifier: Modifier = Modifier,
    tint: Color = ShadcnMutedForeground,
) {
    Surface(
        modifier = modifier,
        shape = MaterialTheme.shapes.small,
        color = tint.copy(alpha = 0.1f),
        border = BorderStroke(1.dp, tint.copy(alpha = 0.2f)),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelMedium,
            color = tint,
            fontWeight = FontWeight.Medium,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShadcnMetricCard(
    label: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    ShadcnCard(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(MaterialTheme.shapes.small)
                    .background(ShadcnMuted),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = ShadcnForeground, modifier = Modifier.size(18.dp))
            }
            Column {
                Text(label, style = MaterialTheme.typography.labelMedium)
                Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShadcnActionTile(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(96.dp),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, ShadcnForeground.copy(alpha = 0.1f)),
    ) {
        Column(
            Modifier.padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(MaterialTheme.shapes.small)
                    .background(ShadcnMuted),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = title, modifier = Modifier.size(16.dp), tint = ShadcnForeground)
            }
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun ShadcnScreen(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(modifier = modifier.background(MaterialTheme.colorScheme.background)) {
        content()
    }
}

@Composable
fun EmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        icon?.let {
            Icon(it, contentDescription = null, tint = ShadcnMutedForeground, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(12.dp))
        }
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(4.dp))
        Text(message, style = MaterialTheme.typography.bodyMedium, color = ShadcnMutedForeground)
    }
}

@Composable
fun LoadingCenter(modifier: Modifier = Modifier, size: Dp = 32.dp) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        CircularProgressIndicator(modifier = Modifier.size(size), color = ShadcnPrimary, strokeWidth = 2.5.dp)
    }
}

fun orderStatusColor(status: String): Color = when (status.lowercase()) {
    "completed", "paid" -> ChargeGreen
    "draft", "held" -> ShadcnMutedForeground
    "voided", "cancelled" -> ShadcnDestructive
    else -> ShadcnMutedForeground
}

// Legacy aliases — migrate screens gradually
@Composable fun BlurayScreenBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) =
    ShadcnScreen(modifier, content)

@Composable
fun BlurayPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    containerColor: Color = ShadcnPrimary,
) {
    val variant = when (containerColor) {
        ChargeGreen -> ShadcnButtonVariant.Success
        ShadcnDestructive -> ShadcnButtonVariant.Destructive
        else -> ShadcnButtonVariant.Primary
    }
    ShadcnButton(text, onClick, modifier, enabled, loading, variant)
}

@Composable
fun BlurayChargeButton(
    total: Double,
    itemCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    ShadcnButton(
        text = if (itemCount == 0) "Cart empty" else "Checkout · ${String.format("%.2f MVR", total)} ($itemCount)",
        onClick = onClick,
        modifier = modifier,
        enabled = enabled && itemCount > 0,
        variant = ShadcnButtonVariant.Primary,
    )
}

@Composable fun SectionCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) =
    ShadcnCard(modifier, content)

@Composable fun StatusChip(text: String, color: Color, modifier: Modifier = Modifier) =
    ShadcnBadge(text, modifier, color)

@Composable
fun MetricCard(
    label: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    accent: Color = ShadcnForeground,
) = ShadcnMetricCard(label, value, icon, modifier)

@Composable
fun ActionTile(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = ShadcnForeground,
) = ShadcnActionTile(title, icon, onClick, modifier)

@Composable
fun BlurayGradientHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    trailing: @Composable (RowScope.() -> Unit)? = null,
) = ShadcnPageHeader(title, subtitle, modifier, trailing)
