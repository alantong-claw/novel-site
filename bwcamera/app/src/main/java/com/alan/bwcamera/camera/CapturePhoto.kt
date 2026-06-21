package com.alan.bwcamera.camera

import android.content.Context
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageCapture
import com.alan.bwcamera.filter.FilterSettings
import com.alan.bwcamera.filter.MonochromeFilterEngine
import java.io.File
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

suspend fun captureFilteredPhoto(
    context: Context,
    imageCapture: ImageCapture,
    executor: java.util.concurrent.Executor,
    settings: FilterSettings,
    onShutterComplete: () -> Unit,
    onSaved: (String) -> Unit,
    onError: (String) -> Unit,
) {
    val engine = MonochromeFilterEngine()
    suspendCancellableCoroutine { continuation ->
        val tempFile = File.createTempFile("bwcamera_capture_", ".jpg", context.cacheDir)
        val outputOptions = ImageCapture.OutputFileOptions.Builder(tempFile).build()
        imageCapture.takePicture(
            outputOptions,
            executor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    try {
                        onShutterComplete()
                        val bitmap = tempFile.toNormalizedBitmap()
                        if (bitmap == null) {
                            onError("無法讀取拍攝影像")
                            continuation.resume(Unit)
                            return
                        }
                        val filtered =
                            engine
                                .apply(bitmap, settings)
                                .rotateBy(settings.rotationCompensationDegrees)
                        val uri =
                            saveBitmapToMediaStore(
                                context = context,
                                bitmap = filtered,
                                metadata = PhotoMetadata.from(settings),
                            )
                        bitmap.recycle()
                        filtered.recycle()
                        onSaved(uri.toString())
                    } catch (error: Exception) {
                        onError("儲存失敗: ${error.message ?: "unknown error"}")
                    } finally {
                        tempFile.delete()
                    }
                    continuation.resume(Unit)
                }

                override fun onError(exception: ImageCaptureException) {
                    tempFile.delete()
                    onError("拍照失敗: ${exception.message ?: "camera error"}")
                    continuation.resume(Unit)
                }
            },
        )
    }
}
