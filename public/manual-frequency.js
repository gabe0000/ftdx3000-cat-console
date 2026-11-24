const statusText = document.querySelector("#statusText");
const frequencyPreview = document.querySelector("#frequencyPreview");
const useCurrentButton = document.querySelector("#useCurrentButton");
const manualFrequencyForm = document.querySelector("#manualFrequencyForm");
const frequencyInput = document.querySelector("#frequencyInput");
const bandSelect = document.querySelector("#bandSelect");
const closeButton = document.querySelector("#closeButton");
const tuneButton = document.querySelector("#tuneButton");

let socket = null;
let latestState = null;
let bandProfiles = {};
let context = loadContext();

useCurrentButton.addEventListener("click", fillFromRadio);
manualFrequencyForm.addEventListener("submit", tuneFrequency);
closeButton.addEventListener("click", () => window.close());

await loadConfig();
fillFromContext(context.state ?? {});
connectWebSocket();

async function loadConfig() {
  const response = await fetch("/api/config");
  const config = await response.json();
  bandProfiles = config.bands ?? {};
  bandSelect.replaceChildren();
  for (const profile of Object.values(bandProfiles)) {
    bandSelect.append(new Option(profile.name, profile.id));
  }
  bandSelect.value = context.state?.bandId ?? config.defaultBandId ?? "10m";
}

function connectWebSocket() {
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/cat`);
  socket.addEventListener("open", () => setStatus("Linked"));
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "error") {
      setStatus(message.message);
      return;
    }
    if (message.type === "state") {
      latestState = message;
      if (Number.isInteger(message.hz)) {
        frequencyPreview.textContent = message.frequency ?? formatFrequency(message.hz);
      }
    }
  });
  socket.addEventListener("close", () => {
    setStatus("CAT link closed");
    setTimeout(connectWebSocket, 1200);
  });
}

function fillFromRadio() {
  const state = latestState ?? {};
  fillFromContext({
    bandId: state.band?.id ?? context.state?.bandId,
    hz: state.hz ?? context.state?.hz,
    frequency: state.frequency ?? context.state?.frequency,
    frequencyMhz: Number.isInteger(state.hz) ? hzToMhz(state.hz) : context.state?.frequencyMhz
  });
}

function fillFromContext(state = {}) {
  const hz = Number.isInteger(state.hz) ? state.hz : null;
  frequencyInput.value = state.frequencyMhz ?? (hz ? hzToMhz(hz) : "");
  frequencyPreview.textContent = state.frequency ?? (hz ? formatFrequency(hz) : "--.---.---");
  if (state.bandId && bandProfiles[state.bandId]) {
    bandSelect.value = state.bandId;
  }
}

function tuneFrequency(event) {
  event.preventDefault();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setStatus("CAT link not ready");
    return;
  }

  const hz = mhzToHz(frequencyInput.value);
  if (!Number.isInteger(hz)) {
    setStatus("Enter a valid MHz value");
    return;
  }

  tuneButton.disabled = true;
  socket.send(JSON.stringify({
    type: "setFrequency",
    bandId: bandSelect.value,
    hz
  }));
  setStatus("Tune command sent");
  setTimeout(() => {
    tuneButton.disabled = false;
  }, 350);
}

function loadContext() {
  try {
    return JSON.parse(localStorage.getItem("yeasuCatManualFrequency") ?? "{}");
  } catch {
    return {};
  }
}

function setStatus(text) {
  statusText.textContent = text;
}

function hzToMhz(hz) {
  return Number.isFinite(hz) ? (hz / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function mhzToHz(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number * 1_000_000) : null;
}

function formatFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "--.---.---";
  }
  const padded = String(Math.round(hz)).padStart(8, "0");
  const mhz = Number(padded.slice(0, -6));
  return `${mhz}.${padded.slice(-6, -3)}.${padded.slice(-3)}`;
}
