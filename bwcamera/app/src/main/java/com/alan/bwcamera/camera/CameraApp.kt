package com.alan.bwcamera.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.view.Surface
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.alan.bwcamera.filter.FilterSettings
import com.alan.bwcamera.filter.TraditionalFilter
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlinx.coroutines.launch

@Composable
fun CameraApp(
    viewModel: CameraViewModel = viewModel(),
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val rotationPreferenceStore = remember(context) { RotationPreferenceStore(context) }
    val permissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            viewModel.onCameraPermissionChanged(granted)
        }
    val previewView =
        remember {
            PreviewView(context).apply {
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
        }
    val analysisExecutor = rememberCameraExecutor()
    val captureExecutor = rememberCameraExecutor()
    val scope = rememberCoroutineScope()
    val latestFilterSettings by
        rememberUpdatedState(
            FilterSettings(
                filter = uiState.selectedFilter,
                brightness = uiState.brightness,
                contrast = uiState.contrast,
                saturation = uiState.saturation,
                filmGrain = uiState.filmGrain,
                rotationCompensationDegrees = uiState.rotationCompensationDegrees,
            ),
        )
    var boundCamera by remember { mutableStateOf<Camera?>(null) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }

    LaunchedEffect(Unit) {
        viewModel.onRotationCompensationChanged(
            rotationPreferenceStore.loadRotationCompensationDegrees(),
        )
        val granted = context.hasPermission(Manifest.permission.CAMERA)
        viewModel.onCameraPermissionChanged(granted)
        if (!granted) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    LaunchedEffect(uiState.zoomRatio, boundCamera) {
        boundCamera?.cameraControl?.setZoomRatio(uiState.zoomRatio)
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        if (!uiState.hasCameraPermission) {
            PermissionGate(
                onRequestPermission = {
                    permissionLauncher.launch(Manifest.permission.CAMERA)
                },
            )
        } else {
            LaunchedEffect(previewView) {
                val provider = ProcessCameraProvider.getInstance(context).get()
                val useCases =
                    bindCameraUseCases(
                        context = context,
                        lifecycleOwner = lifecycleOwner,
                        previewView = previewView,
                        cameraProvider = provider,
                        analysisExecutor = analysisExecutor,
                        settingsProvider = { latestFilterSettings },
                        onPreviewFrame = viewModel::onPreviewFrameReady,
                    )
                boundCamera = useCases.camera
                imageCapture = useCases.imageCapture
                viewModel.onZoomCapabilitiesChanged(
                    minZoom = 1f,
                    maxZoom = useCases.maxZoomRatio,
                    currentZoom = useCases.currentZoomRatio,
                )
            }

            Column(
                modifier = Modifier.fillMaxSize(),
            ) {
                CameraPreview(
                    previewView = previewView,
                    previewBitmap = uiState.previewBitmap,
                    modifier = Modifier.weight(1f),
                )
                ControlPanel(
                    uiState = uiState,
                    onFilterSelected = viewModel::onFilterSelected,
                    onBrightnessChanged = viewModel::onBrightnessChanged,
                    onContrastChanged = viewModel::onContrastChanged,
                    onSaturationChanged = viewModel::onSaturationChanged,
                    onFilmGrainChanged = viewModel::onFilmGrainChanged,
                    onSettingsVisibilityToggled = viewModel::onSettingsVisibilityToggled,
                    onRotateCompensationRequested = {
                        val nextRotation = (uiState.rotationCompensationDegrees + 90) % 360
                        rotationPreferenceStore.saveRotationCompensationDegrees(nextRotation)
                        viewModel.onRotationCompensationChanged(nextRotation)
                    },
                    onZoomChanged = viewModel::onZoomChanged,
                    onCapture = {
                        val capture = imageCapture
                        if (capture == null) {
                            viewModel.onCaptureFailed("相機尚未完成初始化")
                        } else {
                            scope.launch {
                                viewModel.onCaptureStarted()
                                captureFilteredPhoto(
                                    context = context,
                                    imageCapture = capture,
                                    executor = captureExecutor,
                                    settings = FilterSettings(
                                        filter = uiState.selectedFilter,
                                        brightness = uiState.brightness,
                                        contrast = uiState.contrast,
                                        saturation = uiState.saturation,
                                        filmGrain = uiState.filmGrain,
                                        rotationCompensationDegrees = uiState.rotationCompensationDegrees,
                                    ),
                                    onShutterComplete = viewModel::onCaptureShutterComplete,
                                    onSaved = viewModel::onCaptureSaved,
                                    onError = viewModel::onCaptureFailed,
                                )
                            }
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun PermissionGate(
    onRequestPermission: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "需要相機權限才能預覽與拍照",
            style = MaterialTheme.typography.headlineSmall,
        )
        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = onRequestPermission) {
            Text("允許相機")
        }
    }
}

@Composable
private fun CameraPreview(
    previewView: PreviewView,
    previewBitmap: Bitmap?,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier =
            modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceContainerHighest),
    ) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize(),
        )
        if (previewBitmap != null) {
            Image(
                bitmap = previewBitmap.asImageBitmap(),
                contentDescription = "Filtered preview",
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}

@Composable
private fun ControlPanel(
    uiState: CameraUiState,
    onFilterSelected: (TraditionalFilter) -> Unit,
    onBrightnessChanged: (Float) -> Unit,
    onContrastChanged: (Float) -> Unit,
    onSaturationChanged: (Float) -> Unit,
    onFilmGrainChanged: (Float) -> Unit,
    onSettingsVisibilityToggled: () -> Unit,
    onRotateCompensationRequested: () -> Unit,
    onZoomChanged: (Float) -> Unit,
    onCapture: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        if (uiState.statusMessage != null) {
            Text(
                text = uiState.statusMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Traditional B&W Camera",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
            )
            AssistChip(
                onClick = onSettingsVisibilityToggled,
                label = { Text(if (uiState.showSettings) "Hide settings" else "Show settings") },
            )
        }
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(TraditionalFilter.entries) { filter ->
                AssistChip(
                    onClick = { onFilterSelected(filter) },
                    label = { Text(filter.displayName) },
                    leadingIcon = {
                        if (uiState.selectedFilter == filter) {
                            Icon(
                                imageVector = Icons.Rounded.CameraAlt,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    },
                )
            }
        }
        if (uiState.showSettings) {
            SettingsPanel(
                uiState = uiState,
                onBrightnessChanged = onBrightnessChanged,
                onContrastChanged = onContrastChanged,
                onSaturationChanged = onSaturationChanged,
                onFilmGrainChanged = onFilmGrainChanged,
                onZoomChanged = onZoomChanged,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AssistChip(
                onClick = onRotateCompensationRequested,
                label = { Text("Rotate ${uiState.rotationCompensationDegrees}°") },
            )
            Button(
                onClick = onCapture,
                enabled = !uiState.isCaptureInFlight,
                shape = CircleShape,
                modifier = Modifier.size(88.dp),
            ) {
                if (uiState.isCaptureInFlight) {
                    CircularProgressIndicator(
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(28.dp),
                    )
                } else {
                    Icon(
                        imageVector = Icons.Rounded.CameraAlt,
                        contentDescription = "Capture",
                        modifier = Modifier.size(32.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun ColumnScope.SettingsPanel(
    uiState: CameraUiState,
    onBrightnessChanged: (Float) -> Unit,
    onContrastChanged: (Float) -> Unit,
    onSaturationChanged: (Float) -> Unit,
    onFilmGrainChanged: (Float) -> Unit,
    onZoomChanged: (Float) -> Unit,
) {
    SliderWithLabel(
        label = "Brightness ${"%.2f".format(uiState.brightness)}",
        value = uiState.brightness,
        range = -0.35f..0.35f,
        onValueChange = onBrightnessChanged,
    )
    SliderWithLabel(
        label = "Contrast ${"%.2f".format(uiState.contrast)}",
        value = uiState.contrast,
        range = 0.6f..1.8f,
        onValueChange = onContrastChanged,
    )
    SliderWithLabel(
        label = "Saturation bias ${"%.2f".format(uiState.saturation)}",
        value = uiState.saturation,
        range = 0f..1.2f,
        onValueChange = onSaturationChanged,
    )
    SliderWithLabel(
        label = "Zoom ${"%.1f".format(uiState.zoomRatio)}x",
        value = uiState.zoomRatio,
        range = uiState.minZoomRatio..uiState.maxZoomRatio,
        onValueChange = onZoomChanged,
    )
    SliderWithLabel(
        label = "Film grain ${"%.2f".format(uiState.filmGrain)}",
        value = uiState.filmGrain,
        range = 0f..1f,
        onValueChange = onFilmGrainChanged,
    )
}

@Composable
private fun SliderWithLabel(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    onValueChange: (Float) -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surfaceContainer)
                .padding(horizontal = 14.dp, vertical = 10.dp),
    ) {
        Text(text = label, style = MaterialTheme.typography.labelLarge)
        Slider(
            value = value.coerceIn(range.start, range.endInclusive),
            onValueChange = onValueChange,
            valueRange = range,
        )
    }
}

@Composable
private fun rememberCameraExecutor(): ExecutorService {
    val executor = remember { Executors.newSingleThreadExecutor() }
    DisposableEffect(Unit) {
        onDispose {
            executor.shutdown()
        }
    }
    return executor
}

private fun Context.hasPermission(permission: String): Boolean =
    ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

private data class BoundCameraUseCases(
    val camera: Camera,
    val imageCapture: ImageCapture,
    val currentZoomRatio: Float,
    val maxZoomRatio: Float,
)

private fun bindCameraUseCases(
    context: Context,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    previewView: PreviewView,
    cameraProvider: ProcessCameraProvider,
    analysisExecutor: ExecutorService,
    settingsProvider: () -> FilterSettings,
    onPreviewFrame: (Bitmap) -> Unit,
): BoundCameraUseCases {
    val targetRotation = previewView.display?.rotation ?: Surface.ROTATION_0

    val preview =
        Preview.Builder()
            .setTargetRotation(targetRotation)
            .build()
            .also { it.surfaceProvider = previewView.surfaceProvider }

    val imageCapture =
        ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .setTargetRotation(targetRotation)
            .build()

    val analyzer =
        ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .setTargetRotation(targetRotation)
            .build()
            .also {
                it.setAnalyzer(
                    analysisExecutor,
                    PreviewFrameAnalyzer(
                        settingsProvider = settingsProvider,
                        onPreviewFrame = onPreviewFrame,
                    ),
                )
            }

    cameraProvider.unbindAll()
    val camera =
        cameraProvider.bindToLifecycle(
            lifecycleOwner,
            CameraSelector.DEFAULT_BACK_CAMERA,
            preview,
            imageCapture,
            analyzer,
        )

    val zoomState = camera.cameraInfo.zoomState.value
    val currentZoom = zoomState?.zoomRatio ?: 1f
    val maxZoom = zoomState?.maxZoomRatio ?: 8f
    camera.cameraControl.setZoomRatio(currentZoom.coerceIn(1f, maxZoom))

    return BoundCameraUseCases(
        camera = camera,
        imageCapture = imageCapture,
        currentZoomRatio = currentZoom,
        maxZoomRatio = maxZoom,
    )
}
