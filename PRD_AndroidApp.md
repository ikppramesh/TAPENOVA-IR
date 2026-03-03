# PRD: TAPENOVA-IR Android App

## Overview
Build a native Android application that wraps the existing TAPENOVA-IR web player and
provides a home-screen widget. The app should deliver the same playback experience
as the web version while taking advantage of native capabilities (background
playback, notification controls, widget, offline caching).

## Goals
- Offer an Android package that users can install from APK or app stores.
- Reuse as much of the web player code as possible via a WebView or Trusted Web
  Activity (TWA).
- Provide a home-screen widget replicating core transport controls and visual
  feedback (reels, sound waves, track info).
- Support offline caching, theming, and playlist management identical to the
  PWA.

## Success Metrics
- The app installs and launches within 10s on a typical Android device.
- Playback quality is indistinguishable from the web player (no latency,
  correct tonearm, visualization active).
- Users can add the widget to their home screen and control playback from it.
- Offline playback works for previously opened tracks.

## Features
### Core Player
- WebView/TWA hosting `/index.html` from local assets or remote URL.
- File picker integration using Android storage APIs; the web player file input
  should be wired to system chooser via `addJavascriptInterface` or equivalent.
- Volume, play/pause, stop, prev/next controls; sync state between native and
  web layers.
- Notification with media controls and lock-screen metadata.

### Widget
- 4x2 widget showing current track title, artist, album art (or default logo).
- Buttons: play/pause, stop, next (optional prev).
- Rolling reels animation or simplified waveform.
- Tapping widget opens the main app.
- Widget updates driven by `AppWidgetProvider` and a background service which
  communicates with the WebView (via broadcast or `Service`) or reads shared
  preferences/state.

### Offline & Caching
- Use service worker or WorkManager to cache assets.
- Allow offline playback of previously loaded audio files.

### Settings
- Light/dark theme toggle persisted.
- Option to disable animations for low-power mode.

## Non-Goals
- Reimplementing the entire player in native views.
- Cross-platform support (iOS will be handled separately).

## Technical Approach
1. **Project Setup**: Create Android Studio project, add `WebView` activity
   or use [Android TWA support library](https://developer.android.com/guide/overview/architecture/webview).
2. **Asset bundling**: Copy web player files into `assets/` or serve from remote
   CDN.
3. **JavaScript bridge**: Expose methods to control playback; handle file
   selection via `Intent` and feed blob URLs to the WebView.
4. **Widget implementation**: Create `AppWidgetProvider`, layout with image and
   buttons, update via `Service` every second or on playback events using
   `MediaSession` callbacks.
5. **Permissions**: Request `READ_EXTERNAL_STORAGE` (or use Storage Access
   Framework) for file import.
6. **Testing**: Emulator & physical devices, verify PWA parity.

## Timeline & Milestones
- Week 1: Prototype WebView app with basic controls and file loading.
- Week 2: Add widget and integrate media session.
- Week 3: Polish UI, add caching/offline, prepare release build.

## Risks
- Communication between widget and WebView may be complex; may require a
  lightweight native audio backend if continuous sync proves unreliable.
- Android version fragmentation (API 21+ support required).

## KPIs
- Number of installs of Android APK.
- Widget active rate (% of users who add widget).
- Crash-free session rate >98%.

---
