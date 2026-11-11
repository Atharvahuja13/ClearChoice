# Permissions and supported capabilities

| Environment | What works | Required permission | Current status |
|---|---|---|---|
| Web control center | Dashboard, per-app preference selection, modes, profiles, Studio, activity, local settings | No account or browser permission | Implemented locally |
| ClearChoice Demo | Product discovery, detail/variant views, source cart actions, fixture insights, reconstructed panel | No additional permission | Implemented and browser checked |
| Other retailer web pages | The generic adapter has stable source contracts, but this control center does not enable retailer access | An installed browser extension and explicit site access would be needed | Not verified / not activated here |
| AI Buying Assistant | Product-only analysis through a configured gateway; explicit consent and explicit apply step | Optional local or server-side provider | UI and guarded request path included; runtime provider availability depends on gateway |
| iOS app | SwiftUI dashboard, local preferences, sample shop, Studio, activity and Safari settings guidance | No cross-app access | Simulator build succeeds |
| Android companion | Native dashboard and separate Demo Shop APK; accessibility overlay is allow-listed to `com.demoshop` | User must enable the named Android Accessibility Service in Settings | APKs build; runtime verification is incomplete; see [Android status](../apps/android/ANDROID-STATUS.md) |
| iOS Safari extension | Demo-only marker on localhost/127.0.0.1 pages | User enables extension and grants site access in iOS Settings/Safari | Target compiles; on-device Safari behavior has not been verified |
| Native retailer apps | No universal overlay or cross-app injection | Would require platform- and retailer-supported integration | Unsupported / not claimed |

The Android prototype targets its bundled Demo Shop only; user-granted accessibility access and end-to-end behavior have not been verified. See the [Android runtime status](../apps/android/ANDROID-STATUS.md).

The web demo preserves the store's original prices and purchase controls. The transformed panel reads current source titles, prices, detail controls and add buttons. It makes no claim to be active in a retailer's native app.

AI analysis defaults off. The browser stores the endpoint URL but never an API key. The included default is a local gateway URL; a missing gateway produces a visible error, not fabricated advice. When the user opts in, the control center sends a product-only sample snapshot to the configured endpoint. Provider credentials belong on the gateway server.
