package com.alan.bwcamera.filter

import android.graphics.Bitmap
import kotlin.math.roundToInt
import kotlin.random.Random

class MonochromeFilterEngine {
    fun apply(
        source: Bitmap,
        settings: FilterSettings,
    ): Bitmap {
        val width = source.width
        val height = source.height
        val pixels = IntArray(width * height)
        source.getPixels(pixels, 0, width, 0, 0, width, height)
        val grainSeed = Random.nextInt()

        for (index in pixels.indices) {
            val x = index % width
            val y = index / width
            val color = pixels[index]
            val alpha = color ushr 24 and 0xFF
            val red = color ushr 16 and 0xFF
            val green = color ushr 8 and 0xFF
            val blue = color and 0xFF

            val filteredLuma = applyFilter(red, green, blue, settings)
            val brightnessAdjusted = adjustBrightness(filteredLuma, settings.brightness)
            val contrastAdjusted = adjustContrast(brightnessAdjusted, settings.contrast)
            val grainAdjusted =
                applyFilmGrain(
                    value = contrastAdjusted,
                    amount = settings.filmGrain,
                    x = x,
                    y = y,
                    seed = grainSeed,
                )
            val gray = grainAdjusted.coerceIn(0, 255)
            pixels[index] =
                (alpha shl 24) or
                    (gray shl 16) or
                    (gray shl 8) or
                    gray
        }

        return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
    }

    private fun applyFilter(
        red: Int,
        green: Int,
        blue: Int,
        settings: FilterSettings,
    ): Int {
        val r = red / 255f
        val g = green / 255f
        val b = blue / 255f

        val filter = settings.filter
        val saturationBias = settings.saturation.coerceIn(0f, 1.2f)
        val weightedRed = r * filter.redBoost * (1f + 0.30f * saturationBias)
        val weightedGreen = g * filter.greenBoost * (1f + 0.18f * saturationBias)
        val weightedBlue = b * filter.blueBoost * (1f - 0.22f * saturationBias)

        val normalized =
            (
                weightedRed * 0.299f +
                    weightedGreen * 0.587f +
                    weightedBlue * 0.114f
            ) /
                (0.299f * filter.redBoost + 0.587f * filter.greenBoost + 0.114f * filter.blueBoost)

        return (normalized * 255f).roundToInt()
    }

    private fun adjustContrast(
        value: Int,
        contrast: Float,
    ): Int {
        val pivot = 128f
        return (((value - pivot) * contrast) + pivot).roundToInt()
    }

    private fun adjustBrightness(
        value: Int,
        brightness: Float,
    ): Int {
        val offset = brightness.coerceIn(-0.45f, 0.45f) * 96f
        return (value + offset).roundToInt()
    }

    private fun applyFilmGrain(
        value: Int,
        amount: Float,
        x: Int,
        y: Int,
        seed: Int,
    ): Int {
        val grainStrength = amount.coerceIn(0f, 1f)
        if (grainStrength <= 0f) {
            return value
        }

        val coarseNoise = grainNoise(x shr 1, y shr 1, seed)
        val fineNoise = grainNoise(x, y, seed xor 0x68bc21eb)
        val microNoise = grainNoise(x * 2 + 1, y * 2 + 1, seed xor 0x02e5be93)
        val noiseUnit = coarseNoise * 0.25f + fineNoise * 0.55f + microNoise * 0.20f
        val highlightTaper = 0.70f + (1f - value / 255f) * 0.30f
        val noise = noiseUnit * grainStrength * 58f * highlightTaper
        return (value + noise).roundToInt()
    }

    private fun grainNoise(
        x: Int,
        y: Int,
        seed: Int,
    ): Float {
        var mixed = x * 0x1f1f1f1f
        mixed = mixed xor (y * 0x6d2b79f5)
        mixed = mixed xor seed
        mixed = mixed xor (mixed ushr 15)
        mixed *= 0x2c1b3c6d
        mixed = mixed xor (mixed ushr 12)
        mixed *= 0x297a2d39
        mixed = mixed xor (mixed ushr 15)
        return (mixed ushr 8 and 0xFFFF) / 32767.5f - 1f
    }
}
