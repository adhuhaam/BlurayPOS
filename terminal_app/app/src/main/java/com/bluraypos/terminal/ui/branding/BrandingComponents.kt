package com.bluraypos.terminal.ui.branding

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bluraypos.terminal.R
import com.bluraypos.terminal.ui.theme.BlurayTypography
import com.bluraypos.terminal.ui.theme.BrandBlue
import com.bluraypos.terminal.ui.theme.BrandNavy
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground

@Composable
fun BrandSplashBackground(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.background(
            Brush.linearGradient(
                colors = listOf(BrandNavy, Color(0xFF001A66), Color(0xFF0D2280)),
            ),
        ),
    )
}

@Composable
fun BrandAppIcon(
    modifier: Modifier = Modifier,
    size: Dp = 96.dp,
) {
    Image(
        painter = painterResource(R.drawable.branding_app_icon),
        contentDescription = "BlurayPOS",
        modifier = modifier.size(size),
        contentScale = ContentScale.Fit,
    )
}

@Composable
fun BrandMarketingLogo(
    modifier: Modifier = Modifier,
    height: Dp = 180.dp,
) {
    Image(
        painter = painterResource(R.drawable.branding_marketing_logo),
        contentDescription = "BlurayPOS",
        modifier = modifier
            .fillMaxWidth()
            .height(height),
        contentScale = ContentScale.Fit,
    )
}

@Composable
fun BlurayWordmark(
    modifier: Modifier = Modifier,
    lightOnDark: Boolean = true,
    fontSize: androidx.compose.ui.unit.TextUnit = 32.sp,
) {
    val blurayColor = if (lightOnDark) Color.White else ShadcnForeground
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Bluray",
            color = blurayColor,
            fontSize = fontSize,
            fontWeight = FontWeight.Bold,
            fontFamily = BlurayTypography,
        )
        Text(
            text = "POS",
            color = BrandBlue,
            fontSize = fontSize,
            fontWeight = FontWeight.Bold,
            fontFamily = BlurayTypography,
        )
    }
}

@Composable
fun BrandTagline(
    modifier: Modifier = Modifier,
    lightOnDark: Boolean = true,
) {
    Text(
        text = "SMART POS. SMARTER BUSINESS.",
        modifier = modifier.fillMaxWidth(),
        textAlign = TextAlign.Center,
        color = if (lightOnDark) Color.White.copy(alpha = 0.72f) else ShadcnMutedForeground,
        style = MaterialTheme.typography.labelMedium.copy(
            letterSpacing = 1.2.sp,
            fontWeight = FontWeight.Medium,
            fontFamily = BlurayTypography,
        ),
    )
}

@Composable
fun BrandAccentDivider(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(width = 40.dp, height = 3.dp)
            .clip(RoundedCornerShape(2.dp))
            .background(Brush.horizontalGradient(listOf(BrandBlue, BrandBlue.copy(alpha = 0.7f)))),
    )
}

@Composable
fun BrandHeader(
    modifier: Modifier = Modifier,
    showIcon: Boolean = true,
    lightOnDark: Boolean = false,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (showIcon && lightOnDark) {
            BrandAppIcon(size = 72.dp)
            Spacer(Modifier.height(16.dp))
        }
        BlurayWordmark(lightOnDark = lightOnDark)
        Spacer(Modifier.height(8.dp))
        BrandAccentDivider()
        Spacer(Modifier.height(8.dp))
        BrandTagline(lightOnDark = lightOnDark)
    }
}
