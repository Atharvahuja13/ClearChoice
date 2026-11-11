# User-supplied design references

These five screens supersede the generated v2 visual direction.

- `01-manage-apps.png`: navy header, service card, light app-management panel.
- `02-app-settings.png`: per-app grouped controls and preference rows.
- `03-features.png`: feature groups and capability controls.
- `04-activity.png`: summary cards, category filters and chronological records.
- `05-permissions.png`: actual permission status and privacy controls.

Use consistent navigation across screens: Manage Apps, Features, Activity,
Permissions, Settings. Per-app settings is a destination from Manage Apps.
The screenshots contain illustrative retailer lists, counts, dates, permission
grants and feature claims. Runtime values must come from actual device state.
Unsupported capabilities must not be described as enabled or successful.

## Latest overlay requirement

Keep the original third-party shopping app visible and interactive. Annotate an
unambiguous observed price with a distinctive ClearChoice cancel stroke and a
nearby itemized price including observed delivery and mandatory fees. Preserve
the original price's legibility. Missing fees must be labelled unknown; a partial
sum must never be described as the final payable amount. Do not replace the
storefront, invent merchant data, or change the merchant's real prices.

Remove annotations when source data, bounds or the foreground app changes, or
when paused, permission is lost, or a sensitive screen appears. Demo Shop is an
internal test fixture only and must not appear in consumer app choices or the
launcher. Real-retailer compatibility requires independent end-to-end evidence.

Phone frame/home/drawer references have not yet been supplied by the user.
Speculative launcher visual work remains paused.
