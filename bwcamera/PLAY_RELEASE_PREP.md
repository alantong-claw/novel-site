# BWCamera Play Release Prep

Current verified state as of 2026-06-20:

- Release application ID: `com.alan.bwcamera`
- Debug application ID: `com.alan.bwcamera.debug`
- Release signing is wired through local `keystore.properties`
- Local upload keystore exists at `release/upload-keystore.jks`
- `signingReport` resolves the `release` config successfully
- Signed release bundle output: `app/build/outputs/bundle/release/app-release.aab`

What is already done:

1. Release build uses the non-debug application ID.
2. Release signing config is connected in `app/build.gradle.kts`.
3. Local secret files are git-ignored:
   - `keystore.properties`
   - `*.jks`
   - `*.keystore`
4. A local upload keystore has been generated and verified.

What still needs Play Console work:

1. Create the Play Console app entry.
2. Decide whether to keep this upload key as the long-term upload key.
3. Fill store listing metadata:
   - app name
   - short description
   - full description
   - screenshots
   - app icon / feature graphic
4. Provide a privacy policy URL if required by the chosen data-safety answers.
5. Complete Data safety, App access, Content rating, and target audience forms.
6. Upload the signed AAB to an internal testing track first.

Recommended next move:

- Use the existing signed AAB for first internal-track validation.
- Before public release, decide whether the current upload keystore should become the permanent one.
