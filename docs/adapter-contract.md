# Demo and adapter contract

The fixture store exposes stable, source-owned identifiers:

- `data-cc-product`: stable product identifier.
- `data-cc-price` and `data-cc-currency`: current displayed product price and currency.
- `data-cc-action="add-to-cart"`: the original add action.
- `data-cc-cart-count`: the original store's observed cart quantity.
- `data-cc-seller`, `data-cc-history`, `data-cc-shipping`: explicitly illustrative fixture inputs for the demo-only insight panel.

Details and variant selectors stay in the source page. The reconstructed adapter can open those source details and invokes the source Add control only after a user click. It checks that the source mapping is current and that the cart count rises by exactly one. It does not retry a failed or stale action. Do not map account, login, payment, card, password, OTP, or security controls.

Price history, shipping, seller totals and the `DEMO10` sample coupon are clearly labelled as demo fixtures. Coupon application is a separate user choice and affects only the demo cart's displayed total. No real retailer feed or checkout is connected.
