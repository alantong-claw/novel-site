package com.alan.bwcamera.camera

import android.graphics.Bitmap
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.alan.bwcamera.filter.FilterSettings
import com.alan.bwcamera.filter.MonochromeFilterEngine

class PreviewFrameAnalyzer(
    private val settingsProvider: () -> FilterSettings,
    private val onPreviewFrame: (Bitmap) -> Unit,
) : ImageAnalysis.Analyzer {
    private val engine = MonochromeFilterEngine()
    private var frameCounter = 0

    override fun analyze(image: ImageProxy) {
        frameCounter += 1
        if (frameCounter % 3 != 0) {
            image.close()
            return
        }

        val bitmap = image.toNormalizedBitmap()
        image.close()
        if (bitmap == null) {
            return
        }
        val scaled =
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * 0.35f).toInt().coerceAtLeast(160),
                (bitmap.height * 0.35f).toInt().coerceAtLeast(240),
                true,
            )
        bitmap.recycle()
        val settings = settingsProvider()
        val filtered = engine.apply(scaled, settings).rotateBy(settings.rotationCompensationDegrees)
        scaled.recycle()
        onPreviewFrame(filtered)
    }
}
