# BWCamera Memory Index

這份檔案是 BWCamera 的主入口。之後只要 Alan 提到 `BW Camera` / `BWCamera`，先讀這份，再按需要展開到對應 owner record、daily memory、或 code。

## Current Status

- 專案路徑：`/home/alantong/ai-work/bwcamera`
- 當前性質：可工作的 `debug` 測試版已驗證；下一階段是 Google Play release prep
- 目前 debug package：`com.alan.bwcamera.debug`
- 最新已知可用 APK：`/home/alantong/ai-work/bwcamera/app/build/outputs/apk/debug/app-debug.apk`
- 最新已知可用 APK 時間戳：`2026-06-20 08:19:10 +0800`

## Verified Runtime Checkpoint

- Alan 已確認這版可用，且：
  - `Brightness` / `Film grain` 可見可用
  - 照片可成功儲存
  - 手動 `Rotate` 可修正方向
  - `Rotate` 的手動補償值現在會記住，下次啟動會沿用
- Sony 實機已驗證：
  - 裝置：`Sony XQ-BC72`
  - `rotate 0` 畫面方向正確的描述曾出現，但後續實務上仍保留手動 `Rotate` 作為可靠補償

## Install / Launch Path

- Alan 已驗證的 Windows 安裝路徑：
  - `\\wsl.localhost\Ubuntu\home\alantong\ai-work\bwcamera\app\build\outputs\apk\debug\app-debug.apk`
- Alan 已驗證的 Windows `adb` 安裝方式：
  - `adb install -r "\\wsl.localhost\Ubuntu\home\alantong\ai-work\bwcamera\app\build\outputs\apk\debug\app-debug.apk"`
- Alan 已驗證的啟動方式：
  - `adb shell monkey -p com.alan.bwcamera.debug -c android.intent.category.LAUNCHER 1`

## Key Files

- App UI / flow:
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/CameraApp.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/CameraViewModel.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/CameraUiState.kt`
- Capture / save / orientation:
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/CapturePhoto.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/ImageProxyBitmap.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/SaveBitmap.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/camera/RotationPreferenceStore.kt`
- Filters:
  - `bwcamera/app/src/main/java/com/alan/bwcamera/filter/FilterSettings.kt`
  - `bwcamera/app/src/main/java/com/alan/bwcamera/filter/MonochromeFilterEngine.kt`

## Known Critical Pitfalls

- 不要只看 source / APK timestamp 就假設手機跑的是最新版；Alan 曾實際踩到點錯舊 app 的坑。
- debug 包要用不同 launcher 名稱區分；目前 debug app 名稱是 `BW Camera Debug`。
- `Show settings` 面板曾經預設收合，造成功能其實存在卻像沒做；目前預設展開。
- Preview 與 capture 的 `ImageProxy` 格式不同：
  - preview analyzer 走 `YUV_420_888`
  - `ImageCapture.takePicture(... OnImageCapturedCallback ...)` 預設回 `JPEG`
  - `ImageProxyBitmap.kt` 必須同時支援 `YUV_420_888` 和 `JPEG`，不然會出現「看起來拍到了，但照片存不下來」
- 不同手機的最佳 `Rotate` 值不一定一樣；目前只保證手動補償可用，且會記住上次值。

## Durable Records

- 高層長任務 owner：
  - `memory/tasks/bwcamera-owner.md`
- 後續 device/polish owner：
  - `memory/tasks/bwcamera-device-polish-owner.md`
- Daily notes：
  - `memory/2026-06-18.md`
  - `memory/2026-06-19.md`
  - `memory/2026-06-20.md`
- 長期摘要：
  - `MEMORY.md`

## Public Writeups

- 成長日誌：
  - `https://alantong-claw.github.io/novel-site/clawchan-2026-06-20.html`
- 難啃技術：
  - `https://alantong-claw.github.io/novel-site/tech-2026-06-20-camerax-jpeg-capture-gap.html`

## Key Commits

- `5088109` `Add BWCamera app and publish June 20 notes`
- `ca51699` `Persist BWCamera rotate compensation`
- `5bd7d76` in `novel_site`: `Add BWCamera journal and tech notes`

## Next Phase

- 主線不再是 debug smoke test，而是 Google Play release prep。
- 如果之後 Alan 說要回頭修 app，先確認他要的是：
  - 再做 debug 測試
  - 收 UI 控制項
  - 做 release / signing / Play Console 上架
