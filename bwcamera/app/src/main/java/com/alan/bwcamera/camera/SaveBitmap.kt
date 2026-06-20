package com.alan.bwcamera.camera

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.graphics.Bitmap
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun saveBitmapToMediaStore(
    context: Context,
    bitmap: Bitmap,
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
