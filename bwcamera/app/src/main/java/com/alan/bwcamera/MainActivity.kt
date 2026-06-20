package com.alan.bwcamera

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.alan.bwcamera.camera.CameraApp
import com.alan.bwcamera.ui.theme.BWCameraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BWCameraTheme {
                CameraApp()
            }
        }
    }
}
