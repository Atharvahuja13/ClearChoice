# Current product scope — control center only

The current ClearChoice APK is a clean native control center with **Manage Apps, Features and Activity**, plus pause, privacy and accessibility permissions. It contains no shopping storefront, shopping-mode launch flow, product catalog or Demo Shop launcher. Shopping belongs in the independently opened original app. The separate Demo Shop APK and prior records below are historical QA fixtures only, not the product experience or proof of real-retailer support.

Current APK SHA256: **7ad0152c7026a7a6916942d6871769e844bf78d4d987e275e80fe7670a8590d2**. The final label-only build passed. Pause and permission controls are confined to management, with no Studio or shopping flow in the shell. The preceding shell build passed launch; targeted UI evidence is qa/control-center.png and qa/control-center-ui.txt, with Features/Activity hierarchy captures. No stress test was repeated for this scope correction. Earlier stress/hardening APKs remain preserved with their separate hashes.

## Real retailer installation gate

Official Google Play listings exist for Shopee Singapore (`com.shopee.sg`, https://play.google.com/store/apps/details?id=com.shopee.sg) and Lazada (`com.lazada.android`, https://play.google.com/store/apps/details?id=com.lazada.android). Both official market intents were opened on the existing emulator. Play Store shows **“Sign in to find the latest Android apps …”** and a **Sign in** button. The emulator has Play Store and Play Services, but no Google account is signed in. Neither retailer package is installed. Evidence: qa/play-check.png, qa/play-account-gate.txt and empty qa/retailer-installed-packages.txt. Compatibility/certification cannot yet be evaluated beyond this account gate. No APK mirrors were used.

## Conservative recognition

The app queries only the known retailer packages. Recognition is off by default and cannot be enabled for an uninstalled app. For an installed, explicitly allowed retailer, the service may record package identity, but it **does not traverse its nodes or transform its screens** until a real source adapter is verified. Currently neither retailer adapter is verified. Original retailer screens therefore remain untouched. Actual accessible-node inspection and reliable source-backed transformation are blocked until official installation is possible. Sensitive-input exclusions remain in the existing verified QA engine. No real carts or purchases were touched.

The device is an Android emulator, not verified Samsung One UI firmware.

---

## Historical native QA evidence (earlier scope/builds)

# Native Android delivery and evidence

Both named APKs build with official Android API 35, Gradle 8.10.2, AGP 8.7.3 and JDK 21. Set JAVA_HOME and ANDROID_HOME, then run `./gradlew assembleDebug` in this directory. Build outputs use ~/.gradle/clearchoice-build to avoid cloud-sync resource duplication in Documents. The original API 37 SDK directory and metadata were restored; no SDK renaming is needed.

## Exact tested scope

The frozen baseline passed **100 complete native cross-app flows in 1,816.48 seconds**, failure=null, with an empty Android crash buffer. Each cycle used the independent controlled store, scrolled to product 12, restored the original store, re-entered the overlay, selected the second product (Everyday Canvas Tote), chose Medium/Sage in original native pickers, observed exactly Cart (1), and handed off to original protected checkout. Raw evidence: qa/stress-result.json, qa/stress.log, qa/crash-buffer.log. Both exact stress APKs are preserved in qa/evidence/; their hashes are qa/apk-sha256.txt. An earlier three-cycle failure is preserved as qa/stress-prior-failure.json and was repaired before the full successful run.

The later hardened APKs have separate hashes in qa/final-apk-sha256.txt. They were **not** subjected to another 30-minute run. They passed the affected checks and final core smoke:

- qa/safety.log: real dashboard pause/resume, rotation, service permission revocation and rebind, editable/password source exclusion, no entered fixture value in preferences, valid per-screen profile schema, out-of-range import rejection, unknown/stale gateway source rejection, real UI JSON export/import, persisted PRODUCT override and rendered Accessible profile.
- qa/final-smoke.log: complete mapped cross-app flow, source catalog scroll, original restore, correct nonfirst product, variants, duplicate and stale Add-node attempts, exactly Cart (1), original protected checkout. INSTRUMENTATION_CODE: 0.
- qa/gateway-client.log: actual native HTTP client returned mode=local-ai-review, validatedSourceCount=1, error=null. Empty or rejected output does not receive an AI-success label.
- qa/final-crash-buffer.log: empty after final checks. Builds are logged in qa/hardening-build.log, qa/gateway-build.log and qa/final-test-build.log.

## Hardening and capabilities

Before reading or hashing source text, a flag-only scan rejects **any editable or password node** in an allowlisted window. The same guard covers resume and mapped actions. Traversal also omits input nodes and their values defensively. Such screens return to the original app, pending actions are cancelled, and cached source nodes/emphasis are cleared. Entered form values are never included in the gateway request. This intentionally also excludes ordinary editable shopping/search forms.

The gateway is opt-in, asynchronous, bounded and cached. Native requests use requestKind=review and the shared perception contract. The client accepts exact-current-source annotation references only, retains all original text/prices/currency/actions, and applies visual emphasis only. Invalid, stale, unknown or unavailable output retains local deterministic rendering. Local review and local-AI review labels remain distinct; cloud success is not claimed.

Profiles support global, Demo Shop app, SHOP, PRODUCT and CART overrides; Balanced/Minimal/Accessible/Custom presets; text size, spacing, compact density and saved prompt. JSON copy/export and paste/import use a strict local versioned schema. A per-screen override wins over app/global preferences. Custom prompts affect the optional gateway; local rules do not interpret free-form instructions.

## Video and screenshots

Actual continuous baseline capture: **qa/evidence/ClearChoice-evidence.mp4**, **179.5197 seconds**, verified MP4 metadata in qa/video-metadata.json. The continuous proof interval is the full **00:00–02:59.52** capture, which includes repeated mapped native product/variant/cart flows. No frame-exact per-action markers were embedded. The initial cycle is approximately the first 20 seconds; automated raw flow logs are the authoritative action/result evidence. The video was not re-recorded after hardening, so later safety/profile checks are supported by their own logs and qa/evidence/hardening screenshots. No external upload was performed.

## Capability limits

Only the separately installed Demo Shop is verified. Shopee/Lazada/TikTok/Amazon integration is not claimed. The overlay is a semantic vertical reconstruction; it does not preserve original pixel layout. Native AI applies source-anchored review emphasis, not arbitrary generated UI or catalog reorder. Screen-specific profiles cover the three known controlled-store screens. Android password/editable flags and known sensitive-screen semantics are supported; opaque custom controls that expose neither cannot be reliably classified. The notification pause action exists, but the dedicated pause test exercised the dashboard control rather than the notification shade. All nine detection rules are heuristics; a comprehensive fixture-by-fixture detector accuracy suite was not run. Arbitrary color/design-token authoring and file-picker profile export are not implemented; JSON clipboard export/import is available. No blanket claim that every original blueprint item is complete is made.
