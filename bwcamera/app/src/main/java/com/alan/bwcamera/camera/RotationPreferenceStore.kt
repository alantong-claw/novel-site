package com.alan.bwcamera.camera

import android.content.Context

private const val PREFS_NAME = "bwcamera_prefs"
private const val KEY_ROTATION_COMPENSATION = "rotation_compensation_degrees"
private const val DEFAULT_ROTATION_COMPENSATION = 90

class RotationPreferenceStore(context: Context) {
    private val prefs =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun loadRotationCompensationDegrees(): Int =
        prefs.getInt(KEY_ROTATION_COMPENSATION, DEFAULT_ROTATION_COMPENSATION)

    fun saveRotationCompensationDegrees(value: Int) {
        prefs.edit().putInt(KEY_ROTATION_COMPENSATION, value).apply()
    }
}
