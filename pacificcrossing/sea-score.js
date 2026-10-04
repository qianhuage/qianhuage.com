const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const scenes = {
  blue: {
    name: "blue hour",
    file: "score-blue-hour-0178",
    caption: "a pale horizon, a slow phrase",
    base: 18,
    root: 45,
  },
  swell: {
    name: "open swell",
    file: "score-open-swell",
    caption: "white water, gathering voices",
    base: 47,
    root: 40,
  },
  glass: {
    name: "glass water",
    file: "score-glass-water",
    caption: "small ripples, light touches",
    base: 82,
    root: 57,
  },
};
const signals = [
  ["arrival", "01", "Passing crests", "Rhythm"],
  ["length", "02", "Crest spacing", "Pitch"],
  ["height", "03", "Surface relief", "Layers"],
  ["colour", "04", "Sea colour", "Instrument"],
  ["direction", "05", "Surface drift", "Stereo"],
];

export function createSeaScore() {
  const section = document.createElement("section");
  section.className = "sea-score";
  section.id = "sea-score";
  section.setAttribute("aria-labelledby", "sea-score-title");
  section.innerHTML = `
    <div class="sea-score-heading"><div><span class="sea-score-eyebrow">MOTION → MUSIC</span><h3 id="sea-score-title">a score for the water.</h3></div><button class="sea-listen" type="button" aria-pressed="false"><span aria-hidden="true">▶</span> Listen</button></div>
    <p class="sea-score-intro">choose a sea. listen to its movement.</p>
    <div class="sea-scenes" role="group" aria-label="Choose a sea">${Object.entries(
      scenes,
    )
      .map(
        ([key, scene], i) =>
          `<button type="button" class="sea-scene" data-scene="${key}" aria-pressed="${key === "blue"}" aria-label="${scene.name}"><span><small>0${i + 1}</small>${scene.name}<i aria-hidden="true">↗</i></span></button>`,
      )
      .join("")}</div>
    <div class="sea-surface"><video muted playsinline loop preload="none" aria-label="Ocean footage used for the musical study"></video><canvas aria-hidden="true"></canvas><div class="sea-frame-label"><span>READING THE SURFACE</span><span class="sea-frame-state">STILL FRAME</span></div><div class="sea-frame-footer"><span class="sea-scene-caption"></span><span class="sea-note" aria-hidden="true">sound off</span></div></div>
    <div class="sea-patch"><div class="sea-patch-heading"><span>PATCH 01 / SEA → SIGNAL</span><span class="sea-patch-clock">FRAME 0000</span></div><dl class="sea-signals" aria-label="How the picture becomes music">${signals.map(([key, n, label, mapping]) => `<div class="sea-signal" data-signal="${key}"><dt><span>${n}</span>${label}</dt><dd><span class="sea-result" data-value="${key}">—</span><span class="sea-bar" aria-hidden="true"><i></i></span><span class="sea-mapping">↳ ${mapping}</span></dd></div>`).join("")}</dl><canvas class="sea-patch-canvas" role="img" aria-label="Live signal patch: image differences, crest geometry and colour feed a smoothed state, then a note sequencer and stereo synthesizer. The output scope displays the generated sound."></canvas></div><p class="sea-score-status" role="status"></p>`;
  const film = section.querySelector("video");
  film.muted = true;
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  let filmVisible = false;
  function previewAllowed() {
    return (
      filmVisible &&
      !document.hidden &&
      !motionPreference.matches &&
      !navigator.connection?.saveData &&
      !document.querySelector("#media-dialog[open]")
    );
  }
  function playPreview() {
    if (previewAllowed()) film.play().catch(() => {});
  }
  const canvas = section.querySelector("canvas"),
    context = canvas.getContext("2d");
  const probe = document.createElement("canvas");
  probe.width = 96;
  probe.height = 54;
  const pixels = probe.getContext("2d", { willReadFrequently: true });
  const button = section.querySelector(".sea-listen"),
    status = section.querySelector(".sea-score-status");
  const note = section.querySelector(".sea-note"),
    frameState = section.querySelector(".sea-frame-state");
  let sceneKey = "blue",
    generation = 0;
  let state = {
    arrival: 4,
    length: 110,
    height: 1.6,
    colour: 18,
    direction: 0,
  };
  const volume = 0.38;
  let audio, master, bus, reverb, wet, limiter, scope, brushNoise;
  const outputLevel = () => volume * (sceneKey === "blue" ? 0.95 : 0.42);
  const scopeData = new Float32Array(512);
  const patch = section.querySelector(".sea-patch-canvas"),
    ink = patch.getContext("2d");
  let patchWidth = 1,
    patchHeight = 1;
  let playing = false,
    starting = false,
    visible = false;
  let width = 1,
    height = 1,
    frame,
    previousTime = 0,
    phase = 0,
    waveNumber = 0,
    glow = 0;
  let lastSample = -1,
    lastVideoTime = -1,
    previousPixels = null,
    traces = [],
    spacing = 9,
    sampleColour = [115, 135, 149],
    motion = 0;
  const active = new Set();
  const scales = [
    [0, 3, 5, 7, 10],
    [0, 2, 5, 7, 9],
    [0, 2, 4, 7, 9],
  ];
  const instrumentNames = ["soft strings", "glass bells", "bright plucks"];
  const voice = () => Math.min(2, Math.floor(state.colour / 34));
  const ensembleSize = () =>
    sceneKey === "blue"
      ? 3
      : sceneKey === "swell"
        ? state.height > 2
          ? 8
          : 6
        : state.height > 2.7
          ? 3
          : state.height > 1.8
            ? 2
            : 1;
  const timbre = () =>
    sceneKey === "blue"
      ? "piano / bass / brushes"
      : sceneKey === "swell"
        ? "strings / brass"
        : instrumentNames[voice()];
  const pitchNames = [
    "C",
    "C♯",
    "D",
    "E♭",
    "E",
    "F",
    "F♯",
    "G",
    "A♭",
    "A",
    "B♭",
    "B",
  ];
  function pitchName(midi) {
    return `${pitchNames[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }
  const basePitch = () =>
    Math.round(scenes[sceneKey].root + (110 - state.length) / 12);
  function sync() {
    const layers = ensembleSize();
    const values = {
      arrival: `${state.arrival.toFixed(1)} s`,
      length: pitchName(basePitch()),
      height: `${layers} ${layers === 1 ? "voice" : "voices"}`,
      colour: timbre(),
      direction:
        Math.abs(state.direction) < 6
          ? "centred"
          : `${state.direction < 0 ? "←" : "→"} ${Math.round((Math.abs(state.direction) / 70) * 100)}%`,
    };
    const levels = {
      arrival: (8 - state.arrival) / 6.5,
      length: (state.length - 30) / 150,
      height: state.height / 4,
      colour: state.colour / 100,
      direction: (state.direction + 70) / 140,
    };
    for (const [key, value] of Object.entries(values)) {
      section.querySelector(`[data-value="${key}"]`).textContent = value;
      section
        .querySelector(`[data-signal="${key}"]`)
        .style.setProperty("--signal", `${clamp(levels[key], 0.03, 1) * 100}%`);
    }
  }
  // These are screen-space proxies. No monocular pixel measurement is reported as metres.
  function analyse(source, temporal) {
    if (!pixels) return;
    try {
      pixels.drawImage(source, 0, 0, 96, 54);
    } catch {
      return;
    }
    const rgba = pixels.getImageData(0, 0, 96, 54).data,
      luminance = new Float32Array(96 * 54);
    let red = 0,
      green = 0,
      blue = 0,
      total = 0,
      contrast = 0;
    for (let y = 0; y < 54; y++)
      for (let x = 0; x < 96; x++) {
        const i = y * 96 + x,
          k = i * 4;
        luminance[i] =
          rgba[k] * 0.2126 + rgba[k + 1] * 0.7152 + rgba[k + 2] * 0.0722;
        if (y >= 22 && y <= 47 && x >= 12 && x <= 84) {
          red += rgba[k];
          green += rgba[k + 1];
          blue += rgba[k + 2];
          total++;
          if (y > 22) contrast += Math.abs(luminance[i] - luminance[i - 96]);
        }
      }
    sampleColour = [red, green, blue].map((v) => Math.round(v / total));
    const profile = [];
    for (let y = 23; y < 47; y++) {
      let strength = 0;
      for (let x = 12; x < 85; x++)
        strength += Math.abs(
          luminance[y * 96 + x] - luminance[(y - 1) * 96 + x],
        );
      profile.push({ y, strength: strength / 73 });
    }
    const peaks = [];
    for (const point of [...profile].sort((a, b) => b.strength - a.strength))
      if (peaks.every((p) => Math.abs(p.y - point.y) > 5)) {
        peaks.push(point);
        if (peaks.length === 3) break;
      }
    peaks.sort((a, b) => a.y - b.y);
    spacing =
      peaks.length > 1 ? (peaks.at(-1).y - peaks[0].y) / (peaks.length - 1) : 9;
    traces = peaks.map((peak) => {
      let last = peak.y;
      return Array.from({ length: 37 }, (_, j) => {
        const x = 12 + j * 2;
        let best = last,
          score = -Infinity;
        for (
          let y = Math.max(22, Math.round(last) - 2);
          y <= Math.min(48, Math.round(last) + 2);
          y++
        ) {
          const strength =
            Math.abs(luminance[y * 96 + x] - luminance[(y - 1) * 96 + x]) -
            0.8 * Math.abs(y - peak.y);
          if (strength > score) {
            score = strength;
            best = y;
          }
        }
        last = last * 0.58 + best * 0.42;
        return [x / 96, last / 54];
      });
    });
    let drift = state.direction;
    if (temporal && previousPixels) {
      let bestError = Infinity,
        dxBest = 0,
        dyBest = 0;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          let error = 0;
          for (let y = 24; y < 46; y += 2)
            for (let x = 16; x < 82; x += 2)
              error += Math.abs(
                luminance[y * 96 + x] - previousPixels[(y - dy) * 96 + x - dx],
              );
          if (error < bestError) {
            bestError = error;
            dxBest = dx;
            dyBest = dy;
          }
        }
      let difference = 0;
      for (let y = 24; y < 46; y += 2)
        for (let x = 16; x < 82; x += 2)
          difference += Math.abs(
            luminance[y * 96 + x] - previousPixels[y * 96 + x],
          );
      motion = clamp(difference / (11 * 33) / 32, 0, 1);
      drift = clamp(dxBest * 27 + dyBest * 6, -70, 70);
    }
    if (temporal) previousPixels = luminance;
    const relief = clamp(contrast / total / 32 + motion * 0.4, 0, 1);
    const targets = {
      arrival:
        sceneKey === "blue"
          ? clamp(5.8 - motion * 0.8 - relief * 0.4, 4.6, 5.8)
          : clamp(6.8 - motion * 4.8 - relief, 1.5, 8),
      length: clamp(spacing * 10, 30, 180),
      height: clamp(0.4 + relief * 3.6, 0.3, 4),
      colour: clamp(
        scenes[sceneKey].base + (sampleColour[0] - sampleColour[2]) * 0.18,
        0,
        100,
      ),
      direction: drift,
    };
    for (const key of Object.keys(state))
      state[key] += (targets[key] - state[key]) * (temporal ? 0.24 : 1);
    sync();
    draw();
  }
  async function choose(key) {
    const id = ++generation;
    releaseVoices(0.25);
    sceneKey = key;
    if (master && playing)
      master.gain.setTargetAtTime(outputLevel(), audio.currentTime, 0.3);
    if (wet)
      wet.gain.setTargetAtTime(
        key === "swell" ? 0.46 : key === "blue" ? 0.3 : 0.28,
        audio.currentTime,
        0.25,
      );
    film.pause();
    previousPixels = null;
    lastSample = -1;
    lastVideoTime = -1;
    phase = 0;
    waveNumber = 0;
    section
      .querySelectorAll("[data-scene]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.scene === key)),
      );
    section.querySelector(".sea-scene-caption").textContent =
      scenes[key].caption;
    frameState.textContent = playing ? "LIVE FRAME" : "STILL FRAME";
    const source = `./media/${scenes[key].file}`;
    film.poster = source + ".jpg";
    film.src = source + ".mp4";
    film.load();
    const poster = new Image();
    poster.src = film.poster;
    poster.onload = () => {
      if (id === generation && !playing) analyse(poster, false);
    };
    if (playing) {
      try {
        await film.play();
        if (id === generation) {
          status.textContent = `Listening to ${scenes[key].name}.`;
          crest();
          wake();
        }
      } catch {
        if (id === generation)
          stop("Unable to play this scene. Choose another sea.");
      }
    } else playPreview();
  }
  section
    .querySelectorAll("[data-scene]")
    .forEach((el) =>
      el.addEventListener("click", () => choose(el.dataset.scene)),
    );
  function makeAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("Web Audio unavailable");
    audio = new Audio();
    master = audio.createGain();
    master.gain.value = 0;
    bus = audio.createGain();
    bus.gain.value = 0.7;
    limiter = audio.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 18;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.3;
    reverb = audio.createConvolver();
    const impulse = audio.createBuffer(
      2,
      Math.floor(audio.sampleRate * 3),
      audio.sampleRate,
    );
    let seed = 9417;
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 16807) % 2147483647;
        samples[i] =
          ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / samples.length, 3.2);
      }
    }
    reverb.buffer = impulse;
    wet = audio.createGain();
    wet.gain.value =
      sceneKey === "swell" ? 0.46 : sceneKey === "blue" ? 0.3 : 0.28;
    bus.connect(limiter);
    bus.connect(reverb);
    reverb.connect(wet);
    wet.connect(limiter);
    limiter.connect(master);
    scope = audio.createAnalyser();
    scope.fftSize = 512;
    master.connect(scope);
    scope.connect(audio.destination);
    audio.addEventListener("statechange", () => {
      if (playing && audio.state !== "running")
        stop("Paused. Press Listen to return.");
    });
  }
  function playTone(midi, at, amplitude, pan, colour) {
    const duration = colour === 0 ? 5.8 : colour === 1 ? 4.4 : 2.8;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const oscillator = audio.createOscillator();
    const overtone = audio.createOscillator();
    const overtoneGain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const envelope = audio.createGain();
    const stereo = audio.createStereoPanner();
    oscillator.type = colour === 0 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    overtone.type = "sine";
    overtone.frequency.value = frequency * (colour === 1 ? 2.006 : 2);
    overtoneGain.gain.value = colour === 0 ? 0.09 : colour === 1 ? 0.3 : 0.13;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(colour === 0 ? 950 : 3400, at);
    filter.frequency.exponentialRampToValueAtTime(
      colour === 2 ? 450 : 750,
      at + duration,
    );
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(
      amplitude,
      at + (colour === 0 ? 0.7 : 0.025),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    stereo.pan.setValueAtTime(clamp(pan - 0.12, -1, 1), at);
    stereo.pan.linearRampToValueAtTime(clamp(pan + 0.12, -1, 1), at + duration);
    oscillator.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(envelope);
    envelope.connect(stereo);
    stereo.connect(bus);
    const record = {
      oscillator,
      overtone,
      envelope,
      nodes: [oscillator, overtone, overtoneGain, filter, envelope, stereo],
    };
    active.add(record);
    oscillator.onended = () => {
      for (const node of record.nodes) node.disconnect();
      active.delete(record);
    };
    oscillator.start(at);
    overtone.start(at);
    oscillator.stop(at + duration + 0.05);
    overtone.stop(at + duration + 0.05);
  }
  // A bowed ensemble and soft brass choir; the quiet scenes keep their plucked voices.
  function orchestralTone(midi, at, duration, level, pan, family = "strings") {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const filter = audio.createBiquadFilter();
    const envelope = audio.createGain();
    const stereo = audio.createStereoPanner();
    const count = family === "bass" ? 2 : 3;
    const oscillators = Array.from({ length: count }, (_, i) => {
      const oscillator = audio.createOscillator();
      oscillator.type =
        family === "bass"
          ? "triangle"
          : family === "brass" || i !== 1
            ? "sawtooth"
            : "triangle";
      oscillator.frequency.setValueAtTime(frequency, at);
      oscillator.detune.setValueAtTime(
        (i - (count - 1) / 2) * (family === "brass" ? 4 : 8),
        at,
      );
      oscillator.connect(filter);
      return oscillator;
    });
    const attack = family === "brass" ? 1.4 : family === "bass" ? 0.65 : 1.05;
    filter.type = "lowpass";
    filter.Q.value = 0.45;
    filter.frequency.setValueAtTime(family === "bass" ? 240 : 550, at);
    filter.frequency.exponentialRampToValueAtTime(
      family === "bass"
        ? 420
        : family === "brass"
          ? 1500
          : 2100 + state.colour * 5,
      at + attack + 1,
    );
    filter.frequency.exponentialRampToValueAtTime(
      family === "bass" ? 180 : 450,
      at + duration,
    );
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level / count, at + attack);
    envelope.gain.linearRampToValueAtTime(
      (level * 0.74) / count,
      at + duration * 0.55,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    stereo.pan.value = clamp(pan, -0.9, 0.9);
    filter.connect(envelope);
    envelope.connect(stereo);
    stereo.connect(bus);
    const record = {
      oscillators,
      envelope,
      nodes: [...oscillators, filter, envelope, stereo],
    };
    active.add(record);
    oscillators[0].onended = () => {
      record.nodes.forEach((node) => node.disconnect());
      active.delete(record);
    };
    for (const oscillator of oscillators) {
      oscillator.start(at);
      oscillator.stop(at + duration + 0.08);
    }
  }
  // Piano / upright-style bass / brushes. One amplitude envelope per note;
  // only upper partials darken independently, preserving the fundamental's body.
  function jazzTone(midi, at, duration, level, pan, family = "piano") {
    const bass = family === "bass";
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const envelope = audio.createGain(),
      filter = audio.createBiquadFilter(),
      stereo = audio.createStereoPanner();
    const partials = bass
      ? [[1, 0.68], [2, 0.24], [3, 0.09], [4, 0.035]]
      : [[1, 0.72], [2.002, 0.23], [3.006, 0.1], [4.014, 0.045], [5.025, 0.018]];
    const nodes = [envelope, filter, stereo], oscillators = [];
    partials.forEach(([ratio, weight], i) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency * ratio, at);
      gain.gain.setValueAtTime(weight, at);
      if (i > 0)
        gain.gain.exponentialRampToValueAtTime(weight * 0.06, at + duration / (1 + i * 0.3));
      oscillator.connect(gain);
      gain.connect(filter);
      nodes.push(oscillator, gain);
      oscillators.push(oscillator);
    });
    filter.type = "lowpass";
    filter.Q.value = 0.35;
    filter.frequency.setValueAtTime(bass ? 1100 : 3200 + state.colour * 10, at);
    filter.frequency.exponentialRampToValueAtTime(bass ? 420 : 1100, at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + (bass ? 0.018 : 0.008));
    envelope.gain.exponentialRampToValueAtTime(level * 0.36, at + duration * 0.34);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    stereo.pan.value = clamp(pan, -0.75, 0.75);
    filter.connect(envelope);
    envelope.connect(stereo);
    stereo.connect(bus);
    const record = { oscillators, envelope, nodes };
    active.add(record);
    oscillators[0].onended = () => {
      nodes.forEach((node) => node.disconnect());
      active.delete(record);
    };
    for (const oscillator of oscillators) {
      oscillator.start(at);
      oscillator.stop(at + duration + 0.06);
    }
  }
  function jazzBrush(at, duration, level, sweep = false) {
    if (!brushNoise) {
      brushNoise = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      const samples = brushNoise.getChannelData(0);
      let seed = 1709;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 16807) % 2147483647;
        samples[i] = (seed / 2147483647) * 2 - 1;
      }
    }
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(),
      envelope = audio.createGain(), stereo = audio.createStereoPanner();
    source.buffer = brushNoise;
    source.loop = true;
    filter.type = "bandpass";
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(sweep ? 2200 : 4200, at);
    filter.frequency.exponentialRampToValueAtTime(sweep ? 950 : 2800, at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + (sweep ? duration * 0.3 : 0.012));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    stereo.pan.value = 0.3;
    source.connect(filter); filter.connect(envelope); envelope.connect(stereo); stereo.connect(bus);
    const nodes = [source, filter, envelope, stereo];
    const record = { oscillators: [source], envelope, nodes };
    active.add(record);
    source.onended = () => { nodes.forEach((node) => node.disconnect()); active.delete(record); };
    source.start(at); source.stop(at + duration + 0.03);
  }
  function bluePhrase() {
    const now = audio.currentTime + 0.02;
    // Dm9 / B-flat maj9 / Gm9 / A7sus: unresolved, descending piano answers.
    const changes = [
      { bass: 38, keys: [53, 60, 64, 69], melody: [76, 74, 69] },
      { bass: 34, keys: [53, 57, 60, 65], melody: [72, 69, 65] },
      { bass: 43, keys: [53, 57, 58, 62], melody: [69, 67, 62] },
      { bass: 33, keys: [55, 58, 62, 64], melody: [70, 69, 64] },
    ];
    const phrase = changes[Math.floor(waveNumber / 2) % changes.length];
    const span = clamp(state.arrival, 4.6, 5.8), beat = span / 4;
    const drift = (state.direction / 70) * 0.12;
    const lift = clamp(state.height / 4, 0, 1);
    jazzTone(phrase.bass, now, 3.3, 0.44, -0.12, "bass");
    jazzTone(phrase.bass + (waveNumber % 2 ? 12 : 7), now + beat * 2.15, 2.7, 0.3, -0.12, "bass");
    phrase.keys.forEach((midi, i) =>
      jazzTone(midi, now + 0.06 + i * 0.038, 5.8, (0.2 - i * 0.018) * (0.9 + lift * 0.2), -0.28 + drift),
    );
    const melody = phrase.melody[waveNumber % 2];
    jazzTone(melody, now + beat * 1.2, 4.4, 0.26, 0.1 + drift);
    jazzTone(phrase.melody[2], now + beat * 2.85, 3.6, 0.19, 0.12 + drift);
    // A loose brush pulse, with longer circular strokes on the backbeats.
    for (let i = 0; i < 4; i++) {
      jazzBrush(now + beat * i + (i % 2 ? 0.045 : 0), beat * 0.75, i % 2 ? 0.075 : 0.04, i % 2 === 1);
      if (i % 2 === 0) jazzBrush(now + beat * (i + 0.64), 0.16, 0.025);
    }
    note.textContent = `${pitchName(melody)} · piano / bass / brushes · minor ninths`;
  }

  function swellPhrase() {
    const now = audio.currentTime + 0.02;
    const progression = [
      [0, 3, 7, 14],
      [-4, 0, 3, 10],
      [3, 7, 10, 14],
      [-2, 2, 5, 9],
    ];
    const chord = progression[Math.floor(waveNumber / 2) % progression.length];
    const tide = clamp(state.height / 4, 0, 1),
      drift = (state.direction / 70) * 0.16;
    // Harmonic changes span two crests, leaving room for a long attack and release.
    if (waveNumber % 2 === 0) {
      const duration = clamp(state.arrival * 2 + 3, 7, 13);
      orchestralTone(40 + chord[0], now, duration, 0.19, 0, "bass");
      chord.forEach((interval, i) =>
        orchestralTone(
          52 + interval,
          now + i * 0.07,
          duration,
          0.115 + tide * 0.03,
          [-0.72, -0.28, 0.28, 0.72][i] + drift,
        ),
      );
      if (ensembleSize() === 8) {
        orchestralTone(
          52 + chord[0],
          now + 0.3,
          duration - 0.4,
          0.085,
          -0.4 + drift,
          "brass",
        );
        orchestralTone(
          52 + chord[2],
          now + 0.42,
          duration - 0.5,
          0.07,
          0.4 + drift,
          "brass",
        );
      }
    }
    const melody = [0, 3, 7, 10, 14];
    const degree =
      (Math.round((180 - state.length) / 40) + waveNumber) % melody.length;
    const midi = 64 + melody[Math.max(0, degree)];
    orchestralTone(
      midi,
      now + 0.16,
      5.8,
      0.085,
      drift + Math.sin(waveNumber * 0.7) * 0.55,
    );
    note.textContent = `${pitchName(midi)} · strings / brass · ${ensembleSize()} voices`;
  }
  function releaseVoices(seconds = 0.3) {
    if (!audio) return;
    for (const record of active) {
      if (record.envelope) {
        record.envelope.gain.cancelAndHoldAtTime(audio.currentTime);
        record.envelope.gain.setTargetAtTime(
          0.0001,
          audio.currentTime,
          seconds / 4,
        );
      }
      for (const oscillator of record.oscillators || [
        record.oscillator,
        record.overtone,
      ]) {
        try {
          oscillator.stop(audio.currentTime + seconds);
        } catch {}
      }
    }
  }

  function crest() {
    glow = 1;
    if (!playing || audio.state !== "running") return;
    if (sceneKey === "blue") {
      bluePhrase();
      return;
    }
    if (sceneKey === "swell") {
      swellPhrase();
      return;
    }
    const colour = voice();
    const root = basePitch();
    const degree = [0, 2, 1, 4, 2, 3, 1, 0][waveNumber % 8];
    const midi = root + scales[colour][degree];
    const layers = ensembleSize();
    const offsets = [0, 7, 12];
    const now = audio.currentTime + 0.015;
    for (let i = 0; i < layers; i++)
      playTone(
        midi + offsets[i],
        now + i * 0.085,
        (0.12 + state.height * 0.028) / Math.sqrt(layers),
        state.direction / 70,
        colour,
      );
    const pitches = [
      "C",
      "C♯",
      "D",
      "E♭",
      "E",
      "F",
      "F♯",
      "G",
      "A♭",
      "A",
      "B♭",
      "B",
    ];
    note.textContent = `${pitches[midi % 12]}${Math.floor(midi / 12) - 1} · ${instrumentNames[colour]} · ${layers} ${layers === 1 ? "voice" : "voices"}`;
  }
  function stop(message = "Sound paused.") {
    starting = false;
    playing = false;
    film.pause();
    if (audio) {
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(0, audio.currentTime, 0.035);
      releaseVoices(0.18);
      setTimeout(() => {
        if (!playing && !starting && audio.state === "running")
          audio.suspend().catch(() => {});
      }, 220);
    }
    button.innerHTML = '<span aria-hidden="true">▶</span> Listen';
    button.setAttribute("aria-pressed", "false");
    section.dataset.playing = "false";
    frameState.textContent = "STILL FRAME";
    status.textContent = message;
    draw();
  }
  button.addEventListener("click", async () => {
    if (playing || starting) return stop();
    starting = true;
    try {
      if (!audio) makeAudio();
      await audio.resume();
      if (!starting || !visible || document.hidden) return;
      document.querySelectorAll("video,audio").forEach((el) => {
        if (el !== film) el.pause();
      });
      await film.play();
      if (!starting || !visible || document.hidden) {
        film.pause();
        return;
      }
      playing = true;
      starting = false;
      phase = 0;
      waveNumber = 0;
      previousPixels = null;
      master.gain.setTargetAtTime(outputLevel(), audio.currentTime, 0.12);
      section.dataset.playing = "true";
      button.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
      button.setAttribute("aria-pressed", "true");
      frameState.textContent = "LIVE FRAME";
      status.textContent = `Listening to ${scenes[sceneKey].name}.`;
      crest();
      wake();
    } catch {
      stop("Playback is unavailable. Try Listen again.");
    }
  });
  film.addEventListener("loadeddata", () => {
    analyse(film, false);
  });
  film.addEventListener("play", () => {
    frameState.textContent = "LIVE FRAME";
    wake();
  });
  film.addEventListener("pause", () => {
    frameState.textContent = "STILL FRAME";
  });
  film.addEventListener("error", () => {
    if (playing || starting)
      stop("This scene could not load. Choose another sea.");
  });
  function draw() {
    drawPatch();
    if (!context || width < 2) return;
    context.clearRect(0, 0, width, height);
    const colour = "#eeeeee",
      font = Math.max(8, Math.min(10, width / 78));
    context.font = `${font}px monospace`;
    context.lineJoin = "round";
    function line(points, alpha = 0.7, dashed = false) {
      context.beginPath();
      points.forEach(([x, y], i) =>
        i
          ? context.lineTo(x * width, y * height)
          : context.moveTo(x * width, y * height),
      );
      context.strokeStyle = `rgba(235,235,235,${alpha})`;
      context.lineWidth = 1;
      context.setLineDash(dashed ? [4, 5] : []);
      context.stroke();
      context.setLineDash([]);
    }
    function label(text, x, y) {
      const m = context.measureText(text).width,
        px = clamp(x * width, 6, width - m - 6),
        py = y * height;
      context.fillStyle = "rgba(0,0,0,.75)";
      context.fillRect(px - 5, py - font - 4, m + 10, font + 10);
      context.fillStyle = colour;
      context.fillText(text, px, py);
    }
    for (let i = 0; i < traces.length; i++)
      line(traces[i], i === 1 ? 0.9 : 0.45);
    line(
      [
        [0.49, 0.32],
        [0.49, 0.9],
      ],
      0.45,
      true,
    );
    label("01 / PULSE", 0.5, 0.33);
    if (traces.length >= 2) {
      const a = traces[0][25][1],
        b = traces[1][25][1];
      line(
        [
          [0.68, a],
          [0.71, a],
          [0.71, b],
          [0.68, b],
        ],
        0.8,
      );
      label("02 / SPACING", 0.73, (a + b) / 2);
    }
    const ry = traces[1]?.[8]?.[1] || 0.6;
    line(
      [
        [0.18, ry - 0.04],
        [0.21, ry - 0.04],
        [0.21, ry + 0.04],
        [0.18, ry + 0.04],
      ],
      0.8,
    );
    label("03 / RELIEF", 0.13, Math.min(0.88, ry + 0.1));
    context.fillStyle = "#bcbcbc";
    context.fillRect(width * 0.77, height * 0.83, 12, 12);
    context.strokeStyle = colour;
    context.strokeRect(width * 0.77, height * 0.83, 12, 12);
    label("04 / COLOUR", 0.8, 0.85);
    const drift = state.direction / 70,
      ax = 0.3,
      ay = 0.86,
      bx = ax + drift * 0.12,
      by = ay - 0.035;
    line(
      [
        [ax, ay],
        [bx, by],
      ],
      0.9,
    );
    const angle = Math.atan2((by - ay) * height, (bx - ax) * width),
      size = 6;
    context.beginPath();
    context.moveTo(bx * width, by * height);
    context.lineTo(
      bx * width - size * Math.cos(angle - 0.55),
      by * height - size * Math.sin(angle - 0.55),
    );
    context.moveTo(bx * width, by * height);
    context.lineTo(
      bx * width - size * Math.cos(angle + 0.55),
      by * height - size * Math.sin(angle + 0.55),
    );
    context.stroke();
    label("05 / DRIFT", 0.27, 0.95);
    if (glow > 0.02) {
      context.beginPath();
      context.arc(
        width * 0.49,
        height * (traces[1]?.[18]?.[1] || 0.6),
        3 + 8 * (1 - glow),
        0,
        Math.PI * 2,
      );
      context.strokeStyle = `rgba(245,245,245,${glow})`;
      context.stroke();
    }
  }
  function drawPatch() {
    if (!ink || patchWidth < 2) return;
    const w = patchWidth,
      h = patchHeight,
      small = w < 440;
    ink.clearRect(0, 0, w, h);
    ink.fillStyle = "#262626";
    for (let x = 16; x < w; x += 20)
      for (let y = 10; y < h; y += 20) ink.fillRect(x, y, 1, 1);
    const nodeWidth = Math.min(152, w * 0.26),
      boxHeight = 42;
    const top = 25,
      middle = 108,
      bottom = 198,
      centre = w * 0.5;
    const nodes = [
      [
        w * 0.18,
        top,
        small ? "frame Δ" : "frame difference",
        motion.toFixed(3),
      ],
      [
        centre,
        top,
        small ? "crest field" : "crest geometry",
        spacing.toFixed(1) + " px",
      ],
      [
        w * 0.82,
        top,
        small ? "colour" : "colour vector",
        sampleColour.join(small ? "·" : " / "),
      ],
      [centre, middle, "state memory", "0.76x + 0.24u"],
      [
        w * 0.28,
        bottom,
        small ? "sequence" : "note sequencer",
        pitchName(basePitch()) + " · " + state.arrival.toFixed(1) + "s",
      ],
      [
        w * 0.72,
        bottom,
        small ? "synthesis" : "voice / stereo",
        String(ensembleSize()) + " voices",
      ],
    ];
    function cable(x1, y1, x2, y2, index) {
      ink.beginPath();
      ink.moveTo(x1, y1);
      const bend = (y1 + y2) / 2;
      ink.bezierCurveTo(x1, bend, x2, bend, x2, y2);
      ink.strokeStyle = "#555";
      ink.lineWidth = 0.8;
      ink.stroke();
      if (playing) {
        const t = (phase + index * 0.19) % 1,
          u = 1 - t;
        const x =
            u * u * u * x1 +
            3 * u * u * t * x1 +
            3 * u * t * t * x2 +
            t * t * t * x2,
          y =
            u * u * u * y1 +
            3 * u * u * t * bend +
            3 * u * t * t * bend +
            t * t * t * y2;
        ink.beginPath();
        ink.arc(x, y, 1.7, 0, Math.PI * 2);
        ink.fillStyle = "#eee";
        ink.fill();
      }
    }
    for (let i = 0; i < 3; i++)
      cable(
        nodes[i][0],
        top + boxHeight,
        centre + (i - 1) * nodeWidth * 0.3,
        middle,
        i,
      );
    cable(
      centre - nodeWidth * 0.22,
      middle + boxHeight,
      nodes[4][0],
      bottom,
      3,
    );
    cable(
      centre + nodeWidth * 0.22,
      middle + boxHeight,
      nodes[5][0],
      bottom,
      4,
    );
    cable(
      nodes[4][0] + nodeWidth / 2,
      bottom + 21,
      nodes[5][0] - nodeWidth / 2,
      bottom + 21,
      5,
    );
    // The return connection visualizes the state retained by the smoothing filter.
    const loopX = centre + nodeWidth * 0.86;
    ink.beginPath();
    ink.moveTo(centre + nodeWidth / 2, middle + 30);
    ink.lineTo(loopX, middle + 30);
    ink.lineTo(loopX, middle - 16);
    ink.lineTo(centre + nodeWidth * 0.3, middle - 16);
    ink.lineTo(centre + nodeWidth * 0.3, middle);
    ink.strokeStyle = "#888";
    ink.setLineDash([2, 4]);
    ink.stroke();
    ink.setLineDash([]);
    nodes.forEach(([x, y, title, value], i) => {
      ink.fillStyle = "#0c0c0c";
      ink.fillRect(x - nodeWidth / 2, y, nodeWidth, boxHeight);
      ink.strokeStyle = i === 3 ? "#aaa" : "#505050";
      ink.strokeRect(
        x - nodeWidth / 2 + 0.5,
        y + 0.5,
        nodeWidth - 1,
        boxHeight - 1,
      );
      ink.textAlign = "center";
      ink.fillStyle = "#eee";
      ink.font = `${small ? 9 : 10}px monospace`;
      ink.fillText(title, x, y + 16);
      ink.fillStyle = "#999";
      ink.font = `${small ? 8 : 9}px monospace`;
      ink.fillText(value, x, y + 31);
      ink.fillStyle = "#ddd";
      for (const portY of [y, y + boxHeight]) {
        ink.fillRect(x - 2, portY - 1, 4, 3);
      }
    });
    const scopeY = 282,
      scopeLeft = 22,
      scopeRight = w - 22;
    cable(nodes[5][0], bottom + boxHeight, nodes[5][0], scopeY - 8, 6);
    ink.textAlign = "left";
    ink.font = "8px monospace";
    ink.fillStyle = "#999";
    ink.fillText("AUDIO OUT", scopeLeft, scopeY - 9);
    ink.textAlign = "right";
    ink.fillText(playing ? "L / R · LIVE" : "L / R", scopeRight, scopeY - 9);
    ink.beginPath();
    ink.moveTo(scopeLeft, scopeY + 23);
    ink.lineTo(scopeRight, scopeY + 23);
    ink.strokeStyle = "#333";
    ink.stroke();
    if (scope && playing) scope.getFloatTimeDomainData(scopeData);
    else scopeData.fill(0);
    ink.beginPath();
    for (let i = 0; i < scopeData.length; i++) {
      const x =
          scopeLeft + (i / (scopeData.length - 1)) * (scopeRight - scopeLeft),
        y = scopeY + 23 - clamp(scopeData[i] * 1500, -22, 22);
      if (i) ink.lineTo(x, y);
      else ink.moveTo(x, y);
    }
    ink.strokeStyle = "#eee";
    ink.lineWidth = 1;
    ink.stroke();
    section.querySelector(".sea-patch-clock").textContent =
      `FRAME ${String(Math.floor(film.currentTime * 24) || 0).padStart(4, "0")}`;
  }

  function animate(now) {
    frame = null;
    if (film.paused || !visible || document.hidden) return;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.06) : 0;
    previousTime = now;
    if (!film.paused && film.readyState >= 2) {
      if (film.currentTime < lastVideoTime) previousPixels = null;
      if (now - lastSample > 125) {
        analyse(film, true);
        lastSample = now;
        lastVideoTime = film.currentTime;
      }
      if (playing) phase += dt / state.arrival;
      if (phase >= 1) {
        phase %= 1;
        waveNumber++;
        crest();
      }
    }
    glow *= Math.exp(-dt * 2.5);
    draw();
    frame = requestAnimationFrame(animate);
  }
  function wake() {
    if (!frame && !film.paused && visible && !document.hidden) {
      previousTime = 0;
      frame = requestAnimationFrame(animate);
    }
  }
  new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }).observe(canvas);
  new ResizeObserver(() => {
    const rect = patch.getBoundingClientRect();
    patchWidth = rect.width;
    patchHeight = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    patch.width = Math.round(patchWidth * ratio);
    patch.height = Math.round(patchHeight * ratio);
    ink?.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPatch();
  }).observe(patch);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && (playing || starting))
        stop("Paused while away. Press Listen to return.");
      else if (visible) wake();
    },
    { threshold: 0.06 },
  ).observe(section);
  new IntersectionObserver(
    ([entry]) => {
      filmVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      if (filmVisible) playPreview();
      else if (!playing && !starting) film.pause();
    },
    { threshold: [0, 0.2] },
  ).observe(film);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop("Paused while away. Press Listen to return.");
    else playPreview();
  });
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches && !playing) film.pause();
    else playPreview();
  });
  document
    .querySelector("#media-dialog")
    ?.addEventListener("close", playPreview);
  window.addEventListener("pagehide", () => stop());
  document.addEventListener(
    "play",
    (event) => {
      if (
        playing &&
        event.target !== film &&
        event.target instanceof HTMLMediaElement &&
        !event.target.muted
      )
        stop();
    },
    true,
  );
  choose("blue");
  sync();
  return section;
}
