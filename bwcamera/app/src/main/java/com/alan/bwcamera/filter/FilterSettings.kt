package com.alan.bwcamera.filter

data class FilterSettings(
    val filter: TraditionalFilter,
    val brightness: Float,
    val contrast: Float,
    val saturation: Float,
    val filmGrain: Float,
    val rotationCompensationDegrees: Int = 0,
)
