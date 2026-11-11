# ClearChoice

ClearChoice adds price clarity over existing Android shopping apps. The original shop stays visible and handles browsing, accounts, carts and checkout. ClearChoice marks an observed price and displays a breakdown including observed delivery and mandatory fees. Unknown fees are labelled incomplete; it never invents a final payable price.

The native control center manages app opt-ins, preferences, features, activity, permissions and pause controls. There is no consumer Demo Shop or Shopping Mode. Store fixtures and older reconstruction experiments in this repository are internal QA and historical work.

## Current status — 11 November 2026

- Native control pages build, install and run, using the supplied navy/light designs.
- Bounded accessibility annotations preserve the source app. Price-mark touches pass through; the breakdown label is dismissible.
- **17 parser checks and 16 Android source-to-annotation checks passed.** Android checks used a test-only native source and covered source bounds, actual native tap-through, price changes, scrolling, pause and own-window stability.
- The desktop view streams the actual emulator through scrcpy/H264 with input forwarding.
- **Shopee and Lazada are not installed on the current emulator. Their compatibility and delivery-inclusive totals remain unverified end to end.**
- Ad removal, tracking blocking, notification filtering and price/stock alerts are unavailable. Browser/iOS modules are experimental.
- Launcher styling is unfinished. The emulator does not run Samsung One UI firmware.

See [latest verification](docs/qa/user-design-price-annotation.md), [raw Android results](docs/qa/price-annotation-instrumentation.log), [screenshots](docs/qa/ui-v2/) and [user design references](docs/design/user-approved/).

## Remaining before IceHacks submission

### Product blockers

- [ ] Install official Shopee and Lazada apps through Google Play. Sign-in is required; credentials must stay in the emulator.
- [ ] Prove at least one real supported retailer end to end: explicit opt-in, normal app launch, observed price, cancel mark, observed delivery/fee breakdown, native interaction and pause/removal. Record app version, region, supported screens and limits. Test the second retailer before claiming support.
- [ ] Validate delivery, taxes, mandatory fees, quantities, variants and conditional discounts against the original app. Reject ambiguous currencies, unrelated prices, stale bounds and incomplete fee information.
- [ ] Test the current annotation design against real-app scrolling, navigation, popups, rotation, rapid taps, permission revocation, service restart and pause/resume. Preserve login/payment screens. Older fixture stress results do not validate this retailer path.
- [ ] Finish visual/accessibility review against the supplied screens, including large text, scrolling and control states. Obtain phone home/drawer/frame references before further launcher styling; describe the emulator accurately.

### Release and submission

- [ ] Build a reproducible final APK; test a clean install and onboarding/permissions. Publish it with a hash and supported-device/app limits. Keep internal QA out of normal user flows. Verify a fresh clone builds.
- [ ] Update older status/architecture docs, feature matrix, screenshots, submission draft and storyboard to the current original-app annotation approach. Separate fixtures and unfinished platforms from demonstrated capabilities. Replace the existing outdated demo video.
- [ ] Record and publicly host a working video of **three minutes or less**: problem, control center, real retailer annotation, observed fee breakdown, native interaction, pause and tested limits. Verify its link while signed out.
- [ ] Complete Devpost: what it does, implementation, challenges, learning, impact and next steps; include repository/video links, technologies, team and applicable tracks.
- [ ] Credit third-party code/assets and disclose significant AI-generated contributions and tools. Verify asset rights, build-period eligibility, team registration and any required guardian permission. Audit public files for secrets and personal data.
- [ ] Verify every public link as a signed-out judge, submit on Devpost, and confirm submitted status before the deadline.

**Deadline: Monday, 16 November 2026, 10:00 AM Singapore time** (15 November, 6:00 PM PST), checked against the [official schedule](https://icehacks.devpost.com/details/dates) on 11 November. The [main submission page](https://icehacks.devpost.com/) requires a public video of at most three minutes; the [rules page](https://icehacks.devpost.com/rules) requires a public GitHub repository and differs on video wording. Prepare both to satisfy both pages.

## Run the desktop emulator view

Requires Node 20+, Android SDK/adb and a running emulator. Install dependencies and start these in separate terminals:

```sh
npm ci
npm run dev
npm run emulator
```

Open [the local preview](http://127.0.0.1:4173/). Streaming uses loopback port 4300. See [viewer setup](apps/emulator-viewer/README.md). This requires a running emulator and is not a publicly hosted demo.

## Build and test Android

With JDK 17+ and Android SDK platform 35:

```sh
cd apps/android
./gradlew :clearchoice:assembleDebug
```

Output: `~/.gradle/clearchoice-build/clearchoice/outputs/apk/debug/clearchoice-debug.apk`.
The [current debug APK](apps/android/ClearChoice-debug.apk) SHA-256 is `59cac52aa568655db98fc3d03fa504890451135baa9414246a4f38a3eb443b37`.

Run parser checks from the repository root:

```sh
apps/android/clearchoice/src/test/run-price-evidence-tests.sh
```

Android instrumentation requires controlled internal QA setup; see the verification report and [test source](apps/android/clearchoice/src/androidTest/java/com/clearchoice/PriceAnnotationInstrumentation.java). Its test-only activity has no launcher entry. Passing it does not establish retailer support.

## Other modules

`npm test` runs shared JavaScript checks; `npm run build` builds the extension and checks syntax. These do not verify Android retailer support. The optional [AI gateway](packages/README.md) requires explicit consent and separate configuration; deterministic price validation needs no paid AI calls. Never embed provider keys in distributed apps.

The [SwiftUI/Safari companion](apps/ios/ClearChoice.xcodeproj) is experimental and cannot modify arbitrary native iOS apps. Older evidence is indexed in [the test report](docs/test-report.md); the [submission draft](docs/competition-submission.md) still needs the updates listed above.
