package com.alan.bwcamera.camera

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.os.Build
import androidx.camera.core.ImageProxy
import java.io.ByteArrayOutputStream

fun ImageProxy.toNormalizedBitmap(): Bitmap? {
    val decoded =
        when (format) {
            ImageFormat.YUV_420_888 -> {
                val nv21 = yuv420888ToNv21(this)
                val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
                val output = ByteArrayOutputStream()
                yuvImage.compressToJpeg(Rect(0, 0, width, height), 92, output)
                val bytes = output.toByteArray()
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
            ImageFormat.JPEG -> {
                val buffer = planes.firstOrNull()?.buffer ?: return null
                val bytes = ByteArray(buffer.remaining())
                buffer.get(bytes)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
            else -> null
        } ?: return null

    val rotation = imageInfo.rotationDegrees
    val rotated =
        if (rotation == 0) {
            decoded
        } else {
            val matrix = Matrix().apply {
                postRotate(rotation.toFloat())
            }
            Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
        }

    val compensated = rotated.applyDeviceRotationCompensation()
    return compensated.ensurePortrait()
}

private fun Bitmap.ensurePortrait(): Bitmap {
    if (height >= width) {
        return this
    }

    val matrix = Matrix().apply {
        postRotate(90f)
    }
    val normalized = Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
    if (normalized !== this) {
        recycle()
    }
    return normalized
}

private fun Bitmap.applyDeviceRotationCompensation(): Bitmap {
    val needsSonyCompensation =
        Build.MANUFACTURER.equals("Sony", ignoreCase = true) &&
            Build.MODEL.equals("XQ-BC72", ignoreCase = true)
    if (!needsSonyCompensation) {
        return this
    }

    val matrix = Matrix().apply {
        postRotate(-90f)
    }
    val compensated = Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
    if (compensated !== this) {
        recycle()
    }
    return compensated
}

fun Bitmap.rotateBy(degrees: Int): Bitmap {
    val normalizedDegrees = ((degrees % 360) + 360) % 360
    if (normalizedDegrees == 0) {
        return this
    }

    val matrix = Matrix().apply {
        postRotate(normalizedDegrees.toFloat())
    }
    val rotated = Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
    if (rotated !== this) {
        recycle()
    }
    return rotated
}

private fun yuv420888ToNv21(image: ImageProxy): ByteArray {
    val yBuffer = image.planes[0].buffer
    val uBuffer = image.planes[1].buffer
    val vBuffer = image.planes[2].buffer

    val ySize = yBuffer.remaining()
    val uSize = uBuffer.remaining()
    val vSize = vBuffer.remaining()
    val nv21 = ByteArray(ySize + uSize + vSize)

    yBuffer.get(nv21, 0, ySize)

    val chromaRowStride = image.planes[1].rowStride
    val chromaPixelStride = image.planes[1].pixelStride
    val chromaHeight = image.height / 2
    val chromaWidth = image.width / 2

    var outputOffset = ySize
    val uBytes = ByteArray(uSize)
    val vBytes = ByteArray(vSize)
    uBuffer.get(uBytes)
    vBuffer.get(vBytes)

    for (row in 0 until chromaHeight) {
        for (col in 0 until chromaWidth) {
            val offset = row * chromaRowStride + col * chromaPixelStride
            nv21[outputOffset++] = vBytes[offset]
            nv21[outputOffset++] = uBytes[offset]
        }
    }

    return nv21
}
