# Feature matrix (57 blueprint slots)

The source handoff supplied the exact A and B feature names and the C–F item counts (C 10, D 10, E 9, F 8), but the detailed C–F names were collapsed out. A/B below preserve the supplied wording. C–F are clearly marked as implementation-scope interpretations, not recovered blueprint wording.

**Status labels:** **Implemented** = a usable path exists in code; **Partial** = a constrained/demo-only path or unverified runtime; **Missing** = no user-facing implementation. `Browser checked` describes behavior directly exercised in the local browser. **Not independently verified** means code exists but the relevant host/app/runtime was not exercised.

## A · Core UI transformation (11; supplied names)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| A1 | Automatic app recognition | Missing for retailer apps; demo routing is explicit | `apps/control-center/app.js` |
| A2 | Real-time interface understanding | Partial: controlled demo source snapshot only | `apps/browser-extension/src/browser-adapter.js`, `demo/adapter.js` |
| A3 | Manipulative design detection | Partial: nine deterministic engine cues exist; not yet presented as an in-app review panel | `packages/engine/src/index.js` |
| A4 | AI-generated alternative layouts | Partial: coordinator verified live local-ai Minimal layout for two products with original IDs/prices/currencies; lowest-price-first intent was not followed; browser integration remains separately scoped | `apps/control-center/app.js`, `services/ai-gateway/src/server.js` |
| A5 | Interactive full-screen overlay | Implemented: reconstructed demo product panel; browser checked | `apps/browser-extension/src/browser-adapter.js` |
| A6 | Scrolling/navigation mapping | Partial: product panel scroll and original Details action; arbitrary page scrolling is not represented | `apps/browser-extension/src/browser-adapter.js` |
| A7 | Real button/selection mapping | Implemented for demo Details/Add; original variant selector stays in source; browser checked | `apps/browser-extension/src/browser-adapter.js`, `demo/store.js` |
| A8 | State sync/verification | Implemented for demo cart count; exact +1 observed; browser checked | `apps/browser-extension/src/browser-adapter.js`, `apps/control-center/app.js` |
| A9 | Instant pause/restore | Implemented for demo activation and original-action fallback; browser checked | `demo/adapter.js`, `apps/control-center/app.js` |
| A10 | App-specific compatibility profiles | Partial: local scopes/profile controls; retailer activation is unsupported | `apps/control-center/app.js` |
| A11 | Dynamic reflow/orientation | Implemented in CSS breakpoints; browser checked at desktop phone-frame layout | `apps/control-center/style.css` |

## B · Control center (9; supplied names)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| B1 | Premium Home | Implemented; browser checked | `apps/control-center/index.html`, `apps/control-center/style.css` |
| B2 | Active/paused | Implemented locally; retailer sessions are never inferred | `apps/control-center/app.js` |
| B3 | Supported app library/add | Partial: app discovery and saved site preferences only; no retailer is activated | `apps/control-center/app.js` |
| B4 | Per-app enable | Partial: saves a preference; supported execution exists only for ClearChoice Demo | `apps/control-center/app.js`, `demo/adapter.js` |
| B5 | Permission setup/diagnostics | Partial: explicit capability/permission guidance and local diagnostics preference; no telemetry upload | `apps/control-center/app.js`, `apps/ios/ClearChoice/App.swift` |
| B6 | Activity | Implemented: local events, source verification label, clear action | `apps/control-center/app.js` |
| B7 | Before/after | Implemented in Studio as baseline/current preview; browser checked | `apps/control-center/app.js`, `apps/control-center/style.css` |
| B8 | Global/per-app preferences | Implemented as Global, Demo, Product page, Cart local scopes | `apps/control-center/app.js` |
| B9 | Profiles/import/export | Implemented locally with bounded import validation; browser checked save/compare | `apps/control-center/app.js` |

## C · Studio (10; interpreted names because the source sublist was collapsed)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| C1 | Balanced preset | Implemented | `apps/control-center/app.js` |
| C2 | Minimal preset | Implemented | `apps/control-center/app.js` |
| C3 | Accessible preset | Implemented | `apps/control-center/app.js` |
| C4 | Custom preset | Implemented | `apps/control-center/app.js` |
| C5 | Prompt-to-token adjustment | Implemented for a bounded phrase set; not free-form AI | `apps/control-center/app.js` |
| C6 | Simplification control | Partial: changes live preview presentation | `apps/control-center/app.js` |
| C7 | Accessibility/font/contrast controls | Implemented in live preview | `apps/control-center/app.js` |
| C8 | Spacing/density/shape/action controls | Implemented in live preview; source purchase controls remain available | `apps/control-center/app.js` |
| C9 | Scope selection | Implemented for Global/Demo/Product/Cart preference storage | `apps/control-center/app.js` |
| C10 | Reset/apply/save/compare/import/export | Implemented locally; browser checked prompt/save/compare | `apps/control-center/app.js` |

## D · Shopping fairness and insights (10; interpreted names)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| D1 | Clear product names/prices | Implemented with source references in demo | `demo/store.js`, `demo/adapter.js` |
| D2 | Product details and variants | Implemented in original demo source; browser checked | `demo/store.js` |
| D3 | Search and sorting | Implemented | `demo/store.js` |
| D4 | Fixture price history | Implemented and labelled; browser checked | `demo/adapter.js` |
| D5 | Fixture seller totals | Implemented and labelled | `demo/adapter.js` |
| D6 | Shipping visibility | Fixture-only disclosure | `demo/store.js`, `demo/adapter.js` |
| D7 | Smart picks | Implemented from fixture savings; not a live-market ranking | `demo/adapter.js` |
| D8 | Coupon suggestions | Implemented as an optional fixture; user must choose Apply | `demo/adapter.js` |
| D9 | Shared original cart state | Implemented with quantity controls and one-change verification | `demo/store.js`, `apps/browser-extension/src/browser-adapter.js` |
| D10 | Retailer feeds/taxes/merchant totals | Missing | — |

## E · Safety and privacy (9; interpreted names)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| E1 | Preserve original prices | Implemented for the demo adapter | `apps/browser-extension/src/browser-adapter.js` |
| E2 | Preserve original purchase actions | Implemented for the demo adapter | `apps/browser-extension/src/browser-adapter.js` |
| E3 | Reject stale source mappings | Implemented in shared adapter contracts | `packages/engine/src/index.js` |
| E4 | Idempotent/single action handling | Implemented in shared adapter contracts | `packages/engine/src/index.js`, `apps/browser-extension/src/browser-adapter.js` |
| E5 | Verify observed source result | Implemented for exact demo cart-count increase | `apps/browser-extension/src/browser-adapter.js` |
| E6 | Keep protected forms in original source | Implemented by adapter/gateway guards | `apps/browser-extension/src/browser-adapter.js`, `packages/engine/src/index.js` |
| E7 | Local-first storage/account-free start | Implemented in web/iOS prototypes | `apps/control-center/app.js`, `apps/ios/ClearChoice/App.swift` |
| E8 | Consent/history/diagnostics controls | Implemented locally; diagnostics are not uploaded | `apps/control-center/app.js` |
| E9 | Safe AI key handling and validation | Server-side key design and layout validation implemented; runtime not verified here | `services/ai-gateway/src/server.js` |

## F · Platform and delivery (8; interpreted names)

| # | Feature | Status | Evidence |
|---:|---|---|---|
| F1 | Browser extension packaging | Partial; source-owned adapter is integrated in demo; retailer permissions unverified | `apps/browser-extension/` |
| F2 | SwiftUI companion | Partial; simulator build succeeds | `apps/ios/ClearChoice/App.swift` |
| F3 | Safari extension target | Partial; localhost demo-only marker, not device tested | `apps/ios/ClearChoiceSafari/` |
| F4 | Android companion | Implemented and verified for controlled DemoShop: native overlay, Medium/Sage variants, source Add, exact cart count, protected checkout; 100 complete cycles over 1,816.48 seconds, zero failures. Retailer apps remain unverified | `apps/android/ANDROID-STATUS.md`, `apps/android/qa/instrumentation.log`, `apps/android/qa/stress-result.json` |
| F5 | Platform permission guidance | Partial; web and iOS guidance included | `docs/permissions-and-capabilities.md` |
| F6 | Retailer compatibility integrations | Missing/unverified | — |
| F7 | Secure sync/account backend | Missing; Cloud sync is labelled not configured | `apps/control-center/app.js` |
| F8 | Submission story and limitations | Implemented as a draft only; not externally submitted | `docs/competition-submission.md`, `docs/roadmap.md` |
