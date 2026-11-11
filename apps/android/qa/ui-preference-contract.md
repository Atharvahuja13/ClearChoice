# Native control center preference contract

All live service preferences are in SharedPreferences `cc`.

- `allow:<package>` boolean, default false: explicit user opt-in. Manage Apps and App settings use the same key. It does not establish source compatibility or a successful annotation.
- `selected_apps` string set: packages explicitly selected with Android's launchable-app picker and confirmed by the user. Shopee/Lazada remain installation entries regardless of this set. No fixture entries are exposed.
- `paused` boolean: existing service pause contract. Updates broadcast `com.clearchoice.PAUSE_CHANGED` to this package.
- `ai_enabled` boolean, default false: existing optional sanitized gateway consent.
- `eventlog`: existing local Engine activity records. The UI derives counts/timestamps from actual records, labels historical QA scope, and never invents blocked/cleaned statistics.

Installed opted-in apps are labeled Enabled / awaiting compatible price. The original app remains visible when annotations are unsupported. No ad removal, tracking blocking, notification filtering, or sustainability claims are activated by the UI.

App discovery uses a scoped MAIN/LAUNCHER manifest query plus Android ACTION_PICK_ACTIVITY, followed by explicit per-app opt-in. Permissions UI requests neither storage nor usage access. Accessibility annotation overlays do not need SYSTEM_ALERT_WINDOW; the unused manifest permission is removed.

Build runtime: existing JDK17 at ~/.gradle/jdks/eclipse_adoptium-17-aarch64-os_x.2/jdk-17.0.20.1+1/Contents/Home. No new JDK download.
