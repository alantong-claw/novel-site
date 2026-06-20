package com.alan.bwcamera.camera

import android.graphics.Bitmap
import com.alan.bwcamera.filter.TraditionalFilter

data class CameraUiState(
    val hasCameraPermission: Boolean = false,
    val selectedFilter: TraditionalFilter = TraditionalFilter.YELLOW,
    val brightness: Float = 0f,
    val contrast: Float = 1.1f,
    val saturation: Float = 0.35f,
    val filmGrain: Float = 0.18f,
    val rotationCompensationDegrees: Int = 90,
    val showSettings: Boolean = true,
    val zoomRatio: Float = 1f,
    val minZoomRatio: Float = 1f,
    val maxZoomRatio: Float = 8f,
    val isCaptureInFlight: Boolean = false,
    val isPostProcessing: Boolean = false,
    val previewBitmap: Bitmap? = null,
    val statusMessage: String? = "MVP scaffold ready",
)
