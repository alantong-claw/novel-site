package com.alan.bwcamera.camera

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import com.alan.bwcamera.filter.FilterSettings
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class PhotoMetadata(
    val filterName: String,
    val brightness: Float,
    val contrast: Float,
    val saturation: Float,
    val filmGrain: Float,
    val rotationCompensationDegrees: Int,
) {
    fun toExifComment(): String =
        buildString {
            append("filter=")
            append(filterName)
            append("; brightness=")
            append("%.2f".format(Locale.US, brightness))
            append("; contrast=")
            append("%.2f".format(Locale.US, contrast))
            append("; saturation=")
            append("%.2f".format(Locale.US, saturation))
            append("; filmGrain=")
            append("%.2f".format(Locale.US, filmGrain))
            append("; rotate=")
            append(rotationCompensationDegrees)
        }

    companion object {
        fun from(settings: FilterSettings): PhotoMetadata =
            PhotoMetadata(
                filterName = settings.filter.displayName,
                brightness = settings.brightness,
                contrast = settings.contrast,
                saturation = settings.saturation,
                filmGrain = settings.filmGrain,
                rotationCompensationDegrees = settings.rotationCompensationDegrees,
            )
    }
}

fun saveBitmapToMediaStore(
    context: Context,
    bitmap: Bitmap,
    metadata: PhotoMetadata,
): Uri {
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val filename = "BWCamera_$timestamp.jpg"
    val resolver = context.contentResolver
    val collection =
        MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val values =
        ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, filename)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/BWCamera")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }

    val uri =
        resolver.insert(collection, values)
            ?: throw IOException("MediaStore insert failed")

    try {
        resolver.openOutputStream(uri)?.use { output ->
            if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 96, output)) {
                throw IOException("JPEG compression failed")
            }
        } ?: throw IOException("Unable to open output stream")

        writeExifMetadata(
            context = context,
            uri = uri,
            metadata = metadata,
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val publishValues =
                ContentValues().apply {
                    put(MediaStore.Images.Media.IS_PENDING, 0)
                }
            resolver.update(uri, publishValues, null, null)
        }
    } catch (error: Exception) {
        resolver.delete(uri, null, null)
        throw error
    }

    return uri
}

private fun writeExifMetadata(
    context: Context,
    uri: Uri,
    metadata: PhotoMetadata,
) {
    val resolver = context.contentResolver
    resolver.openFileDescriptor(uri, "rw")?.use { descriptor ->
        val exif = ExifInterface(descriptor.fileDescriptor)
        exif.setAttribute(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL.toString())
        exif.setAttribute(ExifInterface.TAG_SOFTWARE, "BWCamera")
        exif.setAttribute(ExifInterface.TAG_IMAGE_DESCRIPTION, "BWCamera ${metadata.filterName} filter")
        exif.setAttribute(ExifInterface.TAG_USER_COMMENT, metadata.toExifComment())
        exif.saveAttributes()
    } ?: throw IOException("Unable to open file descriptor for EXIF metadata")
}
