# BWCamera MVP

Android MVP for a traditional black-and-white camera app that simulates classic colored lens filters before monochrome conversion.

## Current MVP Scope

- Camera preview with `CameraX`
- Traditional filter presets: `Red`, `Orange`, `Yellow`, `Green`, `Blue`
- Adjustable `contrast`, `saturation bias`, and camera `zoom`
- Tap-to-focus on the live preview
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

Verified on 2026-06-21:

- `assembleDebug` completes successfully
- APK output exists at `app/build/outputs/apk/debug/app-debug.apk`
- Current app version is `0.1.1` (`0.1.1-debug` for debug builds)
- Latest verified device result: landscape and portrait photo saves both behave correctly on Alan's phone
- Tap-to-focus is implemented in code and compiles, but still needs on-device confirmation

## Release AAB

The project can build both debug and release app bundles:

```bash
cd /home/alantong/ai-work/bwcamera
JAVA_HOME=$HOME/.local/jdks/temurin-17 ./gradlew bundleDebug
JAVA_HOME=$HOME/.local/jdks/temurin-17 ./gradlew bundleRelease
```

To sign the release bundle for Google Play upload, create a local `keystore.properties`
from `keystore.properties.example` and point it at a local upload keystore. The
real keystore and `keystore.properties` are git-ignored on purpose.

Expected outputs:

- `app/build/outputs/bundle/debug/app-debug.aab`
- `app/build/outputs/bundle/release/app-release.aab`

## Next Technical Steps

1. Verify runtime performance on a real Android device.
2. Replace the analyzer-overlay preview with a lower-latency GPU pipeline.
3. Preserve richer metadata and add gallery review.
4. Add app name, branding, privacy policy, screenshots, and Play Console listing assets.
