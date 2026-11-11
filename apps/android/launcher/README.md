# ClearChoice Home

A native Android HOME launcher, package `com.clearchoice.launcher`. This is an independent app using real Android navigation and installed-app intents; it does not replace Android firmware or claim Samsung One UI certification.

The manifest declares HOME/DEFAULT and LAUNCHER entry points. Package visibility is scoped to MAIN/LAUNCHER activities. There are no runtime permissions and no QUERY_ALL_PACKAGES access. Apps and icons come from PackageManager, sorted by actual labels; a package-change receiver refreshes the list. Home shortcuts favor installed ClearChoice, Play Store, shopping, Photos, Settings, Gmail and YouTube apps; unavailable apps are replaced with installed launchable apps. The dock uses actual installed Phone, Messages, Chrome and Camera apps.

Swipe up opens the app drawer; swipe down from its top or Back closes it. Search filters real installed apps, Enter launches a match, and otherwise offers Android web search via an installed search handler. Long-press opens Android's app details. Drawer options open Android settings/default-home settings. Time/date are dynamic and use device locale/time format. Weather displays “Tap to set up”; choosing an installed app saves only its component name and opens it. No weather data is fabricated.

The root Android settings already include `:launcher`. Build with JDK21, Android SDK35 and `./gradlew :launcher:assembleDebug`. Build output follows the existing root convention: `~/.gradle/clearchoice-build/launcher/outputs/apk/debug/launcher-debug.apk`.

Installation and default-home selection are intentionally left for coordinated emulator QA. No device changes are made by the module build. Real system bars, keyboard, Back/Home/Recents and edge navigation remain owned by Android.

Visual redesign is paused pending the user’s phone reference images. No reference screenshot is used as an interactive screen.

Build checkpoint (11 November 2026): `:launcher:assembleDebug` succeeded, 31 tasks executed. Build used `JAVA_HOME=/tmp/clearchoice-jdk21/Contents/Home` (official Temurin21); the installed Android Studio runtime is Java25 and cannot run this Gradle8.10.2 project. The external init script is `/tmp/clearchoice-launcher-init.gradle`; it includes only this module without modifying root settings.gradle. APK SHA256 at this checkpoint: `f4464886f84d4d6e9ca5511231e6c38c172bdfdf77323cd3dec8d50a5c81d1ad`. No emulator install, default-launcher change, or runtime visual verification has been performed. Visual matching remains paused pending user-provided phone references.

Internal fixture packages `com.clearchoice.demoshop` and `com.demoshop` are excluded from discovery, home shortcuts, drawer and weather-app selection. Shopee/Lazada shortcuts resolve only to actual installed launchable apps; no fixture is presented as a retailer.
