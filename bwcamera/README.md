# BWCamera MVP

Android MVP for a traditional black-and-white camera app that simulates classic colored lens filters before monochrome conversion.

## Current MVP Scope

- Camera preview with `CameraX`
- Traditional filter presets: `Red`, `Orange`, `Yellow`, `Green`, `Blue`
- Adjustable `contrast`, `saturation bias`, and camera `zoom`
- Filtered capture pipeline that saves JPEG output to `Pictures/BWCamera`
- Compose-based UI ready for iteration

## Project Layout

- `app/src/main/java/com/alan/bwcamera/camera`
  Camera UI, CameraX binding, frame analysis, capture flow
- `app/src/main/java/com/alan/bwcamera/filter`
  Traditional filter definitions and monochrome processing engine
- `app/src/main/java/com/alan/bwcamera/ui/theme`
  Visual theme and typography

## Build

Local verification is currently working with the user-local Temurin 17 JDK at `~/.local/jdks/temurin-17`.

```bash
cd /home/alantong/ai-work/bwcamera
JAVA_HOME=$HOME/.local/jdks/temurin-17 ./gradlew assembleDebug
```

Verified on 2026-06-19:

- `assembleDebug` completes successfully
- APK output exists at `app/build/outputs/apk/debug/app-debug.apk`
- No Android device is currently attached to the local `adb` server, so install/smoke testing still needs a connected device or emulator

## Next Technical Steps

1. Verify runtime performance on a real Android device.
2. Replace the analyzer-overlay preview with a lower-latency GPU pipeline.
3. Preserve richer metadata and add gallery review.
4. Add app name, branding, privacy policy, screenshots, and release signing for Google Play.
