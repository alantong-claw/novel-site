package com.alan.bwcamera.camera

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import com.alan.bwcamera.filter.TraditionalFilter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class CameraViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(CameraUiState())
    val uiState: StateFlow<CameraUiState> = _uiState.asStateFlow()

    fun onCameraPermissionChanged(granted: Boolean) {
        _uiState.update { state ->
            state.copy(
                hasCameraPermission = granted,
                statusMessage =
                    if (granted) {
                        "相機就緒，已套用 ${state.selectedFilter.displayName} 模擬"
                    } else {
                        "等待相機權限"
                    },
            )
        }
    }

    fun onFilterSelected(filter: TraditionalFilter) {
        _uiState.update {
            it.copy(
                selectedFilter = filter,
                statusMessage = "切換到 ${filter.displayName} 濾鏡",
            )
        }
    }

    fun onBrightnessChanged(value: Float) {
        _uiState.update { it.copy(brightness = value) }
    }

    fun onContrastChanged(value: Float) {
        _uiState.update { it.copy(contrast = value) }
    }

    fun onSaturationChanged(value: Float) {
        _uiState.update { it.copy(saturation = value) }
    }

    fun onFilmGrainChanged(value: Float) {
        _uiState.update { it.copy(filmGrain = value) }
    }

    fun onSettingsVisibilityToggled() {
        _uiState.update {
            val showing = !it.showSettings
            it.copy(
                showSettings = showing,
                statusMessage = if (showing) "已展開設定面板" else "已隱藏設定面板",
            )
        }
    }

    fun onRotateCompensationRequested() {
        val nextRotation = (_uiState.value.rotationCompensationDegrees + 90) % 360
        onRotationCompensationChanged(nextRotation)
    }

    fun onRotationCompensationChanged(value: Int) {
        _uiState.update {
            it.copy(
                rotationCompensationDegrees = value,
                statusMessage = "旋轉補償調整為 ${value}°",
            )
        }
    }

    fun onZoomChanged(value: Float) {
        _uiState.update { it.copy(zoomRatio = value.coerceIn(it.minZoomRatio, it.maxZoomRatio)) }
    }

    fun onZoomCapabilitiesChanged(
        minZoom: Float,
        maxZoom: Float,
        currentZoom: Float,
    ) {
        _uiState.update {
            it.copy(
                minZoomRatio = minZoom,
                maxZoomRatio = maxZoom,
                zoomRatio = currentZoom.coerceIn(minZoom, maxZoom),
            )
        }
    }

    fun onPreviewFrameReady(bitmap: Bitmap) {
        _uiState.update { it.copy(previewBitmap = bitmap) }
    }

    fun onCaptureStarted() {
        _uiState.update {
            it.copy(
                isCaptureInFlight = true,
                isPostProcessing = false,
                statusMessage = "正在拍攝...",
            )
        }
    }

    fun onCaptureShutterComplete() {
        _uiState.update {
            it.copy(
                isCaptureInFlight = false,
                isPostProcessing = true,
                statusMessage = "已拍攝，正在處理黑白照片...",
            )
        }
    }

    fun onCaptureSaved(uriString: String) {
        _uiState.update {
            it.copy(
                isCaptureInFlight = false,
                isPostProcessing = false,
                statusMessage = "已儲存到 $uriString",
            )
        }
    }

    fun onCaptureFailed(message: String) {
        _uiState.update {
            it.copy(
                isCaptureInFlight = false,
                isPostProcessing = false,
                statusMessage = message,
            )
        }
    }
}
