package com.alan.bwcamera.filter

enum class TraditionalFilter(
    val displayName: String,
    val redBoost: Float,
    val greenBoost: Float,
    val blueBoost: Float,
) {
    RED("Red", 1.45f, 0.95f, 0.55f),
    ORANGE("Orange", 1.30f, 1.00f, 0.68f),
    YELLOW("Yellow", 1.18f, 1.08f, 0.76f),
    GREEN("Green", 0.85f, 1.35f, 0.78f),
    BLUE("Blue", 0.72f, 0.92f, 1.28f),
}
