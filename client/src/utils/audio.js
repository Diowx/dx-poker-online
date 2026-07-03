// Web Audio API Synthesizer for Poker game sounds.
// No external assets required. Self-contained audio synthesis.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playCardDeal = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create card rustle sound using white noise and bandpass filter
    const bufferSize = ctx.sampleRate * 0.15; // 0.15s
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
  } catch (e) {
    console.warn("Audio play blocked or failed: ", e);
  }
};

export const playChipBet = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Chips clinking sound: metallic bell-like frequencies
    const frequencies = [800, 1200, 2000, 2600];
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Slightly stagger start to simulate clinking
      const delay = idx * 0.01;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch (e) {
    console.warn("Audio play blocked or failed: ", e);
  }
};

export const playTimerAlert = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Apply lowpass filter to make it a dull pulse
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn("Audio play blocked or failed: ", e);
  }
};

export const playWinnerReveal = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play a nice major triad (C major: C4, E4, G4, C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const delay = idx * 0.08;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.8);
    });
  } catch (e) {
    console.warn("Audio play blocked or failed: ", e);
  }
};

export const playLobbyCountdownAlert = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // เสียงต๊อกแต๊กและระฆังเตือนเริ่มเกม (Rising Ding-Dong)
    const tones = [
      { freq: 587.33, duration: 0.15, delay: 0 },       // D5 note
      { freq: 880.00, duration: 0.35, delay: 0.12 }      // A5 note
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(tone.freq, now + tone.delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + tone.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tone.delay + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + tone.delay);
      osc.stop(now + tone.delay + tone.duration);
    });
  } catch (e) {
    console.warn("Audio play blocked or failed: ", e);
  }
};
