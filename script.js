document.addEventListener("DOMContentLoaded", () => {
  // =================================================================
  // DOM Elements
  // =================================================================
  const mappingContainer = document.getElementById("sample-container");
  const saveButton = document.getElementById("save-button");
  const resetButton = document.getElementById("reset-button");
  const overlay = document.getElementById("audio-unlock-overlay");
  const appContainer = document.getElementById("app-container"); // Changed from mainContent
  const burgerMenu = document.getElementById("burger-menu");
  const dropdownMenu = document.getElementById("dropdown-menu");

  // =================================================================
  // Constants
  // =================================================================
  const MIDI_NOTE_ON = 144;
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 120;
  const AVAILABLE_SAMPLES = [
    "909 Kick_long.flac",
    "909 Snare 1.flac",
    "909 Hat_closed.flac",
    "909 Hat_open.flac",
    "909 Clap.flac",
    "909 Crash.flac",
    "909 Kick_short.flac",
    "909 Ride.flac",
    "909 Rim.flac",
    "909 Snare 2.flac",
    "909 Tom_hi.flac",
    "909 Tom_lo.flac",
    "909 Tom_mid.flac",
  ];
  const DEFAULT_MAPPINGS = {
    60: "909 Kick_long.flac",
    62: "909 Snare 1.flac",
    64: "909 Hat_closed.flac",
    65: "909 Hat_open.flac",
  };

  // =================================================================
  // State Management
  // =================================================================
  const appState = {
    audioContext: null,
    mappings: { ...DEFAULT_MAPPINGS },
    decodedSamples: {},
    playingSources: [],
    colors: {},
  };

  // =================================================================
  // App Initialization
  // =================================================================
  async function initializeApp() {
    appState.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    loadMappings();
    loadColors();
    await createMappingUI();
    setupEventListeners();
    setupMIDI();
    requestAnimationFrame(visualizationLoop);
  }

  function setupEventListeners() {
    saveButton.addEventListener("click", handleSave);
    resetButton.addEventListener("click", handleReset);
    burgerMenu.addEventListener("click", toggleMenu);
    window.addEventListener("click", handleWindowClick);
  }

  function loadColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    appState.colors = {
      waveform: rootStyles.getPropertyValue("--color-waveform").trim(),
      playhead: rootStyles.getPropertyValue("--color-playhead").trim(),
    };
  }

  // =================================================================
  // State Persistence
  // =================================================================
  function loadMappings() {
    const savedMappings = localStorage.getItem("midiSamplerMappings");
    appState.mappings = savedMappings
      ? JSON.parse(savedMappings)
      : { ...DEFAULT_MAPPINGS };
  }

  function saveMappings() {
    localStorage.setItem(
      "midiSamplerMappings",
      JSON.stringify(appState.mappings)
    );
  }

  // =================================================================
  // UI Handling
  // =================================================================
  async function createMappingUI() {
    mappingContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const loadPromises = [];

    for (const note in appState.mappings) {
      const sampleFile = appState.mappings[note];
      const item = createSampleItem(note, sampleFile);
      fragment.appendChild(item);

      const canvas = item.querySelector(".waveform-canvas");
      const loadPromise = getAudioBuffer(sampleFile).then((buffer) => {
        if (buffer) {
          drawWaveform(canvas, buffer);
        }
      });
      loadPromises.push(loadPromise);
    }

    mappingContainer.appendChild(fragment);
    await Promise.all(loadPromises);
  }

  function createSampleItem(note, sampleFile) {
    const item = document.createElement("div");
    item.className = "sample-item";
    item.dataset.note = note;

    item.innerHTML = `
      <div class="waveform">
        <canvas class="waveform-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
      </div>
      <div class="sample-settings hidden">
        <div>
          <label>Note: </label>
          <input type="number" class="note-input" value="${note}">
        </div>
        <div>
          <label>Sample: </label>
          <select class="sample-select">
            ${AVAILABLE_SAMPLES.map(
              (file) =>
                `<option value="${file}" ${file === sampleFile ? "selected" : ""}>${file}</option>`
            ).join("")}
          </select>
        </div>
      </div>
    `;

    item.querySelector(".waveform").addEventListener("click", () => {
      item.querySelector(".sample-settings").classList.toggle("hidden");
    });

    // --- Event Listeners for immediate updates ---

    const noteInput = item.querySelector(".note-input");
    const sampleSelect = item.querySelector(".sample-select");

    noteInput.addEventListener("change", (e) => {
      const oldNote = item.dataset.note;
      const newNote = e.target.value;
      const sample = sampleSelect.value;

      if (newNote && oldNote !== newNote) {
        // Update mapping state
        delete appState.mappings[oldNote];
        appState.mappings[newNote] = sample;
        item.dataset.note = newNote; // Update data attribute for future changes
        saveMappings();
      } else {
        // Revert if input is empty or same
        e.target.value = oldNote;
      }
    });

    sampleSelect.addEventListener("change", async (e) => {
      const note = item.dataset.note;
      const newSampleFile = e.target.value;

      // Update mapping state
      appState.mappings[note] = newSampleFile;
      saveMappings();

      // Redraw waveform
      const canvas = item.querySelector(".waveform-canvas");
      const buffer = await getAudioBuffer(newSampleFile);
      if (buffer) {
        drawWaveform(canvas, buffer);
      }
    });
    // --- End of Event Listeners ---

    return item;
  }

  function handleSave() {
    const newMappings = {};
    document.querySelectorAll(".sample-item").forEach((item) => {
      const note = item.querySelector(".note-input").value;
      const sample = item.querySelector(".sample-select").value;
      if (note) {
        newMappings[note] = sample;
      }
    });
    // The state is now updated in real-time, so we just need to save.
    // appState.mappings = newMappings;
    saveMappings();
    // createMappingUI(); // No need to re-render the whole UI
    alert("Mappings saved!");
  }

  async function handleReset() {
    if (confirm("Reset to default mappings?")) {
      appState.mappings = { ...DEFAULT_MAPPINGS };
      saveMappings();
      await createMappingUI(); // Re-render UI
    }
  }

  function toggleMenu() {
    dropdownMenu.classList.toggle("hidden");
  }

  function handleWindowClick(event) {
    if (
      !burgerMenu.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.classList.add("hidden");
    }
  }

  // =================================================================
  // Audio Handling
  // =================================================================
  async function getAudioBuffer(fileName) {
    if (appState.decodedSamples[fileName]) {
      return appState.decodedSamples[fileName];
    }
    try {
      const response = await fetch(`samples/${fileName}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await appState.audioContext.decodeAudioData(arrayBuffer);
      appState.decodedSamples[fileName] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.error(`Error decoding audio file: ${fileName}`, e);
      return null;
    }
  }

  async function playSound(note) {
    const sampleFile = appState.mappings[note];
    if (!sampleFile) return;

    const buffer = await getAudioBuffer(sampleFile);
    if (!buffer || !appState.audioContext) return;

    const source = appState.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(appState.audioContext.destination);
    source.start(0);

    const canvas = document.querySelector(
      `.sample-item[data-note='${note}'] .waveform-canvas`
    );
    appState.playingSources.push({
      startTime: appState.audioContext.currentTime,
      duration: buffer.duration,
      canvas: canvas,
      note: note,
    });
  }

  // =================================================================
  // Visualization
  // =================================================================
  function drawWaveform(
    canvas,
    buffer,
    color = appState.colors.waveform,
    clear = true
  ) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    if (clear) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  }

  function visualizationLoop() {
    // Clear finished sources
    appState.playingSources = appState.playingSources.filter((sourceInfo) => {
      const elapsedTime =
        appState.audioContext.currentTime - sourceInfo.startTime;
      if (elapsedTime >= sourceInfo.duration) {
        // Redraw the original waveform to clear the playhead
        const sampleFile = appState.mappings[sourceInfo.note];
        const buffer = appState.decodedSamples[sampleFile]; // Already loaded
        if (buffer) {
          drawWaveform(sourceInfo.canvas, buffer); // Redraw with clear
        }
        return false; // Remove from array
      }
      return true;
    });

    // Draw visualizations for active sources
    appState.playingSources.forEach((sourceInfo) => {
      const elapsedTime =
        appState.audioContext.currentTime - sourceInfo.startTime;
      const progress = Math.min(elapsedTime / sourceInfo.duration, 1.0);
      const ctx = sourceInfo.canvas.getContext("2d");
      const x = progress * sourceInfo.canvas.width;

      // 1. Calculate background color based on progress (fade from white to black)
      const colorValue = Math.floor(255 * (1 - progress));
      ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
      ctx.fillRect(0, 0, sourceInfo.canvas.width, sourceInfo.canvas.height);

      // 2. Redraw waveform on top of the new background
      const sampleFile = appState.mappings[sourceInfo.note];
      const buffer = appState.decodedSamples[sampleFile];
      if (buffer) {
        drawWaveform(
          sourceInfo.canvas,
          buffer,
          appState.colors.waveform,
          false
        ); // Don't clear
      }

      // 3. Draw playhead
      ctx.strokeStyle = appState.colors.playhead;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sourceInfo.canvas.height);
      ctx.stroke();
    });

    requestAnimationFrame(visualizationLoop);
  }

  // =================================================================
  // MIDI Handling
  // =================================================================
  function setupMIDI() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      console.warn("Web MIDI API is not supported in this browser.");
    }
  }

  function onMIDISuccess(midiAccess) {
    for (let input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
    }
  }

  function onMIDIFailure() {
    console.warn("Failed to access MIDI devices.");
  }

  function getMIDIMessage(message) {
    const [command, note, velocity] = message.data;
    if (command === MIDI_NOTE_ON && velocity > 0) {
      playSound(note);
    }
  }

  // =================================================================
  // App Start
  // =================================================================
  overlay.addEventListener(
    "click",
    () => {
      overlay.classList.add("hidden");
      appContainer.classList.remove("hidden");
      initializeApp();
    },
    { once: true }
  );
});
