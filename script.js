// ── DOM references ─────────────────────────────────────────────────────────
const fileInput       = document.getElementById('fileInput');
const audio           = document.getElementById('audioElement');
const playPauseBtn    = document.getElementById('playPause');
const stopBtn         = document.getElementById('stop');
const prevBtn         = document.getElementById('prev');   // declared here, not below
const nextBtn         = document.getElementById('next');
const seekBar         = document.getElementById('seekBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan    = document.getElementById('duration');
const sampleRateSpan  = document.getElementById('sampleRate');
const bitDepthSpan    = document.getElementById('bitDepth');
const bitrateSpan     = document.getElementById('bitrate');
const reelLeft        = document.querySelector('.reel-left');
const reelRight       = document.querySelector('.reel-right');
const reelLeftTape    = document.querySelector('.reel-left  .reel-tape');
const reelRightTape   = document.querySelector('.reel-right .reel-tape');
const tapeStrand      = document.querySelector('.tape-strand');

// Vynx spinner element (present only on the alternate page)
const vpSpinner       = document.getElementById('vpSpinner');

const trackTitleEl    = document.getElementById('trackTitle');
const sticker         = document.getElementById('sticker');
const albumArtImg     = document.getElementById('albumArt');
const artTitle        = document.getElementById('artTitle');
const trackNameEl     = document.getElementById('trackName');
const trackMetaEl     = document.getElementById('trackMeta');
const playlistEl      = document.getElementById('playlist');
const queueCountEl    = document.getElementById('queueCount');
const playerContainer = document.querySelector('.player-container');
const cassetteEl      = document.querySelector('.cassette');
const compartmentLid  = document.getElementById('compartmentLid');
const wbLed           = document.getElementById('wbLed');

// ── View switcher refs ──────────────────────────────────────────────────────
const viewCassette      = document.getElementById('viewCassette');
const viewVinyl         = document.getElementById('viewVinyl');
const tabCassette       = document.getElementById('tabCassette');
const tabVinyl          = document.getElementById('tabVinyl');
const vinylDisc         = document.getElementById('vinylDisc');
const tonearmEl         = document.getElementById('tonearmEl');
const tonearmStylus     = document.querySelector('.tonearm-stylus');
const tonearmLiftGroup  = document.getElementById('tonearmLiftGroup');
const tonearmBaseEl     = document.querySelector('.tonearm-base');
const cueLeverMount     = document.querySelector('.cue-lever-mount');
const vinylMotorLed     = document.getElementById('vinylMotorLed');
const speed33Btn        = document.getElementById('speed33');
const speed45Btn        = document.getElementById('speed45');
const vinylArtImg       = document.getElementById('vinylArtImg');
const vinylLabelDefault = document.getElementById('vinylLabelDefault');
const orb1El          = document.getElementById('orb1');
const orb2El          = document.getElementById('orb2');
const orb3El          = document.getElementById('orb3');
const ytUrlInput      = document.getElementById('ytUrlInput');
const ytLoadBtn       = document.getElementById('ytLoadBtn');

// ── Theme toggle ───────────────────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');

(function initTheme() {
    const saved = localStorage.getItem('theme');
    const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (saved === 'light' || (!saved && preferLight)) {
        document.body.classList.add('light');
        themeToggle.textContent = '☾';
    }
})();

themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    themeToggle.textContent = isLight ? '☾' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// ── View switcher ───────────────────────────────────────────────────────────
let currentView = localStorage.getItem('view') || 'cassette'; // 'cassette' | 'vinyl'

function switchView(view) {
    currentView = view;
    localStorage.setItem('view', view);
    viewCassette.hidden = (view !== 'cassette');
    viewVinyl.hidden    = (view !== 'vinyl');
    tabCassette.classList.toggle('active', view === 'cassette');
    tabVinyl.classList.toggle('active',    view === 'vinyl');
    // Recompute allowed tonearm sweep when showing vinyl
    if (view === 'vinyl') {
        // allow layout to settle then compute
        requestAnimationFrame(() => setTimeout(computeAllowedTonearmAngles, 50));
    }
}

tabCassette.addEventListener('click', () => switchView('cassette'));
tabVinyl.addEventListener('click',    () => switchView('vinyl'));

// Restore last view on load (runs after DOM refs are set)
switchView(currentView);

// Recompute angles on resize to keep stylus confined when layout changes
window.addEventListener('resize', () => {
    computeAllowedTonearmAngles();
});

// ── Tonearm tracking ────────────────────────────────────────────────────────
// Allowed angle range (computed to keep stylus over the vinyl)
let allowedMinAngle = -45, allowedMaxAngle = 20;

function computeAllowedTonearmAngles() {
    if (!tonearmEl || !tonearmStylus || !vinylDisc) return;
    // sample angles and find those where the stylus point lies within the vinyl circle
    const rectVinyl = vinylDisc.getBoundingClientRect();
    const cx = rectVinyl.left + rectVinyl.width / 2;
    const cy = rectVinyl.top + rectVinyl.height / 2;
    const radius = Math.min(rectVinyl.width, rectVinyl.height) / 2 - 6; // small margin

    const origTransform = tonearmEl.style.transform;
    const origTransition = tonearmEl.style.transition;
    tonearmEl.style.transition = 'none';

    const insideAngles = [];
    for (let a = -90; a <= 90; a += 1) {
        tonearmEl.style.transform = `rotate(${a}deg)`;
        const sRect = tonearmStylus.getBoundingClientRect();
        const sx = sRect.left + sRect.width / 2;
        const sy = sRect.top + sRect.height / 2;
        const d = Math.hypot(sx - cx, sy - cy);
        if (d <= radius) insideAngles.push(a);
    }

    // restore
    tonearmEl.style.transform = origTransform;
    tonearmEl.style.transition = origTransition;

    if (insideAngles.length) {
        allowedMinAngle = Math.min(...insideAngles);
        allowedMaxAngle = Math.max(...insideAngles);
        // clamp to sensible defaults
        allowedMinAngle = Math.max(allowedMinAngle, -80);
        allowedMaxAngle = Math.min(allowedMaxAngle, 80);
    } else {
        // fallback
        allowedMinAngle = -45;
        allowedMaxAngle = 20;
    }
}

function clampAngle(a) {
    return Math.max(allowedMinAngle, Math.min(allowedMaxAngle, a));
}

// Sweep mapping: fraction 0 -> left (TONEARM_START_ANG), 1 -> right (TONEARM_END_ANG)
const TONEARM_PARKED    = 10;
const TONEARM_START_ANG = -45;
const TONEARM_END_ANG   = 20;

function updateTonearm(fraction) {
    const angle = (fraction < 0 || isNaN(fraction))
        ? TONEARM_PARKED
        : TONEARM_START_ANG + fraction * (TONEARM_END_ANG - TONEARM_START_ANG);
    tonearmEl.style.transform = `rotate(${clampAngle(angle)}deg)`;
}

// ── Tonearm cueing (lift → swing → drop) ────────────────────────────────────
// While `tonearmCueing` is true, continuous playback-progress updates
// (audio 'timeupdate' / the YouTube poll) skip re-writing the arm's angle so
// they don't fight the lift/drop sequence.
let tonearmCueing = false;
let cueTimer1 = null, cueTimer2 = null;

function cueTonearm(fraction) {
    if (!tonearmLiftGroup) { updateTonearm(fraction); return; }
    clearTimeout(cueTimer1);
    clearTimeout(cueTimer2);
    tonearmCueing = true;
    tonearmLiftGroup.classList.add('lifted');
    if (cueLeverMount) cueLeverMount.classList.add('raised');
    cueTimer1 = setTimeout(() => {
        updateTonearm(fraction);
        cueTimer2 = setTimeout(() => {
            tonearmLiftGroup.classList.remove('lifted');
            if (cueLeverMount) cueLeverMount.classList.remove('raised');
            tonearmCueing = false;
        }, 650); // matches .tonearm-wrapper's transform transition duration
    }, 220); // let the arm rise before it swings
}

// Cue lever click — same effect as the transport Play/Pause button, just
// approached the way a real turntable operator would: lift the needle.
if (cueLeverMount) {
    cueLeverMount.addEventListener('click', () => playPauseBtn.click());
}

// ── Vinyl motor — spin-up / coast-down inertia ──────────────────────────────
// Rotation is driven every frame instead of via a fixed-duration CSS
// keyframe animation so the platter accelerates and decelerates like a real
// motor + platter mass, rather than snapping instantly to speed.
const VINYL_BASE_DEG_PER_MS = 360 / 1800; // matches the previous 1.8s/rev at 33⅓
let vinylAngle          = 0;
let vinylAngularSpeed   = 0;     // current deg/ms (always >= 0)
let vinylTargetSpeed    = 0;     // deg/ms the motor is driving toward
let vinylMotorOn        = false;
let vinylRafId          = null;
let vinylLastTs         = null;
let vinylSpeedMultiplier = 1;    // 1 = 33⅓, 1.364 = 45 rpm

function vinylMotorTick(ts) {
    if (vinylLastTs == null) vinylLastTs = ts;
    const dt = Math.min(ts - vinylLastTs, 64); // clamp to avoid huge jumps after a tab freeze
    vinylLastTs = ts;

    // Exponential approach toward target speed: fast spin-up, slower coast-down
    // (a real platter's felt-mat friction lets it drift for longer than the
    // motor takes to bring it up to speed).
    const approachRate = vinylMotorOn ? 0.0032 : 0.0011;
    vinylAngularSpeed += (vinylTargetSpeed - vinylAngularSpeed) * Math.min(1, dt * approachRate);
    if (!vinylMotorOn && vinylAngularSpeed < 0.00002) vinylAngularSpeed = 0;

    vinylAngle = (vinylAngle - vinylAngularSpeed * dt) % 360;
    vinylDisc.style.transform = `rotate(${vinylAngle}deg)`;

    if (vinylMotorOn || vinylAngularSpeed > 0) {
        vinylRafId = requestAnimationFrame(vinylMotorTick);
    } else {
        vinylRafId = null;
        vinylLastTs = null;
    }
}

function setVinylMotor(on) {
    vinylMotorOn     = on;
    vinylTargetSpeed = on ? VINYL_BASE_DEG_PER_MS * vinylSpeedMultiplier : 0;
    vinylDisc.classList.toggle('spinning', on);
    if (vinylMotorLed) vinylMotorLed.classList.toggle('on', on);
    if (!vinylRafId) {
        vinylLastTs = null;
        vinylRafId = requestAnimationFrame(vinylMotorTick);
    }
}

function setVinylSpeed(multiplier, rateBtn) {
    vinylSpeedMultiplier = multiplier;
    if (vinylMotorOn) vinylTargetSpeed = VINYL_BASE_DEG_PER_MS * multiplier;
    if (!ytMode) audio.playbackRate = multiplier;
    [speed33Btn, speed45Btn].forEach(b => b && b.classList.toggle('active', b === rateBtn));
}

if (speed33Btn) speed33Btn.addEventListener('click', () => setVinylSpeed(1, speed33Btn));
if (speed45Btn) speed45Btn.addEventListener('click', () => setVinylSpeed(1.364, speed45Btn));

// ── Drag the tonearm to needle-drop anywhere in the track ──────────────────
let isDraggingTonearm = false;
let wasPlayingBeforeDrag = false;

function angleFromPointer(clientX, clientY) {
    const pivotRect = tonearmBaseEl.getBoundingClientRect();
    const px = pivotRect.left + pivotRect.width  / 2;
    const py = pivotRect.top  + pivotRect.height / 2;
    const rawDeg = Math.atan2(clientY - py, clientX - px) * 180 / Math.PI;
    return clampAngle(rawDeg - 90); // rotate(0) == arm pointing straight down
}

function beginTonearmDrag(e) {
    const hasTrack = ytMode ? !!ytPlayer : (audio.duration > 0);
    if (!hasTrack) return;
    isDraggingTonearm = true;
    wasPlayingBeforeDrag = ytMode
        ? (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1)
        : !audio.paused;
    tonearmCueing = true; // suppress timeupdate/poll updates while dragging
    tonearmEl.style.transition = 'none';
    if (tonearmLiftGroup) tonearmLiftGroup.classList.add('lifted');
    if (cueLeverMount) cueLeverMount.classList.add('raised');
    e.preventDefault();
    window.addEventListener('pointermove', onTonearmDrag);
    window.addEventListener('pointerup', endTonearmDrag, { once: true });
}

function onTonearmDrag(e) {
    if (!isDraggingTonearm) return;
    const angle = angleFromPointer(e.clientX, e.clientY);
    tonearmEl.style.transform = `rotate(${angle}deg)`;
}

function endTonearmDrag(e) {
    if (!isDraggingTonearm) return;
    isDraggingTonearm = false;
    window.removeEventListener('pointermove', onTonearmDrag);

    const angle    = angleFromPointer(e.clientX, e.clientY);
    const fraction = Math.max(0, Math.min(1, (angle - TONEARM_START_ANG) / (TONEARM_END_ANG - TONEARM_START_ANG)));

    if (ytMode) {
        if (ytPlayer && ytPlayer.getDuration) {
            ytPlayer.seekTo(fraction * ytPlayer.getDuration(), true);
            if (wasPlayingBeforeDrag) ytPlayer.playVideo();
        }
    } else if (audio.duration) {
        audio.currentTime = fraction * audio.duration;
        if (wasPlayingBeforeDrag) audio.play();
    }

    tonearmEl.style.transition = '';
    if (tonearmLiftGroup) tonearmLiftGroup.classList.remove('lifted');
    if (cueLeverMount) cueLeverMount.classList.remove('raised');
    tonearmCueing = false;
}

tonearmEl.addEventListener('pointerdown', beginTonearmDrag);

// ── State ──────────────────────────────────────────────────────────────────
let audioContext;
let playlist      = [];     // array of File objects
let trackIds      = [];     // IndexedDB keys, parallel to `playlist` (null until saved)
let currentIdx    = -1;
let isSeeking     = false;
let currentArtUrl = null;   // blob URL for current album art (revoke on track change)
let cassetteAnimating = false; // true while eject/flip/insert animation is running
let pendingPlay       = false; // suppresses audio.play() inside loadTrack during animation

// ── Visualiser state ────────────────────────────────────────────────────────
let analyserNode  = null;
let analyserData  = null;
let mediaSource   = null;   // MediaElementSourceNode (created once)
let rafId         = null;   // requestAnimationFrame handle

// ── Cassette scrub-sound state ──────────────────────────────────────────────
let ffCtx   = null;   // dedicated AudioContext for the FF sound (kept alive across scrubs)
let ffNodes = null;   // active sound nodes (null when not scrubbing)

// ── YouTube state ──────────────────────────────────────────────────────────
let ytMode       = false;   // true when a YouTube video is active
let ytPlayer     = null;    // YT.Player instance
let ytInterval   = null;    // setInterval handle for seek bar sync
let ytAPIPromise = null;    // Promise that resolves when YT IFrame API is ready

// Lerped orb values (smoothed each frame)
let o1a = 0, o2a = 0, o3a = 0;           // opacities
let o1s = 1, o2s = 1, o3s = 1;           // scales
let glowR = 243, glowG = 130, glowB = 36, glowAlpha = 0, glowSz = 0;

// ── File loading ───────────────────────────────────────────────────────────
fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
    // reset so the same file can be re-added later
    fileInput.value = '';
});

function addFiles(files) {
    const audioFiles = files.filter(
        (f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(f.name)
    );
    if (!audioFiles.length) return;

    const startIdx = playlist.length;
    playlist.push(...audioFiles);
    trackIds.push(...audioFiles.map(() => null));
    renderPlaylist();
    store.addTracks(audioFiles).then((ids) => {
        ids.forEach((id, k) => {
            const at = playlist.indexOf(audioFiles[k]);
            if (at >= 0) trackIds[at] = id;
            else if (id !== null) store.removeTrack(id);   // removed before save finished
        });
        persistOrder();
    });

    // Auto-load the first new track if nothing is playing
    if (currentIdx < 0) {
        loadTrack(startIdx);
    }
}

async function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    exitYTMode();   // stop any active YouTube playback first
    currentIdx = index;

    const file = playlist[index];

    // Revoke the previous object URL to free memory
    if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
    }

    audio.src = URL.createObjectURL(file);
    audio.load();

    // try to start playback immediately while metadata work continues
    if (!pendingPlay) {
        audio.play().catch(() => {});
    }

    // Now-playing display
    const { title, artist } = parseFilename(file.name);
    applyMarquee(trackNameEl, title);
    trackMetaEl.textContent  = artist || file.name;

    // Enable controls
    playPauseBtn.disabled = false;
    stopBtn.disabled      = false;
    prevBtn.disabled      = false;
    nextBtn.disabled      = false;
    seekBar.disabled      = false;

    // Reset info, seek bar, tape coils, and sticker
    sampleRateSpan.textContent        = '-';
    bitDepthSpan.textContent          = '-';
    bitrateSpan.textContent           = '-';
    seekBar.value                     = 0;
    updateSeekBarFill(0);
    reelLeftTape.style.borderWidth    = '22px';   // full left reel at start
    reelRightTape.style.borderWidth   = '2px';    // empty right reel at start
    trackTitleEl.textContent          = '───────'; // placeholder while parsing
    albumArtImg.style.display         = 'none';
    artTitle.style.display            = 'none';
    sticker.style.display             = 'flex';

    // Reset vinyl label and tonearm for new track
    vinylArtImg.style.display              = 'none';
    vinylLabelDefault.style.display        = 'flex';
    clearTimeout(cueTimer1);
    clearTimeout(cueTimer2);
    tonearmCueing                          = false;
    if (tonearmLiftGroup) tonearmLiftGroup.classList.remove('lifted');
    if (cueLeverMount) cueLeverMount.classList.remove('raised');
    tonearmEl.style.transition             = 'none';   // snap to start instantly
    tonearmEl.style.transform              = 'rotate(-45deg)';
    // re-enable transition after frame
    requestAnimationFrame(() => { tonearmEl.style.transition = ''; });

    renderPlaylist();
    persistOrder();   // remember last-played track

    // Read audio metadata via Web Audio API
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const arrayBuffer = await file.arrayBuffer();

        // Album art — parse before decodeAudioData (which may detach the buffer)
        if (currentArtUrl) { URL.revokeObjectURL(currentArtUrl); currentArtUrl = null; }
        const artUrl = extractAlbumArt(arrayBuffer);
        if (artUrl) {
            currentArtUrl             = artUrl;
            albumArtImg.src           = artUrl;
            albumArtImg.style.display = 'block';
            artTitle.textContent      = parseFilename(file.name).title;
            artTitle.style.display    = 'block';
            sticker.style.display     = 'none';
            // Mirror art on the vinyl label
            vinylArtImg.src              = artUrl;
            vinylArtImg.style.display    = 'block';
            vinylLabelDefault.style.display = 'none';
        }

        // WAV bit depth — read directly from the fmt chunk (offset 34, little-endian uint16)
        const wavBits = getWavBitDepth(arrayBuffer);

        // Pass a copy to decodeAudioData so the original buffer stays readable
        const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));

        trackTitleEl.textContent   = parseFilename(file.name).title;
        sampleRateSpan.textContent = (decoded.sampleRate / 1000).toFixed(2);
        bitDepthSpan.textContent   = wavBits !== null ? wavBits : 'N/A';

        // Approximate bitrate: file size × 8 bits ÷ duration ÷ 1000 → kbps
        bitrateSpan.textContent = ((file.size * 8) / decoded.duration / 1000).toFixed(0);
        durationSpan.textContent = formatTime(decoded.duration);
    } catch (err) {
        console.warn('Audio metadata error:', err);
    }
}

// ── WAV bit-depth parser ───────────────────────────────────────────────────
function getWavBitDepth(buffer) {
    if (buffer.byteLength < 36) return null;
    const view = new DataView(buffer);
    const riff  = readFourCC(view, 0);
    const wave  = readFourCC(view, 8);
    if (riff !== 'RIFF' || wave !== 'WAVE') return null;
    return view.getUint16(34, true);   // bits per sample field in fmt chunk
}

function readFourCC(view, offset) {
    return String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
    );
}

// ── Album art extractor (ID3v2 APIC / PIC frame) ──────────────────────────
function extractAlbumArt(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 10) return null;

    // Must start with "ID3"
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;

    const version = bytes[3];  // 2 = ID3v2.2, 3 = ID3v2.3, 4 = ID3v2.4

    // Tag size is a 4-byte synchsafe integer (7 bits per byte)
    const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) |
                    ((bytes[8] & 0x7f) << 7)  |  (bytes[9] & 0x7f);

    const pictureFrameId = version === 2 ? 'PIC' : 'APIC';
    let offset = 10;
    const end  = Math.min(10 + tagSize, bytes.length);

    while (offset < end - 10) {
        let frameId, frameSize, headerSize;

        if (version === 2) {
            // ID3v2.2: 3-char frame ID + 3-byte big-endian size (no flags)
            frameId    = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2]);
            frameSize  = (bytes[offset+3] << 16) | (bytes[offset+4] << 8) | bytes[offset+5];
            headerSize = 6;
        } else {
            // ID3v2.3 / v2.4: 4-char frame ID + 4-byte size + 2-byte flags
            frameId = String.fromCharCode(bytes[offset], bytes[offset+1],
                                          bytes[offset+2], bytes[offset+3]);
            if (version === 4) {
                // Synchsafe size
                frameSize = ((bytes[offset+4] & 0x7f) << 21) | ((bytes[offset+5] & 0x7f) << 14) |
                            ((bytes[offset+6] & 0x7f) << 7)  |  (bytes[offset+7] & 0x7f);
            } else {
                // v2.3: regular big-endian uint32
                frameSize = ((bytes[offset+4] << 24) | (bytes[offset+5] << 16) |
                             (bytes[offset+6] << 8)  |  bytes[offset+7]) >>> 0;
            }
            headerSize = 10;
        }

        if (frameSize <= 0 || offset + headerSize + frameSize > end) break;

        if (frameId === pictureFrameId) {
            let pos = offset + headerSize;

            // 1 byte: text encoding (0=latin1, 1=utf-16, 2=utf-16be, 3=utf-8)
            const encoding = bytes[pos++];

            if (version === 2) {
                pos += 3;   // ID3v2.2 PIC: 3-char image format (e.g. JPG, PNG)
            } else {
                // APIC: null-terminated MIME type string
                while (pos < end && bytes[pos] !== 0) pos++;
                pos++;  // skip null terminator
            }

            pos++;  // skip picture type byte

            // Skip null-terminated description
            if (encoding === 1 || encoding === 2) {
                // UTF-16: terminated by two consecutive null bytes
                while (pos + 1 < end && (bytes[pos] !== 0 || bytes[pos+1] !== 0)) pos += 2;
                pos += 2;
            } else {
                // Latin-1 / UTF-8: single null byte
                while (pos < end && bytes[pos] !== 0) pos++;
                pos++;
            }

            // Everything remaining in the frame is raw image data
            const imageBytes = bytes.slice(pos, offset + headerSize + frameSize);
            if (imageBytes.length > 0) {
                return URL.createObjectURL(new Blob([imageBytes]));
            }
        }

        offset += headerSize + frameSize;
    }

    return null;   // No embedded album art found
}

// ── Filename parser ────────────────────────────────────────────────────────
// Supports "Artist - Title.mp3" convention; falls back to bare filename
function parseFilename(filename) {
    const base  = filename.replace(/\.[^.]+$/, '');
    const parts = base.split(' - ');
    if (parts.length >= 2) {
        return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
    return { artist: '', title: base };
}

// ── Playlist persistence (IndexedDB) ───────────────────────────────────────
// Files are stored as Blobs in `tracks`; queue order and last-played track live
// in `meta`, so a reorder only rewrites a small array.
const store = (() => {
    let dbPromise = null;
    function open() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
                const req = indexedDB.open('tapenova-playlist', 1);
                req.onupgradeneeded = () => {
                    req.result.createObjectStore('tracks', { autoIncrement: true });
                    req.result.createObjectStore('meta');
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }
        return dbPromise;
    }
    // Runs fn inside a transaction; resolves true on commit, false on any failure.
    async function run(stores, mode, fn) {
        try {
            const db = await open();
            const tx = db.transaction(stores, mode);
            fn(tx);
            await new Promise((res, rej) => {
                tx.oncomplete = res;
                tx.onerror = tx.onabort = () => rej(tx.error);
            });
            return true;
        } catch (err) {
            console.warn('Playlist storage error:', err);
            return false;
        }
    }
    return {
        async addTracks(files) {
            const reqs = [];
            const ok = await run(['tracks'], 'readwrite', (tx) => {
                files.forEach((f) => reqs.push(tx.objectStore('tracks').add(f)));
            });
            return ok ? reqs.map((r) => r.result) : files.map(() => null);
        },
        removeTrack: (id) => run(['tracks'], 'readwrite', (tx) => tx.objectStore('tracks').delete(id)),
        saveState: (order, current) => run(['meta'], 'readwrite', (tx) => {
            tx.objectStore('meta').put(order, 'order');
            tx.objectStore('meta').put(current, 'current');
        }),
        async load() {
            const r = {};
            const ok = await run(['tracks', 'meta'], 'readonly', (tx) => {
                r.order   = tx.objectStore('meta').get('order');
                r.current = tx.objectStore('meta').get('current');
                r.keys    = tx.objectStore('tracks').getAllKeys();
                r.vals    = tx.objectStore('tracks').getAll();
            });
            if (!ok) return null;
            const byId = new Map(r.keys.result.map((k, i) => [k, r.vals.result[i]]));
            const ids = (r.order.result || []).filter((id) => byId.has(id));
            // Tracks missing from the saved order (e.g. interrupted save) go last
            byId.forEach((_, id) => { if (!ids.includes(id)) ids.push(id); });
            return { ids, files: ids.map((id) => byId.get(id)), current: r.current.result ?? null };
        },
    };
})();

function persistOrder() {
    if (trackIds.some((id) => id === null)) return;   // writes still in flight
    store.saveState(trackIds.slice(), trackIds[currentIdx] ?? null);
}

async function restorePlaylist() {
    const saved = await store.load();
    if (!saved || !saved.files.length || playlist.length) return;
    playlist = saved.files;
    trackIds = saved.ids;
    renderPlaylist();
    // Cue up the last-played track without starting playback
    const idx = saved.ids.indexOf(saved.current);
    pendingPlay = true;
    loadTrack(idx >= 0 ? idx : 0);
    pendingPlay = false;
}

function moveTrack(from, to) {
    if (from === to || to < 0 || to >= playlist.length) return;
    const playing = currentIdx >= 0 ? playlist[currentIdx] : null;
    playlist.splice(to, 0, playlist.splice(from, 1)[0]);
    trackIds.splice(to, 0, trackIds.splice(from, 1)[0]);
    if (playing) currentIdx = playlist.indexOf(playing);
    renderPlaylist();
    persistOrder();
}

function removeTrack(i) {
    const id = trackIds[i];
    const wasCurrent = i === currentIdx;
    playlist.splice(i, 1);
    trackIds.splice(i, 1);
    if (id !== null) store.removeTrack(id);
    if (wasCurrent) {
        currentIdx = -1;
        if (playlist.length) {
            changeTrack(Math.min(i, playlist.length - 1));
        } else {
            audio.pause();
            trackNameEl.textContent = 'No track loaded';
            trackMetaEl.textContent = '';
        }
    } else if (i < currentIdx) {
        currentIdx--;
    }
    renderPlaylist();
    persistOrder();
}

// ── Playlist render ────────────────────────────────────────────────────────
function renderPlaylist() {
    playlistEl.innerHTML = '';
    queueCountEl.textContent = `(${playlist.length})`;

    playlist.forEach((file, i) => {
        const title = parseFilename(file.name).title;
        const li = document.createElement('li');
        if (i === currentIdx) li.classList.add('active');

        const handle = document.createElement('span');
        handle.className = 'pl-handle';
        handle.textContent = '⠿';
        handle.tabIndex = 0;
        handle.setAttribute('role', 'button');
        handle.setAttribute('aria-label', `Reorder ${title}. Drag, or use up and down arrow keys.`);
        handle.addEventListener('pointerdown', (e) => beginPlaylistDrag(e, li, i));
        handle.addEventListener('click', (e) => e.stopPropagation());
        handle.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            e.stopPropagation();
            const to = Math.max(0, Math.min(playlist.length - 1, i + (e.key === 'ArrowUp' ? -1 : 1)));
            moveTrack(i, to);
            playlistEl.children[to].querySelector('.pl-handle').focus();
        });

        const label = document.createElement('span');
        label.className = 'pl-title';
        label.textContent = `${i + 1}. ${title}`;

        const del = document.createElement('button');
        del.className = 'pl-remove';
        del.type = 'button';
        del.textContent = '×';
        del.setAttribute('aria-label', `Remove ${title} from queue`);
        del.addEventListener('click', (e) => { e.stopPropagation(); removeTrack(i); });

        li.append(handle, label, del);
        li.addEventListener('click', () => changeTrack(i));
        playlistEl.appendChild(li);
    });
}

// Pointer-based drag (mouse, touch, pen). The row is moved in the DOM while
// dragging; the new order is committed once on release.
function beginPlaylistDrag(e, li, from) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    li.classList.add('dragging');
    playlistEl.classList.add('reordering');

    const onMove = (ev) => {
        const box = playlistEl.getBoundingClientRect();
        if (ev.clientY < box.top + 20) playlistEl.scrollTop -= 8;
        else if (ev.clientY > box.bottom - 20) playlistEl.scrollTop += 8;
        for (const row of playlistEl.children) {
            if (row === li) continue;
            const r = row.getBoundingClientRect();
            if (ev.clientY < r.top || ev.clientY > r.bottom) continue;
            const ref = ev.clientY > r.top + r.height / 2 ? row.nextSibling : row;
            if (ref !== li) playlistEl.insertBefore(li, ref);
            break;
        }
    };
    const finish = (commit) => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onCancel);
        const to = Array.from(playlistEl.children).indexOf(li);
        if (commit && to !== from) moveTrack(from, to);
        else renderPlaylist();
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
}

restorePlaylist();

// ── Playback controls ──────────────────────────────────────────────────────
playPauseBtn.addEventListener('click', () => {
    if (ytMode) {
        if (!ytPlayer) return;
        const state = ytPlayer.getPlayerState();
        if (state === 1 || state === 3) { // 1=playing, 3=buffering
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
        return;
    }
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

stopBtn.addEventListener('click', () => {
    if (ytMode) {
        if (!ytPlayer) return;
        ytPlayer.stopVideo();
        stopReels();
        stopYTSeekUpdate();
        seekBar.value               = 0;
        updateSeekBarFill(0);
        currentTimeSpan.textContent = '00:00';
        playPauseBtn.innerHTML      = '&#9654;';
        return;
    }
    audio.pause();
    audio.currentTime = 0;
});

prevBtn.addEventListener('click', () => {
    if (ytMode) return;  // no prev/next in YouTube mode
    // If more than 3 s in, restart current track; otherwise go to previous
    if (audio.currentTime > 3 && currentIdx >= 0) {
        audio.currentTime = 0;
    } else {
        changeTrack(Math.max(0, currentIdx - 1));
    }
});

nextBtn.addEventListener('click', () => {
    if (ytMode) return;  // no prev/next in YouTube mode
    changeTrack(Math.min(playlist.length - 1, currentIdx + 1));
});

// Auto-advance to next track
audio.addEventListener('ended', () => {
    if (currentIdx < playlist.length - 1) {
        changeTrack(currentIdx + 1);
    } else {
        stopReels();
        stopViz();
        playPauseBtn.innerHTML = '&#9654;';
    }
});

// ── Cassette FF scrub sound ─────────────────────────────────────────────────
// Synthesises the characteristic high-pitched whirring + tape-hiss heard when
// fast-forwarding a physical cassette.  Pure Web Audio — no audio files needed.

function startCassetteFFSound() {
    if (ffNodes) return;   // already running

    if (!ffCtx || ffCtx.state === 'closed') {
        ffCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ffCtx.state === 'suspended') ffCtx.resume();

    const ctx = ffCtx;
    const now = ctx.currentTime;

    // ── White-noise source (tape hiss) ────────────────────────────────────
    // 2-second looped buffer so it never sounds repetitive
    const bufLen   = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nd       = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop   = true;

    // Strip low-end — keep only the airy hiss region
    const hp = ctx.createBiquadFilter();
    hp.type            = 'highpass';
    hp.frequency.value = 2200;
    hp.Q.value         = 0.6;

    // Boost the characteristic "squeal" band around 4 kHz
    const bp = ctx.createBiquadFilter();
    bp.type            = 'bandpass';
    bp.frequency.value = 4200;
    bp.Q.value         = 2.8;

    const noiseGain     = ctx.createGain();
    noiseGain.gain.value = 0.85;

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(noiseGain);

    // ── Motor oscillator (sawtooth ≈ mechanical whine) ────────────────────
    const osc  = ctx.createOscillator();
    osc.type             = 'sawtooth';
    osc.frequency.value  = 2900;

    // LFO adds ≈12 Hz flutter — the slight pitch wobble of real tape transport
    const lfo     = ctx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = 12;

    const lfoGain       = ctx.createGain();
    lfoGain.gain.value  = 140;   // ±140 Hz pitch deviation

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const oscGain       = ctx.createGain();
    oscGain.gain.value  = 0.22;

    osc.connect(oscGain);

    // ── Master gain — fade in quickly so it doesn't click ────────────────
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.14, now + 0.05);

    noiseGain.connect(master);
    oscGain.connect(master);
    master.connect(ctx.destination);

    noise.start(now);
    osc.start(now);
    lfo.start(now);

    ffNodes = { noise, osc, lfo, master };
}

function stopCassetteFFSound() {
    if (!ffNodes || !ffCtx) return;
    const { noise, osc, lfo, master } = ffNodes;
    const now = ffCtx.currentTime;

    // Fade out quickly to avoid a click
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.07);

    setTimeout(() => {
        try { noise.stop(); } catch (_) {}
        try { osc.stop();   } catch (_) {}
        try { lfo.stop();   } catch (_) {}
    }, 90);

    ffNodes = null;
}

// Safety net: if the mouse is released anywhere on the page, stop the sound
document.addEventListener('mouseup',  stopCassetteFFSound);
document.addEventListener('touchend', stopCassetteFFSound, { passive: true });

// ── Seek bar ───────────────────────────────────────────────────────────────
seekBar.addEventListener('mousedown',  () => { isSeeking = true; startCassetteFFSound(); });
seekBar.addEventListener('touchstart', () => { isSeeking = true; startCassetteFFSound(); }, { passive: true });

// Preview time while dragging
seekBar.addEventListener('input', () => {
    const dur = ytMode
        ? (ytPlayer && ytPlayer.getDuration ? ytPlayer.getDuration() : 0)
        : (audio.duration || 0);
    currentTimeSpan.textContent = formatTime((seekBar.value / 100) * dur);
    updateSeekBarFill(seekBar.value);
});

// Commit seek on release
seekBar.addEventListener('change', () => {
    stopCassetteFFSound();   // kill the FF whirr as soon as the thumb is released
    if (ytMode) {
        if (ytPlayer && ytPlayer.getDuration) {
            ytPlayer.seekTo((seekBar.value / 100) * ytPlayer.getDuration(), true);
        }
        isSeeking = false;
        return;
    }
    if (audio.duration) {
        audio.currentTime = (seekBar.value / 100) * audio.duration;
    }
    isSeeking = false;
});

function updateSeekBarFill(pct) {
    seekBar.style.background =
        `linear-gradient(to right, var(--accent) ${pct}%, #1e1e1e ${pct}%)`;
}

// ── Audio events ───────────────────────────────────────────────────────────
audio.addEventListener('play', () => {
    reelLeft.classList.add('spin');
    reelRight.classList.add('spin');
    tapeStrand.classList.add('rolling');
    setVinylMotor(true);
    const duration = audio.duration || 0;
    cueTonearm(duration > 0 ? audio.currentTime / duration : 0);
    if (vpSpinner) vpSpinner.classList.add('spin');
    playPauseBtn.innerHTML = '&#9646;&#9646;';
    wbLed.classList.add('active');
    ensureAnalyser();
    startViz();
    startWave();
});

audio.addEventListener('pause', () => {
    stopReels();
    playPauseBtn.innerHTML = '&#9654;';
    wbLed.classList.remove('active');
    stopViz();
    stopWave();
});

audio.addEventListener('ended', () => {
    if (currentIdx < playlist.length - 1) {
        changeTrack(currentIdx + 1);
    } else {
        stopReels();
        stopViz();
        playPauseBtn.innerHTML = '&#9654;';
    }
    stopWave();
});

audio.addEventListener('timeupdate', () => {
    if (isSeeking) return;

    const duration = audio.duration || 0;
    const fraction = duration > 0 ? audio.currentTime / duration : 0;
    const pct      = fraction * 100;

    currentTimeSpan.textContent = formatTime(audio.currentTime);
    if (duration) durationSpan.textContent = formatTime(duration);

    seekBar.value = pct;
    updateSeekBarFill(pct);

    // Tape coil thickness: left reel drains (22→2px), right reel fills (2→22px)
    reelLeftTape.style.borderWidth  = Math.max(2,  22 - 20 * fraction) + 'px';
    reelRightTape.style.borderWidth = Math.min(22,  2 + 20 * fraction) + 'px';

    // Tonearm sweeps across the record as the track progresses (skipped while
    // a lift/drop cue or a manual drag is already animating the arm)
    if (!tonearmCueing) updateTonearm(fraction);
});

function stopReels() {
    reelLeft.classList.remove('spin');
    reelRight.classList.remove('spin');
    tapeStrand.classList.remove('rolling');
    setVinylMotor(false);
    if (vpSpinner) vpSpinner.classList.remove('spin');
    // lift the tonearm and swing it back to rest when everything stops
    cueTonearm(-1);
}

// ── Drag-and-drop ──────────────────────────────────────────────────────────
playerContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    playerContainer.classList.add('drag-over');
});

playerContainer.addEventListener('dragleave', (e) => {
    if (!playerContainer.contains(e.relatedTarget)) {
        playerContainer.classList.remove('drag-over');
    }
});

playerContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    playerContainer.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files));
});

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ── Cassette change animation ───────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function changeTrack(index) {
    if (index < 0 || index >= playlist.length) return;

    // In vinyl view, skip the lid/cassette animation — just load directly
    if (currentView === 'vinyl') {
        loadTrack(index);
        return;
    }

    if (cassetteAnimating) return;
    cassetteAnimating = true;
    pendingPlay       = true;

    // Freeze playback; LED goes off
    if (!audio.paused) audio.pause();
    wbLed.classList.remove('active');

    const el = cassetteEl;

    // ── Phase 1: Lid opens ────────────────────────────────────────────────
    compartmentLid.classList.add('open');
    await sleep(440);

    // ── Phase 2: Cassette ejects upward ──────────────────────────────────
    el.style.transition = 'transform 0.38s cubic-bezier(0.4, 0, 1, 1)';
    el.style.transform  = 'translateY(-195px) scale(1.04)';
    await sleep(380);

    // ── Phase 3: Cassette flips; load next track silently in background ──
    el.style.transition = 'transform 0.55s ease-in-out';
    el.style.transform  = 'translateY(-195px) scale(1.04) rotateX(180deg)';
    loadTrack(index);   // pendingPlay=true suppresses audio.play() inside loadTrack
    await sleep(550);

    // ── Phase 4: Cassette drops back in (spring bounce) ──────────────────
    el.style.transition = 'transform 0.50s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transform  = 'translateY(0) scale(1) rotateX(360deg)';
    await sleep(500);

    // Clear transform (360deg ≡ 0deg — no visible jump)
    el.style.transition = '';
    el.style.transform  = '';

    // ── Phase 5: Lid closes ───────────────────────────────────────────────
    compartmentLid.classList.remove('open');
    await sleep(450);

    // ── Phase 6: Start playback ───────────────────────────────────────────
    pendingPlay       = false;
    cassetteAnimating = false;

    if (audio.readyState >= 2) {
        audio.play().catch(() => {});
    } else {
        audio.addEventListener('canplay', () => audio.play().catch(() => {}), { once: true });
    }
}

// ── Audio visualiser ───────────────────────────────────────────────────────

// Create analyser + connect audio element through it (done once per session)
function ensureAnalyser() {
    if (analyserNode) return;
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    audioContext.resume();
    mediaSource  = audioContext.createMediaElementSource(audio);
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.82;
    mediaSource.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
    analyserData = new Uint8Array(analyserNode.frequencyBinCount);
}

function startViz() {
    if (rafId) return;
    // Remove CSS transitions so JS can drive values frame-by-frame
    orb1El.style.transition = '';
    orb2El.style.transition = '';
    orb3El.style.transition = '';
    vizLoop();
}

function stopViz() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    // Smoothly fade out orbs with CSS transition
    const T = 'opacity 0.9s ease, transform 0.9s ease';
    orb1El.style.transition = T;
    orb2El.style.transition = T;
    orb3El.style.transition = T;
    orb1El.style.opacity = '0';
    orb2El.style.opacity = '0';
    orb3El.style.opacity = '0';
    orb1El.style.transform = 'scale(1)';
    orb2El.style.transform = 'scale(1)';
    orb3El.style.transform = 'scale(1)';
    // Restore player shadow to static default
    playerContainer.style.boxShadow = '';
    // Reset lerped state so next startViz begins cleanly
    o1a = o2a = o3a = 0;
    o1s = o2s = o3s = 1;
    glowAlpha = 0; glowSz = 0;
}

function vizLoop() {
    rafId = requestAnimationFrame(vizLoop);
    if (!analyserNode) return;

    analyserNode.getByteFrequencyData(analyserData);
    const n = analyserData.length;

    // Three frequency bands (normalised 0–1)
    const bN = bandAvg(0,                   Math.floor(n * 0.08)) / 255; // bass
    const mN = bandAvg(Math.floor(n * 0.08), Math.floor(n * 0.45)) / 255; // mids
    const tN = bandAvg(Math.floor(n * 0.45), n)                   / 255; // treble

    const S = 0.10; // smoothing factor (lower = smoother but more lag)
    const lerp = (a, b) => a + (b - a) * S;

    // Lerp orb opacities toward target
    o1a = lerp(o1a, 0.25 + bN * 0.70);
    o2a = lerp(o2a, 0.20 + tN * 0.65);
    o3a = lerp(o3a, 0.15 + mN * 0.60);

    // Lerp orb scales (bass punches hardest)
    o1s = lerp(o1s, 0.80 + bN * 0.45);
    o2s = lerp(o2s, 0.80 + tN * 0.38);
    o3s = lerp(o3s, 0.75 + mN * 0.42);

    orb1El.style.opacity   = o1a.toFixed(3);
    orb1El.style.transform = `scale(${o1s.toFixed(3)})`;
    orb2El.style.opacity   = o2a.toFixed(3);
    orb2El.style.transform = `scale(${o2s.toFixed(3)})`;
    orb3El.style.opacity   = o3a.toFixed(3);
    orb3El.style.transform = `scale(${o3s.toFixed(3)})`;

    // Player edge glow: colour shifts with mids/treble, intensity driven by bass
    glowR     = lerp(glowR,     210 + mN * 80);
    glowG     = lerp(glowG,      60 + mN * 120);
    glowB     = lerp(glowB,      20 + tN * 180);
    glowAlpha = lerp(glowAlpha, bN * 0.60);
    glowSz    = lerp(glowSz,    20 + bN * 80);

    playerContainer.style.boxShadow = [
        `0 0 ${glowSz.toFixed(1)}px rgba(${glowR|0},${glowG|0},${glowB|0},${glowAlpha.toFixed(3)})`,
        '0 28px 70px rgba(0,0,0,0.70)',
        '0 6px 18px rgba(0,0,0,0.40)',
        'inset 0 1px 0 rgba(255,255,255,0.06)'
    ].join(', ');
}

function bandAvg(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) sum += analyserData[i];
    return sum / Math.max(1, end - start);
}

// ── Marquee for long track names ───────────────────────────────────────────
function applyMarquee(el, text) {
    // Reset to plain text first
    el.className   = 'track-name';
    el.textContent = text;

    // Defer measurement until after DOM paints
    requestAnimationFrame(() => {
        if (el.scrollWidth <= el.clientWidth + 2) return; // fits — no marquee needed

        // Duplicate text with a gap so the loop is seamless
        const GAP  = '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0';
        const span = document.createElement('span');
        span.className   = 'marquee-inner';
        span.textContent = text + GAP + text;
        el.textContent   = '';
        el.appendChild(span);
        el.classList.add('marquee');

        // Set speed-based duration (55 px/s) after the span is in the DOM
        requestAnimationFrame(() => {
            const singleWidth = span.scrollWidth / 2;
            const dur = Math.max(6, singleWidth / 55).toFixed(1);
            span.style.animationDuration = dur + 's';
        });
    });
}

// ── YouTube playback ────────────────────────────────────────────────────────

// Extract the 11-char video ID from common YouTube URL formats
function extractYTVideoId(url) {
    const re = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const m  = url.match(re);
    return m ? m[1] : null;
}

// Dynamically load the YouTube IFrame API script (once)
function loadYTAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytAPIPromise) return ytAPIPromise;
    ytAPIPromise = new Promise((resolve) => {
        window.onYouTubeIframeAPIReady = resolve;
        const s = document.createElement('script');
        s.src   = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
    });
    return ytAPIPromise;
}

// Load a YouTube video by its ID into the cassette player
async function loadYouTube(videoId) {
    // Stop any file playback cleanly
    audio.pause();
    audio.src = '';
    stopReels();
    stopViz();

    ytMode = true;
    seekBar.disabled      = false;
    playPauseBtn.disabled = false;
    stopBtn.disabled      = false;
    prevBtn.disabled      = true;   // no prev/next for a single YT video
    nextBtn.disabled      = true;

    // YouTube streams AAC-LC at 44.1 kHz / 128 kbps (standard quality)
    // Exact bit depth is N/A for lossy-compressed audio
    sampleRateSpan.textContent   = '44.10';
    bitDepthSpan.textContent     = 'N/A';
    bitrateSpan.textContent      = '128';
    seekBar.value                = 0;
    updateSeekBarFill(0);
    currentTimeSpan.textContent  = '00:00';
    durationSpan.textContent     = '00:00';
    reelLeftTape.style.borderWidth  = '22px';
    reelRightTape.style.borderWidth = '2px';

    // Show YouTube thumbnail as album art immediately (no API key needed)
    if (currentArtUrl) { URL.revokeObjectURL(currentArtUrl); currentArtUrl = null; }
    const ytThumb             = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    albumArtImg.src           = ytThumb;
    albumArtImg.style.display = 'block';
    sticker.style.display     = 'none';
    artTitle.textContent      = '';
    artTitle.style.display    = 'none';
    trackTitleEl.textContent  = '───────';
    // Mirror thumbnail on vinyl label
    vinylArtImg.src              = ytThumb;
    vinylArtImg.style.display    = 'block';
    vinylLabelDefault.style.display = 'none';
    clearTimeout(cueTimer1);
    clearTimeout(cueTimer2);
    tonearmCueing                = false;
    if (tonearmLiftGroup) tonearmLiftGroup.classList.remove('lifted');
    if (cueLeverMount) cueLeverMount.classList.remove('raised');
    tonearmEl.style.transition   = 'none';
    tonearmEl.style.transform    = 'rotate(-45deg)';
    requestAnimationFrame(() => { tonearmEl.style.transition = ''; });

    // Placeholder while we fetch metadata
    applyMarquee(trackNameEl, 'Loading…');
    trackMetaEl.textContent = 'YouTube';

    // Fetch title + author via oEmbed — no API key needed, CORS-allowed
    try {
        const resp = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (resp.ok) {
            const meta  = await resp.json();
            const title = meta.title || 'YouTube Video';
            applyMarquee(trackNameEl, title);
            trackMetaEl.textContent  = meta.author_name || 'YouTube';
            trackTitleEl.textContent = title;
            artTitle.textContent     = title;
            artTitle.style.display   = 'block';
        }
    } catch (_) {
        applyMarquee(trackNameEl, 'YouTube Video');
    }

    // Load the IFrame API, then create or reuse the YT.Player
    await loadYTAPI();

    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoId);
    } else {
        ytPlayer = new YT.Player('ytPlayerEl', {
            height:     '200',
            width:      '200',
            videoId:    videoId,
            playerVars: {
                autoplay:       1,
                controls:       0,
                disablekb:      1,
                fs:             0,
                rel:            0,
                modestbranding: 1,
            },
            events: {
                onStateChange: (e) => onYTStateChange(e.data),
                onError:       (e) => handleYTError(e.data),
            },
        });
    }
}

// Bridge YouTube player state changes → cassette UI
function onYTStateChange(state) {
    if (!ytMode) return;
    // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
    if (state === 1) {
        stopWave(); // analyzer not used in YT mode
        reelLeft.classList.add('spin');
        reelRight.classList.add('spin');
        tapeStrand.classList.add('rolling');
        setVinylMotor(true);
        if (ytPlayer && ytPlayer.getDuration) {
            const dur = ytPlayer.getDuration() || 0;
            cueTonearm(dur > 0 ? ytPlayer.getCurrentTime() / dur : 0);
        }
        if (vpSpinner) vpSpinner.classList.add('spin');
        playPauseBtn.innerHTML = '&#9646;&#9646;';
        wbLed.classList.add('active');
        startYTSeekUpdate();
    } else if (state === 2) {
        stopReels();   // stopReels also removes vinylDisc.spinning
        stopYTSeekUpdate();
        playPauseBtn.innerHTML = '&#9654;';
        wbLed.classList.remove('active');
    } else if (state === 0) {
        stopReels();
        stopYTSeekUpdate();
        playPauseBtn.innerHTML = '&#9654;';
        wbLed.classList.remove('active');
    }
}

function handleYTError(code) {
    console.warn('YouTube player error code:', code);
    const messages = {
        2:   'Invalid video ID',
        5:   'Playback blocked — serve the player over HTTP (not file://) or try a different video',
        100: 'Video not found or is private',
        101: 'This video cannot be embedded (owner has disabled it)',
        150: 'This video cannot be embedded (owner has disabled it)',
    };
    trackMetaEl.textContent = messages[code] || `YouTube error (code ${code})`;
    stopReels();
    stopYTSeekUpdate();
    playPauseBtn.innerHTML = '&#9654;';
}

// Poll the YT player every 250 ms to keep seek bar and time in sync
function startYTSeekUpdate() {
    stopYTSeekUpdate();
    ytInterval = setInterval(() => {
        if (!ytPlayer || !ytMode) return;
        const cur      = ytPlayer.getCurrentTime() || 0;
        const dur      = ytPlayer.getDuration()    || 0;
        const fraction = dur > 0 ? cur / dur : 0;
        const pct      = fraction * 100;
        if (!isSeeking) {
            currentTimeSpan.textContent     = formatTime(cur);
            durationSpan.textContent        = formatTime(dur);
            seekBar.value                   = pct;
            updateSeekBarFill(pct);
            reelLeftTape.style.borderWidth  = Math.max(2,  22 - 20 * fraction) + 'px';
            reelRightTape.style.borderWidth = Math.min(22,  2 + 20 * fraction) + 'px';
            // keep the tonearm moving in YouTube mode as well
            if (!tonearmCueing) updateTonearm(fraction);
        }
    }, 250);
}

function stopYTSeekUpdate() {
    if (ytInterval) { clearInterval(ytInterval); ytInterval = null; }
}

// Clean up YouTube mode before switching to file playback
function exitYTMode() {
    if (!ytMode) return;
    ytMode = false;
    stopYTSeekUpdate();
    if (ytPlayer) {
        try { ytPlayer.stopVideo(); } catch (_) {}
    }
    stopReels();
    // clear wave bars
    stopWave();
    document.querySelectorAll('.sound-wave-bar').forEach(b => b.style.height = '10%');
    seekBar.value               = 0;
    updateSeekBarFill(0);
    currentTimeSpan.textContent = '00:00';
    durationSpan.textContent    = '00:00';
}

// ── YouTube URL input handlers ──────────────────────────────────────────────
ytLoadBtn.addEventListener('click', () => {
    // YouTube IFrame API requires HTTP/HTTPS — file:// pages have a null origin
    // and postMessage will always fail.
    if (location.protocol === 'file:') {
        trackMetaEl.textContent = 'YouTube needs a local server — run: python3 -m http.server 8080';
        applyMarquee(trackNameEl, 'Open via http://localhost:8080');
        return;
    }
    const url     = ytUrlInput.value.trim();
    const videoId = extractYTVideoId(url);
    if (!videoId) {
        trackMetaEl.textContent = 'Invalid YouTube URL — paste a youtube.com or youtu.be link';
        return;
    }
    loadYouTube(videoId);
});

ytUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ytLoadBtn.click();
});

// Sound wave variables
let waveRaf = null;
let waveFreqData = null;

// Create sound wave bars dynamically
function createSoundWaveBars() {
    const container = document.getElementById('soundWaveContainer');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'sound-wave-bar';
        container.appendChild(bar);
    }
}

// Update sound wave bars based on audio frequency data
function updateSoundWave(frequencyData) {
    const bars = document.querySelectorAll('.sound-wave-bar');
    if (!bars.length || !frequencyData || frequencyData.length === 0) return;

    const step = Math.floor(frequencyData.length / bars.length);
    bars.forEach((bar, index) => {
        const idx = index * step;
        const value = frequencyData[idx] || 0;
        bar.style.height = `${Math.max(10, value / 2)}%`;
    });
}

function startWave() {
    const container = document.getElementById('soundWaveContainer');
    if (ytMode) return; // disable in YouTube mode (no analyzer)
    if (!analyserNode) ensureAnalyser();
    if (!waveFreqData) waveFreqData = new Uint8Array(analyserNode.frequencyBinCount);
    if (waveRaf) return;
    if (container) container.style.opacity = '1';

    function step() {
        analyserNode.getByteFrequencyData(waveFreqData);
        updateSoundWave(waveFreqData);
        waveRaf = requestAnimationFrame(step);
    }
    step();
}

function stopWave() {
    if (waveRaf) { cancelAnimationFrame(waveRaf); waveRaf = null; }
    const container = document.getElementById('soundWaveContainer');
    if (container) container.style.opacity = '0';
}

// Initialize bars once
createSoundWaveBars();

// ── Contextual help icons & tooltips ──────────────────────────────────────
(function initTooltips() {
    const icons = document.querySelectorAll('.help-icon');

    function closeAll() {
        document.querySelectorAll('.tooltip--visible')
            .forEach(t => t.classList.remove('tooltip--visible'));
    }

    icons.forEach(icon => {
        const tip = icon.nextElementSibling;
        if (!tip || tip.getAttribute('role') !== 'tooltip') return;

        icon.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = tip.classList.contains('tooltip--visible');
            closeAll();
            if (!isOpen) tip.classList.add('tooltip--visible');
        });

        icon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                icon.click();
            }
            if (e.key === 'Escape') closeAll();
        });
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.help-wrap')) closeAll();
    });
})();

