# User design and price annotation verification

Verified on 11 November 2026, emulator-5554 (Android API 37).

## Implemented and inspected

Native Manage Apps, per-app settings, Features, Activity, Permissions/privacy,
and Settings use the user-supplied navy/light design references. Navigation,
permission status, installed-app status and history reflect actual device data.
Screenshots are saved in `ui-v2/user-*-final.png`.

The retailer annotation path preserves the source app. It draws a pass-through
cancel mark at observed price bounds, plus a bounded dismissible breakdown label.
Only explicitly opted-in supported packages are considered. Incomplete fee data
is labelled incomplete. The annotation does not change a merchant's charge.

## Evidence

- 17 price-evidence parser tests passed (independently rerun by coordinator).
- 16 Android source-to-annotation instrumentation checks passed; raw output is
  `price-annotation-instrumentation.log`, instrumentation code 0.
- Android checks used a test-only accessible native price source, observed its
  bounds, tapped its real native control through the mark, observed changed price
  evidence, and checked scrolling, pause, and own-window event handling.
- Final combined APK SHA-256:
  `59cac52aa568655db98fc3d03fa504890451135baa9414246a4f38a3eb443b37`.
- The distributed APK and Gradle output hashes match.
- The live desktop H264 stream health endpoint reports ready without errors.
- Accessibility was restored to its preceding disabled state after testing.

## Remaining limits

Shopee and Lazada are not installed on this emulator. Their compatibility and
actual delivery-inclusive totals have not been verified end to end. The passing
internal Android test is not retailer compatibility evidence. Unsupported ad
removal, network tracking blocking, notification filtering and price alerts are
not advertised as functioning capabilities.

No user phone-home, drawer or exterior references have been supplied yet.
Speculative launcher visual work remains paused; the current emulator does not
run Samsung One UI firmware. There is no consumer Demo Shop or Shopping Mode.
