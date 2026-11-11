/**
 * Procedural Web Audio API Sound Synthesis Engine for Samurai Blade Museum & Dojo
 * Zero external audio dependencies - 100% reliable, zero latency, customizable pitch/harmonics.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.sfxGain = null;
        this.isMuted = false;
        this.ambientPlaying = false;
        this.ambientInterval = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);

            this.initialized = true;
            this.startAmbient();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            const target = this.isMuted ? 0.0001 : 0.8;
            this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    // Realistic metallic blade unsheathing ("Iaido Shwing")
    playDraw(speedMultiplier = 1.0) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const dur = Math.max(0.3, 0.65 / speedMultiplier);

        // 1. Friction scrape noise (blade sliding against wood/brass koiguchi)
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.7));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1200, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(3800, now + dur * 0.8);
        noiseFilter.Q.setValueAtTime(5.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + dur * 0.4);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + dur);

        // 2. High-pitched crystalline metallic chime resonance
        const freqs = [1850, 2460, 3720, 5200];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx % 2 === 0 ? "sine" : "triangle";
            osc.frequency.setValueAtTime(freq * (0.95 + Math.random() * 0.1), now + dur * 0.3);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + dur * 0.8);

            const startTime = now + dur * (0.25 + idx * 0.05);
            const tailDur = 1.2;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(0.15 / (idx + 1), startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tailDur);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + tailDur);
        });
    }

    // Wooden & habaki lock click ("Noto sheathe sound")
    playSheathe() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Slide into saya
        const slideDur = 0.35;
        const bufferSize = this.ctx.sampleRate * slideDur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2600, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + slideDur);
        filter.Q.setValueAtTime(3.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + slideDur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + slideDur);

        // Final Habaki snapping into Koiguchi collar ("Kachin!")
        const clickTime = now + slideDur * 0.9;
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();

        clickOsc.type = "sine";
        clickOsc.frequency.setValueAtTime(1400, clickTime);
        clickOsc.frequency.exponentialRampToValueAtTime(300, clickTime + 0.08);

        clickGain.gain.setValueAtTime(0.6, clickTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.09);

        clickOsc.connect(clickGain);
        clickGain.connect(this.sfxGain);
        clickOsc.start(clickTime);
        clickOsc.stop(clickTime + 0.1);

        // Wood resonance body thud
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = "sine";
        thudOsc.frequency.setValueAtTime(240, clickTime);
        thudOsc.frequency.exponentialRampToValueAtTime(60, clickTime + 0.12);
        thudGain.gain.setValueAtTime(0.4, clickTime);
        thudGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.12);
        thudOsc.connect(thudGain);
        thudGain.connect(this.sfxGain);
        thudOsc.start(clickTime);
        thudOsc.stop(clickTime + 0.15);
    }

    // High velocity aerodynamic whoosh for slicing/swinging
    playSlash(pitchMod = 1.0) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const dur = 0.28;

        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400 * pitchMod, now);
        filter.frequency.exponentialRampToValueAtTime(3200 * pitchMod, now + dur * 0.35);
        filter.frequency.exponentialRampToValueAtTime(300 * pitchMod, now + dur);
        filter.Q.setValueAtTime(4.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.7, now + dur * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + dur);
    }

    // Clean cutting impact sound: tatami / bamboo slice ("Zan!")
    playCutImpact(isCleanCut = true) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Sharp metallic blade bite
        const biteOsc = this.ctx.createOscillator();
        const biteGain = this.ctx.createGain();
        biteOsc.type = "triangle";
        biteOsc.frequency.setValueAtTime(2800, now);
        biteOsc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

        biteGain.gain.setValueAtTime(0.6, now);
        biteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        biteOsc.connect(biteGain);
        biteGain.connect(this.sfxGain);
        biteOsc.start(now);
        biteOsc.stop(now + 0.09);

        // Bamboo / straw stalk snapping & separation
        const dur = isCleanCut ? 0.22 : 0.35;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(isCleanCut ? 1600 : 900, now);
        filter.Q.setValueAtTime(2.0, now);

        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.8, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(crackGain);
        crackGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + dur);

        // If clean cut, add an appreciative reverberant chime
        if (isCleanCut) {
            this.playBell(587.33, 0.25, 1.2); // D5
        }
    }

    // Resonant Japanese temple bell / Singing bowl chime (Hirajoshi / Insen tuning)
    playBell(freq = 440, volume = 0.3, decay = 2.5) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Fundamental + natural overtones
        const harmonics = [1, 2.01, 3.02, 4.2];
        harmonics.forEach((h, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq * h, now);

            const hVolume = (volume / (idx + 1)) * 0.7;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(hVolume, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay / (idx * 0.5 + 1));

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + decay);
        });
    }

    // Steel ringing reflection on mouse hover or light glint
    playBladeChime() {
        const notes = [880, 987.77, 1174.66, 1318.51, 1567.98]; // A5, B5, D6, E6, G6
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.playBell(note, 0.15, 1.5);
    }

    // Atmospheric Japanese Zen background soundscape (Koto & wind ambience)
    startAmbient() {
        if (this.ambientInterval) return;
        // Traditional Japanese Hirajoshi Pentatonic Scale frequencies: D4, Eb4, G4, A4, Bb4, D5, Eb5, G5
        const hirajoshi = [293.66, 311.13, 392.00, 440.00, 466.16, 587.33, 622.25, 783.99];

        const playKotoNote = () => {
            if (!this.initialized || this.isMuted) return;
            this.resume();
            const now = this.ctx.currentTime;
            const note = hirajoshi[Math.floor(Math.random() * hirajoshi.length)];

            // Koto plucking sound: fast attack, rich harmonics, sharp damping
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc2.type = "sine";
            osc.frequency.setValueAtTime(note, now);
            osc2.frequency.setValueAtTime(note * 2.0, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ambientGain);

            osc.start(now);
            osc2.start(now);
            osc.stop(now + 3.0);
            osc2.stop(now + 3.0);
        };

        // Play occasional gentle koto notes every 3 - 6 seconds
        const scheduleNextNote = () => {
            playKotoNote();
            const nextDelay = 3000 + Math.random() * 3500;
            this.ambientInterval = setTimeout(scheduleNextNote, nextDelay);
        };

        scheduleNextNote();
        this.ambientPlaying = true;
    }
}

// Global instance
window.soundEngine = new SoundEngine();
