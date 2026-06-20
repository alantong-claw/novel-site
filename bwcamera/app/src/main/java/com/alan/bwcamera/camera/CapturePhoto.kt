package com.alan.bwcamera.camera

import android.content.Context
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import com.alan.bwcamera.filter.FilterSettings
import com.alan.bwcamera.filter.MonochromeFilterEngine
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
        imageCapture.takePicture(
            executor,
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: androidx.camera.core.ImageProxy) {
                    try {
                        onShutterComplete()
                        val bitmap = image.toNormalizedBitmap()
                        image.close()
                        if (bitmap == null) {
                            onError("無法讀取拍攝影像")
                            continuation.resume(Unit)
                            return
                        }
                        val filtered =
                            engine
                                .apply(bitmap, settings)
                                .rotateBy(settings.rotationCompensationDegrees)
                        val uri = saveBitmapToMediaStore(context, filtered)
                        bitmap.recycle()
                        filtered.recycle()
                        onSaved(uri.toString())
                    } catch (error: Exception) {
                        onError("儲存失敗: ${error.message ?: "unknown error"}")
                    }
                    continuation.resume(Unit)
                }

                override fun onError(exception: ImageCaptureException) {
                    onError("拍照失敗: ${exception.message ?: "camera error"}")
                    continuation.resume(Unit)
                }
            },
        )
    }
}
