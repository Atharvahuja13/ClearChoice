# Price annotation QA, 11 November 2026

Result: 17 deterministic parser assertions passed. The installed matching app/test APK pair then passed 16 real-device internal source-to-annotation checks (`INSTRUMENTATION_CODE: 0`). Raw output: `docs/qa/price-annotation-instrumentation.log`.

The test-only source Activity is declared only in the instrumentation APK, has no LAUNCHER entry or merchant branding, and is recognized only when both `internal_qa` and its explicit package opt-in are true. It exposes a real native price Button and ScrollView. Tests observed accessibility bounds, attached real accessibility windows, injected a tap through the price stroke to the source Button, observed the source price change and new annotation, checked old-window detachment, scrolled the source until price was no longer visible, and verified pause detachment. Own-window events did not recreate the annotation during the stability interval. No screenshots, sign-in, purchase actions, or retailer app tests were performed.

Production fixes found through these runs: attachment is asynchronous after addView, so ACTIVE waits for an attachment callback with generation/opt-in/foreground guards; underlying foreground resolution uses focused application windows instead of the overlay itself; generic source-window changes refresh only the supported opted-in foreground package. Unknown/mixed/conditional components remain incomplete or rejected.

From repository root, parser checks:

    JAVA_HOME=/tmp/clearchoice-jdk21/Contents/Home apps/android/clearchoice/src/test/run-price-evidence-tests.sh

Controlled emulator runner (installs the matching named APKs, rebinds accessibility during instrumentation, then restores the agreed null/off accessibility state):

    python3 apps/android/clearchoice/src/test/run-price-annotation-emulator.py

APK pair:
- `apps/android/ClearChoice-debug.apk` SHA256 `59cac52aa568655db98fc3d03fa504890451135baa9414246a4f38a3eb443b37`
- `apps/android/clearchoice/PriceAnnotation-test.apk` SHA256 `99ab8dde4f0d3899326d89dbf2d244ed0f45d26b77b124cbc17fc813e25ffe80`

Final checked settings: enabled_accessibility_services = null, accessibility_enabled = 0. The test-only source Activity was stopped. Shopee/Lazada compatibility and user-facing price annotation E2E remain unverified.
