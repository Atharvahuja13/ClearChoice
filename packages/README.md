# Shared contracts

Import `../packages/engine/src/index.js` (or package export `clearchoice/engine`) for deterministic contracts. The browser extension and demo should share these functions instead of inventing their own action mapping.

- `normalizePerception({sourceRevision, elements})` validates and freezes a bounded snapshot. Each element carries `id`, `type`, normalized visible `text`, `visible`, `enabled`, `clickable`, `scrollable`, `bounds`, and an allowlisted `actions` list. Form values are never retained. `checked`, `primary`, and `label` may be included as minimal signals.
- `RULES` lists the nine cue categories; results are indicators for user review, never factual fraud claims.
- `analyzePerception(snapshot)` runs only deterministic local heuristics. In particular a countdown is labeled **unverified**; its wording alone does not prove falsity.
- `validateSuggestions(snapshot, items)` binds every suggestion to the current revision and source ID, rejects action injection and price/currency changes, and only permits text annotations or text rewrites.
- `validateLayoutSpec(snapshot, layout)` permits only a reordering of product title, price, original action, and optional detail references. It cannot invent product content, prices, currencies, or actions.
- `validateBridgeAction(snapshot, request, {usedActionIds})` checks revision, action allowlist, source availability and exactly-once IDs. It blocks form controls and sensitive flows. Callers must observe the page again after an action and call `verifyObservedResult` before reporting success.
- `createProfile` and `resolveProfile` support global, per-app and per-screen settings. More specific screen settings override app settings, which override global settings. Keep safety restrictions outside these user-tunable preferences.

## Demo integration

Build the Chrome MV3 extension with `npm run extension:build`, then load `apps/browser-extension` unpacked. The content script requests explicit origin permission, observes DOM changes, and offers a scrollable reconstructed product list on supported demo pages. Every product name and price references source IDs. Details open the original demo control; Add calls the original store button only on a user click, validates the mapping/revision, then verifies the cart count increased exactly once. It never retries a failed or stale action. On controlled shopping pages expose stable product IDs, prices, currency, action IDs and cart count as `data-cc-product`, `data-cc-price`, `data-cc-currency`, `data-cc-action`, and `data-cc-cart-count`. Keep login, payment, security, and account forms in the original page.

`npm run dev` serves the control center at `http://127.0.0.1:4173/` and the demo at `/demo/`.

## AI gateway

Run `npm run gateway` (default local Ollama: `qwen3:4b-instruct` at `127.0.0.1:11434`; override with server-side `AI_PROVIDER_*` settings). A request to `POST /v1/evaluate` must include `{perception, aiConsent:true}` to use a model; `cloudConsent:true` remains accepted for API compatibility. Without explicit consent it returns local findings only. Provider calls are time-limited, IP rate-limited and cached by a bounded, expiring hash of the normalized snapshot; no API key or request content is logged. The default mode binds the gateway to loopback and permits only configured UI origins. Do not send raw form values, credentials, payment information or security codes.

## Source evidence review (native and noncatalog screens)

Send `POST /v1/evaluate` with `{requestKind:"review", aiConsent:true, perception:{sourceRevision,elements}}`. This mode returns `layout:null` and `suggestions` containing only `kind:"annotation"`; it never returns executable actions or text rewrites. Without AI consent, or when a provider is unavailable, deterministic local review still works and is labelled `local-review`. A clean screen may return empty arrays; that is not a generated redesign.

`findings` retain exact source evidence, source ID/revision, an `observation`, a `rationale`, and `verification` (`observed` or `unverified`). A selected optional add-on's checked state is observed; who selected it is unknown. Inventory/deadline claims and unspecified charge conditions remain unverified. `createReviewAnnotations(snapshot)` produces the compatible annotation records (`id`, `sourceId`, `sourceRevision`, `ruleId`, `kind`, `text`). Native clients can emphasize those source IDs and display the rationale alongside original content. Checked state is supported even when the native snapshot does not use the HTML checkbox type.

With consent, the configured model corroborates the candidate source/rule/evidence records. Model-facing IDs are aliases, revisions are hashed, and text is sanitized. Every returned record must match one current candidate exactly, including evidence and verification. Missing, duplicate, stale, unknown, invented or extra fields fail validation. User-facing wording is generated deterministically from validated source evidence; model output cannot author product facts, prices, terms or actions. `local-ai-review` means this corroboration succeeded, not that stock or commercial claims were independently verified. Android callers should send the explicit `requestKind:"review"` and accept `layout:null`; existing source-ID suggestion validation remains compatible.

Catalog callers continue using the default layout request (or `requestKind:"layout"`). A catalog model response must contain a complete non-null validated layout preserving every product exactly once.
