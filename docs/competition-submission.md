# ClearChoice — shopping with the controls still in your hands

## Fit to IceHacks judging criteria

IceHacks lists five equally weighted criteria: Technical Execution, Creativity & Originality, Impact & Usefulness, Design & User Experience, and Presentation ([official IceHacks page](https://icehacks.devpost.com/)). The sections below address each criterion with the prototype's demonstrated evidence and explicit scope.

## The problem

Shopping interfaces bury details people need to compare products: prices, sellers, variants, and the next action. Simplifying a page only helps when facts remain trustworthy and shoppers keep control of the original purchase flow.

## What ClearChoice does

ClearChoice reconstructs a supported product view from the page’s observed interface, then maps each title, price, and action back to its source element. Shoppers can change presentation and inspect sample insights while the retailer’s own variant picker, cart, and protected checkout remain in control. A source-state check confirms whether Add changed the cart once. If mapping or verification fails, the original page remains available.

The desktop preview makes the before and after visible in the same Samsung Galaxy S26 Ultra frame: original store, reconstructed panel, then the original cart reflecting one verified action. Fixture prices and seller data are labeled clearly.

## Evidence

The controlled Android DemoShop flow exercised native cross-app behavior: open a product, choose Medium and Sage in the source pickers, add the item, observe Cart (1), and reach protected demo checkout. Instrumentation passed; the same flow then completed 100 cycles over 1,816.48 seconds with no recorded failure. Nine control-center browser tests passed, alongside extension and gateway checks recorded in the verification report.

These results establish the controlled demo loop. They do not establish compatibility with live retailer apps or sites. Fixture insights are illustrative, checkout is protected, and no purchase is submitted. Accessibility controls adjust presentation and offer a side-by-side preview. Preferences and activity stay on device. Local AI is opt-in and requires consent plus a configured gateway.

## Demo storyboard (about 165 seconds)

- **0:00–0:20 — Set the promise.** Show the desktop phone frame and original DemoShop. State that retailer support is unverified and product facts are fixtures.
- **0:20–0:45 — Before and after.** Open ClearChoice mode. Compare the original product list with the reconstructed panel. Point out that titles and prices map to source elements.
- **0:45–1:15 — Prove the action.** Open a product, choose Medium and Sage in the original controls, add it, and show the source cart count move to one. Explain the source-state check.
- **1:15–1:40 — Show the native loop.** Show Android DemoShop evidence of the same open → variant → Add → Cart → protected checkout flow. Cite the 100-cycle run.
- **1:40–2:10 — Make it personal.** Return to the desktop frame, adjust accessibility and spacing in Studio, and show the before/after preview. Show history and seller totals labeled as sample data.
- **2:10–2:45 — Close with control.** Show privacy and consent settings. State the limits plainly: no live retailer integration verified, no payment submitted, and AI ranking intent is not guaranteed.

## AI use and limits

AI assistance is optional and runs through a configured gateway after explicit consent. The returned layout is checked against current source products and source element IDs before it can be applied. One live local result preserved source IDs, prices, and currencies, but did not follow the requested lowest-price-first ordering. ClearChoice does not claim perfect intent-following.

This is a preparation draft, not submitted to Devpost or another external service. The event requires a public video of three minutes or less showing working software; the local narration and editing plan is in [docs/demo/narration.md](demo/narration.md).
