# Roadmap

## Before a public demo

1. Run the Playwright E2E suite on a supported Node installation and attach retained screenshots of the home, reconstructed shop, and verified cart states.
2. Start the optional local Ollama gateway, test the explicit consent path, and retain a real validated response. Keep the deterministic local fallback visibly distinct.
3. Exercise the iOS app and Safari extension on a simulator/device, including iOS's per-site access flow and the localhost demo page.
4. Complete the Android app and permission matrix with the Android owner. Keep unsupported cross-app claims out of public copy.
5. Review reducer/adapter behavior against the browser engine's latest stale-revision and idempotency tests.

## Later

- Add a verified retailer integration only after its supported APIs and platform permissions are documented and tested.
- Add encrypted sync only after account, retention, export, and deletion behavior are specified.
- Add cloud AI only as a separately named, explicitly consented provider option. Do not place provider credentials in the browser or mobile bundle.
- Add international currencies and region-specific seller fee fixtures, clearly labelling the source.

## Competition handoff draft

A compact demo can show the S26 Ultra control center, choose a reading preset, enter the 12-item fixture shop, compare a fixture price, open the reconstructed panel, select a product action, and verify the original cart count. It should finish with the source activity entry and the privacy/capability page. Keep the recording under 180 seconds. State clearly that retailer-native support, live retailer feeds, and iOS Safari behavior have not been verified. This is a draft storyboard only; nothing has been submitted externally.
