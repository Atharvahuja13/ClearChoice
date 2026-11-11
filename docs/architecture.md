# ClearChoice architecture

## Product boundaries

- `apps/control-center/` is the local-first web control center. On desktop, the application is presented inside a responsive Samsung Galaxy S26 Ultra frame; narrow displays use the app edge-to-edge. Dashboard state is stored under `cc-state-v1` in the current origin's `localStorage`.
- `demo/` is a controlled, fixture-backed sample shop. It has 12 products, details and variant selectors, a shared local cart, sample coupon choices, and sample history/seller totals. Cart actions update the source store and are never sent to a payment service.
- `apps/browser-extension/src/browser-adapter.js` is the shared source-mapped reconstruction adapter. The demo's consented session imports that adapter, which snapshots current product titles, prices and original buttons, validates references, and rechecks the original cart count after an explicitly selected reconstructed Add action. Its Close action and the original page controls remain available.
- `packages/engine/src/` owns the source snapshot, layout and action validation contracts. The extension adapter excludes sensitive inputs and refuses stale or protected pages.
- `services/ai-gateway/src/server.js` is a separate optional server process. The control center sends a product-only fixture snapshot only after the user opts into AI analysis. The gateway sanitizes and validates suggestions before returning a layout. A user must apply a returned layout explicitly.
- `apps/ios/` contains the SwiftUI companion and a Safari Web Extension target. iOS runtime web access remains subject to Safari's per-site controls.

## Data flow

1. The control center stores profiles and app preferences in local browser storage. It does not require an account.
2. Shopping Mode routes into `/demo/` in the same framed device.
3. The adapter maps its reconstructed cards to `data-cc-product`, `data-cc-price`, `data-cc-currency`, `data-cc-action`, and `data-cc-cart-count` sources.
4. A user-selected Add calls the mapped original store action once. The adapter compares the original source count before and after. Activity is labelled verified only when the source count increases exactly once.
5. The optional AI path sends a sanitized fixture-only schema to the configured gateway. It does not send authentication, payment, form, or account fields. It does not submit purchase actions.

## Local preview

Run `npm run dev` from the repository root. The control center opens at `http://127.0.0.1:4173/`; the standalone demo is at `/demo/`. Configure the optional gateway separately with `npm run gateway` and the provider settings documented in `packages/README.md`.
