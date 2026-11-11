# Verification report

## Completed checks

- Browser opened the canonical `http://127.0.0.1:4173/` preview and showed the home screen inside the S26 Ultra frame.
- Browser opened `/demo/` inside the same frame. The source showed 12 product cards and the reconstructed panel showed 12 mapped cards.
- Browser activated reconstructed Add twice in successive sessions. The original cart badge moved from 1 to 2 and later 2 to 3, and the adapter reported `Added once; cart count verified.` A third Details action opened the original product modal, retained the chosen Ocean variant, and mapped Add to the source cart.
- Browser selected Best deals and observed the source product cards reorder by fixture savings.
- Browser chose Find a coupon, explicitly applied `DEMO10`, and observed the fixture-consent text. The original cart/cart quantity remained shared. The sample cart displays the discount and states that no payment or checkout occurs.
- Browser disabled the ClearChoice engine, reopened the demo, confirmed the adapter launcher was absent, and clicked the original Add button. The cart count still increased from 4 to 5.
- `xcodebuild -project apps/ios/ClearChoice.xcodeproj -scheme ClearChoice -sdk iphonesimulator -destination 'platform=iOS Simulator,id=FCDC992C-F97E-4AC9-8CE3-6FA997DB5FC1' CODE_SIGNING_ALLOWED=NO build` completed with `BUILD SUCCEEDED`, including the app and Safari extension targets.

## Automated suite

`tests/e2e/control-center.spec.js` completed with **9 passed**. Coverage includes the S26 frame, reconstructed Add/cart verification, source store fallback, fixture insights, Studio prompts with scoped settings and profiles, original variant selection, and variant-specific quantities. The mode test verifies distinct initial views for UI Overlay, Smart Shopping, Data Assist, and the consent-gated AI Studio entry while retaining the same source cart. No AI request occurs without consent.

The previous Studio prompt failure was caused by duplicate navigation renders racing with input. Navigation now renders once on the hash change, and the selected Studio scope is retained when rendering.

The extension E2E suite completed with **2 passed**. It verifies the unpacked MV3 package and shared modules, confirms site permission is absent by default, then uses an isolated test manifest with only the local fixture origin pre-granted to exercise injection, one-time source Add and cart verification, native variant selection, pause/restore, and re-enable. The gateway browser test completed with **1 passed**: a page served from the allowed preview origin completed the CORS preflight and received deterministic local analysis with AI consent off.

## Not verified

- The coordinator independently verified a live local gateway response: HTTP 200, `local-ai`, with a non-null Minimal layout containing two original products and matching source prices, currencies, and IDs. The model ignored the requested lowest-price-first order, so that intent is not verified. The browser preflight check covered consent-free local analysis; a consented AI layout request from the browser was not verified.
- The extension runtime test uses a pre-granted localhost permission in its isolated test profile. The actual Chrome site-permission request prompt was not exercised end to end.
- The iOS app and extension compiled for the simulator; no Safari on-device permission or injection flow was run.
- Retailer sites and native retailer applications were not tested or marked active.


## Desktop screenshots

Captured from the running canonical preview with Chromium at 1440 × 1100. These are actual browser screenshots with no compositing. The capture session used fresh local state, and no products were added to the cart.

- [Desktop Home](qa/desktop-home.png): S26 Ultra frame, Home selected, ClearChoice Demo Ready.
- [Transformed shopping view](qa/desktop-shopping.png): source-mapped product cards and original prices inside the same device frame.

The visible preview remains open at `http://127.0.0.1:4173/#home`.


## Controlled Android evidence

`apps/android/qa/instrumentation.log` records the native overlay → original product → Medium/Sage variant selection → source Add → observed Cart (1) → protected Demo checkout flow with `INSTRUMENTATION_CODE: 0`. `apps/android/qa/stress-result.json` records 100 complete cycles across 1,816.48 seconds with `failure: null`. This verifies the controlled DemoShop scope. Retailer apps remain unverified. See [Android QA](../apps/android/qa/README.md) for the actual screenshots, video, and tested APK scope.

## Source evidence review repair

The final shared-engine/gateway build and JavaScript unit suite passed: **16 tests, 16 passed, 0 failed**. Focused review coverage checks exact source evidence, observed versus unverified labels, clean-screen empty results, and rejects stale revisions, unknown IDs, invented evidence and executable output fields. The existing catalog-layout tests still pass. Earlier unchanged browser suites remain 9 control-center, 2 extension and 1 browser CORS tests passed; they were not repeated for this repair.

One real request to the installed local `qwen3:4b-instruct` on the restarted gateway returned HTTP **200**, mode **local-ai-review**, three source-anchored annotations, and `layout:null`. The categories were selected protection plan (`observed` checked state), “Only 2 left” (`unverified` inventory claim), and “Additional charges may apply” (`unverified` amount/conditions). The response retained the caller's exact source IDs and revision. The live gateway returned allowed-origin CORS for `http://127.0.0.1:4173` and OPTIONS **204**. Actual request/response evidence is [local-review-result.json](qa/local-review-result.json).

The model corroborates candidate source/rule/evidence records; canonical annotation wording and rationale come from deterministic rules. This does not prove free-form model discovery, retailer claim truth, a generated redesign, or native visual integration. Android must send `requestKind:"review"` and consume the returned source-ID annotations; native runtime verification belongs to the Android build. The gateway remains on loopback port 8787 with the configured 4173 origins.
