package com.alan.bwcamera.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors =
    lightColorScheme(
        primary = InkBlack,
        onPrimary = WarmPaper,
        secondary = SepiaAccent,
        background = WarmPaper,
        onBackground = InkBlack,
        surface = ColorTokens.surface,
        onSurface = InkBlack,
        surfaceContainer = Fog,
        surfaceContainerHighest = SteelGray,
    )

private val DarkColors =
    darkColorScheme(
        primary = WarmPaper,
        onPrimary = InkBlack,
        secondary = SepiaAccent,
        background = InkBlack,
        onBackground = WarmPaper,
        surface = ColorTokens.surfaceDark,
        onSurface = WarmPaper,
        surfaceContainer = SteelGray,
        surfaceContainerHighest = ColorTokens.surfaceHighestDark,
    )

@Composable
fun BWCameraTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = AppTypography,
        content = content,
    )
}

private object ColorTokens {
    val surface = WarmPaper
    val surfaceDark = InkBlack
    val surfaceHighestDark = SteelGray
}
