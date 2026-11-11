# Native acceptance evidence

`instrumentation.log` records the passing independent native overlay flow. `evidence/` contains actual emulator screenshots, including catalog end, original store, second product, variants, cart and protected checkout.

The custom test runner is in `demoshop/src/androidTest/java/com/clearchoice/FlowInstrumentation.java`. It deliberately targets the separate store so starting instrumentation does not kill the ClearChoice service process. It uses `UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES`; the default UIAutomator CLI is unsuitable for this accessibility-service acceptance test.

Build with `./gradlew assembleDebug :demoshop:assembleDebugAndroidTest`. Install both apps and the Demo Shop androidTest APK. Complete onboarding and enable the ClearChoice service, then run `adb shell am instrument -w com.demoshop.test/com.clearchoice.FlowInstrumentation`.

`stress.py` repeats the complete instrumented flow for a bounded 1,800 seconds and stops on any failure. Its final summary is `stress-result.json`; the completed run reports 100 passes over 1,816.48 seconds with no failure. It is intended only for the disposable emulator.

Host workaround: Android platform-tools 37.0.1 can crash its macOS mDNS server. The coordinator runs a persistent `ADB_MDNS=0 adb nodaemon server`. Do not restart it without that setting during the run.

The final hardening, profiles, and gateway changes have focused runtime evidence; see ANDROID-STATUS.md for exact artifact hashes and scope. The stress-tested APK is preserved beside the 179.52-second MP4 in evidence/.

Final hardening checks: build the store test APK with `-PtestRunner=com.clearchoice.SafetyInstrumentation`, then run that runner with `am instrument -w`. The default store runner remains FlowInstrumentation for the core smoke. The ClearChoice androidTest APK uses GatewayInstrumentation for one bounded real local-gateway request; it restores prior gateway consent after the check. Starting a test targeted at ClearChoice restarts that app's service process, so run the store smoke after it.

See safety.log, gateway-client.log and final-smoke.log for final affected checks. The 100-run stress result applies to the preserved baseline APK hashes, not the later hardened binaries. Final hashes are recorded separately.
