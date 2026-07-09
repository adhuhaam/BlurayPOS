package com.bluraypos.terminal.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.bluraypos.terminal.R

/**
 * shadcn/ui light theme tokens — aligned with [admin-portal/src/index.css].
 * Neutral zinc palette; Bluray blue reserved for brand accents only.
 */

// Core shadcn tokens (approx. oklch from admin portal)
val ShadcnBackground = Color(0xFFFFFFFF)
val ShadcnForeground = Color(0xFF252525)
val ShadcnCard = Color(0xFFFFFFFF)
val ShadcnPrimary = Color(0xFF343434)
val ShadcnPrimaryForeground = Color(0xFFFAFAFA)
val ShadcnSecondary = Color(0xFFF5F5F5)
val ShadcnSecondaryForeground = Color(0xFF343434)
val ShadcnMuted = Color(0xFFF5F5F5)
val ShadcnMutedForeground = Color(0xFF737373)
val ShadcnAccent = Color(0xFFF5F5F5)
val ShadcnAccentForeground = Color(0xFF343434)
val ShadcnDestructive = Color(0xFFE7000B)
val ShadcnBorder = Color(0xFFEAEAEA)
val ShadcnInput = Color(0xFFEAEAEA)
val ShadcnRing = Color(0xFFA8A8A8)

// Bluray brand (splash, logo, optional highlights)
val BrandNavy = Color(0xFF010B48)
val BrandBlue = Color(0xFF2563EB)
val BrandBlueBright = Color(0xFF3B82F6)
val ChargeGreen = Color(0xFF16A34A)
val BrandError = Color(0xFFE7000B)
val BrandWarning = Color(0xFFF59E0B)

// Legacy aliases used across the app
val BrandSurface = ShadcnBackground
val BrandOnSurfaceMuted = ShadcnMutedForeground
val BrandNavySurface = ShadcnSecondary
val BrandNavyLight = ShadcnMutedForeground

val BlurayFontFamily = FontFamily(
    Font(R.font.geist_regular, FontWeight.Normal),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
)

val BlurayTypography = BlurayFontFamily

private val ShadcnLightColors = lightColorScheme(
    primary = ShadcnPrimary,
    onPrimary = ShadcnPrimaryForeground,
    primaryContainer = ShadcnMuted,
    onPrimaryContainer = ShadcnForeground,
    secondary = ShadcnSecondary,
    onSecondary = ShadcnSecondaryForeground,
    tertiary = ChargeGreen,
    onTertiary = Color.White,
    background = ShadcnBackground,
    onBackground = ShadcnForeground,
    surface = ShadcnCard,
    onSurface = ShadcnForeground,
    surfaceVariant = ShadcnMuted,
    onSurfaceVariant = ShadcnMutedForeground,
    outline = ShadcnBorder,
    outlineVariant = ShadcnInput,
    error = ShadcnDestructive,
)

private val ShadcnTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        color = ShadcnForeground,
    ),
    headlineLarge = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 26.sp,
        color = ShadcnForeground,
    ),
    headlineMedium = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        color = ShadcnForeground,
    ),
    headlineSmall = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 17.sp,
        color = ShadcnForeground,
    ),
    titleLarge = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        color = ShadcnForeground,
    ),
    bodyMedium = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = ShadcnMutedForeground,
    ),
    bodySmall = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = ShadcnMutedForeground,
    ),
    labelLarge = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = BlurayFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        color = ShadcnMutedForeground,
    ),
)

@Composable
fun BlurayPosTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ShadcnLightColors,
        typography = ShadcnTypography,
        shapes = BlurayShapes,
        content = content,
    )
}
