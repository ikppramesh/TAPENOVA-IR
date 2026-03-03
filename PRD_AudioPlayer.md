# Audio Player PRD - Echo Mini Clone

**Project:** TapeNova x IR  
**Author:** Ramesh Inampudi  
**Date:** 25 Feb 2026

---

## 🎯 Goal
Build a lightweight audio player inspired by the *Snowsky Echo Mini* that offers a clean, minimal UI and gives users detailed information about each track’s sampling rate, bit depth, and bitrate. Add a retro cassette motif where a virtual cassette spins as the song plays, with tape visibly rolling from one side to the other.

---

## 🧩 Key Features

1. **Core Playback**
   - Play/pause, stop, next/previous track controls.
   - Support for common audio formats: MP3, WAV, FLAC, AAC.
   - “Now playing” display with artist/title/album.
   - Seek bar with current time / duration.

2. **Audio Information Display**
   - Show **sample rate** (kHz) of the current track.
   - Show **bit depth** (bits per sample).
   - Show **bitrate** (kbps) for compressed formats.
   - Dynamically update when the track changes.

3. **UI/UX Design**
   - **Minimalist layout** modeled after Snowsky Echo Mini:
     - Central play/pause button, small next/prev icons.
     - Dark or light theme toggle (optional).
     - Compact “mini player” mode.
   - **Retro cassette skin:**
     - The main window looks like a vintage cassette tape.  
     - While playing, the cassette reels rotate; the tape appears to roll from left spool to right spool (or vice versa depending on playback direction).
     - When paused/stopped, the reels freeze.
   - Drag‑and‑drop support and file dialog.
   - Responsive scaling for desktop/mobile screens.

4. **Playlist Management**
   - Simple queue: add/remove, reorder.
   - Save/load playlist files (M3U, PLS).

5. **Settings & Preferences**
   - Toggle detailed audio info display.
   - Choose default audio output device.
   - Remember last‑played position per track.

6. **Diagnostics / Validation**
   - Users verify output parameters (kHz, bit, kbps) during playback.
   - Optionally log these details to a text file.

7. **Performance & Compatibility**
   - Fast startup (<1 s).
   - Low CPU/memory footprint.
   - Compatible with macOS (and optionally Windows/Linux).

---

## 🛠️ Technical Considerations

- **Audio engine:** Use a cross‑platform library (e.g., SDL, PortAudio, or native frameworks).
- **Metadata parsing:** Leverage tag libraries (e.g., TagLib) to read sampling rate/bit depth/bitrate.
- **UI framework:** Electron/Qt/SwiftUI/Flutter depending on target platforms.
- **Cassette animation:** Use CSS/Canvas animation or native graphics to rotate the reels and animate tape movement.
- **Testing:** Unit tests for playback logic; manual QA for UI and animations.

---

## ✅ Success Criteria

- User can load and play any supported audio file.
- The UI mirrors the look & feel of Echo Mini with a retro cassette skin.
- Cassette reels rotate and tape rolls correctly during playback.
- Audio properties (kHz, bit, kbps) are visible and accurate for every song.
- No crashes with large playlists; resource usage remains low.

---

> **Next Steps:**  
> • Map out UI mockups (mini‑player, retro cassette)  
> • Prototype playback + animated cassette  
> • Define milestones for playlist, settings, and testing
