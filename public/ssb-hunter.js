import { bandIdToAdifBand } from "./band-plan.js";
import { canSyncRangeReadback } from "./range-readback.js";

const connectionDot = document.querySelector("#connectionDot");
const statusText = document.querySelector("#statusText");
const bandDisplay = document.querySelector("#bandDisplay");
const hunterBandSelect = document.querySelector("#hunterBandSelect");
const modeDisplay = document.querySelector("#modeDisplay");
const rangeDisplay = document.querySelector("#rangeDisplay");
const frequencyDisplay = document.querySelector("#frequencyDisplay");
const hunterPotaButton = document.querySelector("#hunterPotaButton");
const hunterLogContactButton = document.querySelector("#hunterLogContactButton");
const hunterManualFrequencyButton = document.querySelector("#hunterManualFrequencyButton");
const phaseDisplay = document.querySelector("#phaseDisplay");
const stepDisplay = document.querySelector("#stepDisplay");
const bestDisplay = document.querySelector("#bestDisplay");
const lockHoldDisplay = document.querySelector("#lockHoldDisplay");
const startHunterButton = document.querySelector("#startHunterButton");
const stopHunterButton = document.querySelector("#stopHunterButton");
const skipHunterButton = document.querySelector("#skipHunterButton");
const pttStatusDisplay = document.querySelector("#pttStatusDisplay");
const audioStatusDisplay = document.querySelector("#audioStatusDisplay");
const audioInputSelect = document.querySelector("#audioInputSelect");
const audioLevelDisplay = document.querySelector("#audioLevelDisplay");
const audioLevelFill = document.querySelector("#audioLevelFill");
const audioThresholdDisplay = document.querySelector("#audioThresholdDisplay");
const audioThresholdSlider = document.querySelector("#audioThresholdSlider");
const lockTimeDisplay = document.querySelector("#lockTimeDisplay");
const lockTimeSlider = document.querySelector("#lockTimeSlider");
const baseSpeedDisplay = document.querySelector("#baseSpeedDisplay");
const baseSpeedSlider = document.querySelector("#baseSpeedSlider");
const modulationDisplay = document.querySelector("#modulationDisplay");
const modulationFill = document.querySelector("#modulationFill");
const hunterRfGainDisplay = document.querySelector("#hunterRfGainDisplay");
const hunterRfGainSlider = document.querySelector("#hunterRfGainSlider");
const autoRfGainToggle = document.querySelector("#autoRfGainToggle");
const hunterSpeedDisplay = document.querySelector("#hunterSpeedDisplay");
const hunterSpeedFill = document.querySelector("#hunterSpeedFill");
const toneRejectDisplay = document.querySelector("#toneRejectDisplay");
const scoreDisplay = document.querySelector("#scoreDisplay");
const decisionDisplay = document.querySelector("#decisionDisplay");
const candidateList = document.querySelector("#candidateList");
const hitCountDisplay = document.querySelector("#hitCountDisplay");
const lastCommandDisplay = document.querySelector("#lastCommandDisplay");
const currentScoreDisplay = document.querySelector("#currentScoreDisplay");
const bestScoreDisplay = document.querySelector("#bestScoreDisplay");
const lockTimerDisplay = document.querySelector("#lockTimerDisplay");
const resumeFrequencyDisplay = document.querySelector("#resumeFrequencyDisplay");
const hunterDwellDisplay = document.querySelector("#hunterDwellDisplay");
const sampleCountDisplay = document.querySelector("#sampleCountDisplay");
const noiseFloorDisplay = document.querySelector("#noiseFloorDisplay");
const signalLiftDisplay = document.querySelector("#signalLiftDisplay");
const voiceLikeDisplay = document.querySelector("#voiceLikeDisplay");
const spectralShapeDisplay = document.querySelector("#spectralShapeDisplay");
const broadbandDisplay = document.querySelector("#broadbandDisplay");
const peakDisplay = document.querySelector("#peakDisplay");
const centroidDisplay = document.querySelector("#centroidDisplay");
const dbDisplay = document.querySelector("#dbDisplay");
const scoreCanvas = document.querySelector("#scoreCanvas");
const sweepCanvas = document.querySelector("#sweepCanvas");
const envelopeStatusDisplay = document.querySelector("#envelopeStatusDisplay");
const envelopeCanvas = document.querySelector("#envelopeCanvas");
const envelopeViewDisplay = document.querySelector("#envelopeViewDisplay");
const envelopeCursorDisplay = document.querySelector("#envelopeCursorDisplay");
const envelopeEdgesDisplay = document.querySelector("#envelopeEdgesDisplay");
const envelopePeakDisplay = document.querySelector("#envelopePeakDisplay");

const PREFERRED_AUDIO_INPUT_PATTERN = /usb audio codec|yaesu|ftdx|burr-brown/i;
const AUDIO_SPECTRUM_MAX_HZ = 4000;
const AUDIO_SCAN_SAMPLE_INTERVAL_MS = 15;
const AUDIO_SPECTRUM_MIN_DB = -90;
const AUDIO_SPECTRUM_MAX_DB = -10;
const AUDIO_LEVEL_HISTORY_SIZE = 18;
const RF_GAIN_LIVE_THROTTLE_MS = 120;
const HUNTER_OPTIONS_THROTTLE_MS = 80;
const PTT_TIMEOUT_MS = 120_000;
const HUNTER_MANUAL_STUDY_SPAN_HZ = 100_000;
const HUNTER_SWEEP_VISUAL_MAX_POINTS = 2200;
const HUNTER_ENVELOPE_VISUAL_MAX_POINTS = 1200;
const HUNTER_BASE_DWELL_STORAGE_KEY = "yeasuCatHunterBaseDwellMsV3";
const HUNTER_BASE_DWELL_MIN_MS = 8;
const HUNTER_BASE_DWELL_MAX_MS = 120;

let socket = null;
let connected = false;
let latestState = null;
let config = null;
let audioStream = null;
let audioContext = null;
let audioSourceNode = null;
let audioAnalyser = null;
let audioFrequencyData = null;
let audioTimeData = null;
let audioLevelHistory = [];
let audioLevelHistoryKey = null;
let audioAnimationFrame = null;
let lastAudioScanSampleAt = 0;
let scoreTrace = [];
let audioInputUserSelected = false;
let lastRfGainSentAt = 0;
let lastRfGainSentValue = null;
let pendingRfGainValue = null;
let rfGainSendTimer = null;
let lastHunterOptionsSentAt = 0;
let hunterOptionsSendTimer = null;
let pendingHunterOptionsIncludeRf = false;
let pendingAutoRfGainSyncUntil = 0;
let pttActive = false;
let pttKeyDown = false;
let pttTimeoutTimer = null;
const hunterSearchParams = new URLSearchParams(location.search);
const embeddedDashboard = hunterSearchParams.get("embedded") === "1";
let hunterBandId = hunterSearchParams.get("band")
  ?? localStorage.getItem("yeasuCatHunterBandId")
  ?? "";
let dashboardActive = !embeddedDashboard;

startHunterButton.addEventListener("click", startHunter);
stopHunterButton.addEventListener("click", stopHunter);
skipHunterButton.addEventListener("click", skipHunterTarget);
hunterPotaButton.addEventListener("click", openPotaSpotsPopout);
hunterLogContactButton.addEventListener("click", () => openContactLogger());
hunterManualFrequencyButton.addEventListener("click", () => openManualFrequencyPopout());
audioInputSelect.addEventListener("change", handleAudioInputChange);
audioThresholdSlider.addEventListener("input", handleAudioThresholdInput);
audioThresholdSlider.addEventListener("change", sendHunterOptions);
lockTimeSlider.addEventListener("input", handleLockTimeInput);
lockTimeSlider.addEventListener("change", sendHunterOptions);
baseSpeedSlider.addEventListener("input", handleBaseSpeedInput);
baseSpeedSlider.addEventListener("change", sendHunterOptions);
hunterRfGainSlider.addEventListener("input", handleRfGainInput);
hunterRfGainSlider.addEventListener("change", setRfGain);
autoRfGainToggle.addEventListener("change", handleAutoRfGainToggle);
hunterBandSelect.addEventListener("change", () => setHunterBandId(hunterBandSelect.value));
candidateList.addEventListener("click", handleCandidateClick);
window.addEventListener("keydown", handleKeyboardShortcut, { capture: true });
window.addEventListener("keyup", handleKeyUp, { capture: true });
document.addEventListener("keypress", handlePttTextKey, { capture: true });
document.addEventListener("beforeinput", handlePttBeforeInput, { capture: true });
document.addEventListener("input", removePttCharacterFromField, { capture: true });
window.addEventListener("message", handleParentMessage);
document.addEventListener("visibilitychange", handleDashboardVisibilityChange);
window.addEventListener("beforeunload", handleBeforeUnload);

await loadConfig();
configureSliders();
renderHunterBandOptions();
await refreshAudioInputs();
connectWebSocket();
drawEmptyCanvases();
syncControls();

async function loadConfig() {
  const response = await fetch("/api/config");
  config = await response.json();
}

function configureSliders() {
  const hunterConfig = config?.scan?.ssbHunter ?? {};
  audioThresholdSlider.min = String(hunterConfig.audioLiftGateMinPercent ?? 2);
  audioThresholdSlider.max = String(hunterConfig.audioLiftGateMaxPercent ?? 35);
  audioThresholdSlider.value = String(hunterConfig.audioLiftGatePercent ?? 6);
  lockTimeSlider.min = String(Math.round((hunterConfig.lockMinMs ?? 1000) / 1000));
  lockTimeSlider.max = String(Math.round((hunterConfig.lockMaxMs ?? 60000) / 1000));
  lockTimeSlider.value = String(Math.round((hunterConfig.lockMs ?? 5000) / 1000));
  const defaultBaseDwell = Number(hunterConfig.dwellMs ?? 35);
  baseSpeedSlider.min = String(hunterConfig.dwellMinMs ?? HUNTER_BASE_DWELL_MIN_MS);
  baseSpeedSlider.max = String(hunterConfig.dwellMaxMs ?? HUNTER_BASE_DWELL_MAX_MS);
  baseSpeedSlider.step = "1";
  baseSpeedSlider.value = String(loadBaseDwellMs(defaultBaseDwell));
  const rfGainConfig = config?.rfGainControl ?? {};
  hunterRfGainSlider.min = String(rfGainConfig.min ?? 0);
  hunterRfGainSlider.max = String(rfGainConfig.max ?? 255);
  hunterRfGainSlider.dataset.manualMin = hunterRfGainSlider.min;
  hunterRfGainSlider.dataset.manualMax = hunterRfGainSlider.max;
  hunterRfGainSlider.dataset.autoMin = String(hunterConfig.autoRfGainTargetMinPercent ?? 6);
  hunterRfGainSlider.dataset.autoMax = String(hunterConfig.autoRfGainTargetMaxPercent ?? 35);
  hunterRfGainSlider.dataset.autoValue = String(hunterConfig.autoRfGainTargetLiftPercent ?? 14);
  renderAudioThreshold();
  renderLockTime();
  renderBaseSpeed();
  renderRfGain(latestState?.rfGain);
  renderSpeed(latestState?.scan);
}

function connectWebSocket() {
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/cat`);

  socket.addEventListener("open", () => {
    setStatus("Dashboard linked");
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "error") {
      setStatus(message.message);
      return;
    }

    if (message.type === "state") {
      renderState(message);
    }
  });

  socket.addEventListener("close", () => {
    connected = false;
    connectionDot.classList.remove("connected");
    renderPtt({ active: false, reason: "disconnect" });
    setStatus("Dashboard disconnected");
    syncControls();
    setTimeout(connectWebSocket, 1200);
  });
}

async function startHunter() {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    setStatus("Connect CAT in the main console first.");
    return;
  }

  const mode = String(latestState?.mode ?? "").toUpperCase();
  if (!["USB", "LSB"].includes(mode)) {
    setStatus("Choose USB or LSB before SSB Hunter.");
    return;
  }

  if (!audioStream) {
    await startAudio();
  }

  if (!audioStream || !audioAnalyser) {
    setStatus("Audio input is required for SSB Hunter.");
    return;
  }

  socket.send(JSON.stringify({
    type: "startScan",
    intent: "ssbHunter",
    bandId: getHunterBandId(),
    scanSource: "frequency",
    stepHz: config?.scan?.ssbHunter?.initialStepHz ?? 1000,
    dwellMs: getBaseDwellMs(),
    thresholdS: 0,
    smartList: true,
    readableMode: false,
    useBusy: false,
    audioAssist: true,
    audioThresholdPercent: config?.scan?.ssbHunter?.minAudioLevelPercent ?? 15,
    audioLiftGatePercent: getAudioThresholdPercent(),
    autoRfGainEnabled: autoRfGainToggle.checked,
    rfGainTargetLiftPercent: getRfGainTargetLiftPercent(),
    lockMs: getLockTimeMs()
  }));
  setStatus("SSB Hunter running");
}

function stopHunter() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stopScan" }));
  }
}

function skipHunterTarget() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "skipHunterTarget" }));
    setStatus("Skipping target and resuming wide hunt");
  }
}

function openPotaSpotsPopout() {
  const context = {
    state: contactContextFromState(),
    openedAt: Date.now()
  };
  localStorage.setItem("yeasuCatPotaContext", JSON.stringify(context));
  if (embeddedDashboard && window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "openPotaSpots",
      context
    }, location.origin);
    setStatus("POTA tab opened in main console");
    return;
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type: "openPotaSpots",
      context
    }, location.origin);
    window.opener.focus();
    setStatus("POTA tab opened in main console");
    return;
  }

  const width = 560;
  const height = 620;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const popup = window.open(
    "/pota-spots.html",
    "pota-spots",
    `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
  );
  if (!popup) {
    setStatus("POTA spots popout blocked.");
    return;
  }
  popup.focus();
  setStatus("POTA spots opened");
}

function openContactLogger() {
  const draft = {
    state: contactContextFromState(),
    openedAt: Date.now()
  };
  localStorage.setItem("yeasuCatContactDraft", JSON.stringify(draft));
  if (embeddedDashboard && window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "openContactLogger",
      draft
    }, location.origin);
    setStatus("QRZ contact logger opened in main tab");
    return;
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type: "openContactLogger",
      draft
    }, location.origin);
    window.opener.focus();
    setStatus("QRZ contact logger opened in main tab");
    return;
  }

  window.location.href = "/#logger";
}

function openManualFrequencyPopout() {
  localStorage.setItem("yeasuCatManualFrequency", JSON.stringify({
    state: contactContextFromState(),
    openedAt: Date.now()
  }));
  const popup = window.open(
    "/manual-frequency.html",
    "manual-frequency",
    "popup=yes,width=520,height=560,menubar=no,toolbar=no,location=no,status=no"
  );
  if (!popup) {
    setStatus("Manual frequency popout blocked.");
    return;
  }
  popup.focus();
  setStatus("Manual frequency popout opened");
}

function contactContextFromState() {
  const hz = Number.isInteger(latestState?.hz) ? latestState.hz : latestState?.scan?.currentHz;
  const bandId = getHunterBandId();
  const band = config?.bands?.[bandId] ?? latestState?.band;
  return {
    connected,
    bandId,
    band: bandId,
    bandName: band?.name,
    adifBand: bandIdToAdifBand(bandId),
    hz,
    frequency: Number.isInteger(hz) ? formatFrequency(hz) : latestState?.frequency,
    frequencyMhz: Number.isInteger(hz) ? hzToMhz(hz) : "",
    mode: latestState?.mode
  };
}

async function handleAudioInputChange() {
  audioInputUserSelected = true;
  if (audioStream) {
    await startAudio();
  }
}

function handleAudioThresholdInput() {
  renderAudioThreshold();
  scheduleHunterOptionsSend();
}

function handleLockTimeInput() {
  renderLockTime();
  scheduleHunterOptionsSend();
}

function handleKeyboardShortcut(event) {
  if (isPttKey(event)) {
    event.preventDefault();
    event.stopPropagation();
    handlePttKeyDown(event);
    return;
  }

  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
    return;
  }

  if (isFormField(document.activeElement)) {
    return;
  }

  if (event.key.toLowerCase() === "h" && !startHunterButton.disabled) {
    event.preventDefault();
    void startHunter();
    return;
  }

  handleTuneKeyDown(event);
}

function handleKeyUp(event) {
  if (!isPttKey(event)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  releasePtt("key up");
}

function handleBeforeUnload() {
  releasePtt("unload");
  stopAudio();
}

function isPttKey(event) {
  return event.code === "Backquote" || event.key === "`";
}

function handleTuneKeyDown(event) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected || latestState?.scan?.active || isFormField(document.activeElement)) {
    return;
  }

  const steps = {
    ",": -1,
    ".": 1,
    ArrowLeft: -5,
    ArrowRight: 5,
    ArrowUp: 10,
    ArrowDown: -10
  };
  const stepHz = steps[event.key];

  if (!stepHz) {
    return;
  }

  event.preventDefault();
  socket.send(JSON.stringify({
    type: "nudge",
    stepHz
  }));
}

function handlePttKeyDown(event) {
  if (event.repeat || pttKeyDown) {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    setStatus("Connect CAT before PTT.");
    return;
  }

  if (latestState?.scan?.active) {
    setStatus("Stop scan before PTT.");
    return;
  }

  pttKeyDown = true;
  sendPtt(true);
  armLocalPttTimeout();
}

function handlePttTextKey(event) {
  if (!isPttKey(event)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

function handlePttBeforeInput(event) {
  if (event.inputType !== "insertText" || event.data !== "`") {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

function removePttCharacterFromField(event) {
  if (event.inputType !== "insertText" || event.data !== "`") {
    return;
  }

  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || !field.value.includes("`")) {
    return;
  }

  const selectionStart = field.selectionStart;
  field.value = field.value.replace(/`/g, "");
  if (selectionStart !== null) {
    const nextPosition = Math.max(0, selectionStart - 1);
    field.setSelectionRange(nextPosition, nextPosition);
  }
}

function armLocalPttTimeout() {
  clearPttTimeout();
  pttTimeoutTimer = setTimeout(() => {
    pttTimeoutTimer = null;
    releasePtt("timeout");
    setStatus("PTT timeout released after 2 minutes.");
  }, PTT_TIMEOUT_MS);
}

function clearPttTimeout() {
  if (pttTimeoutTimer) {
    clearTimeout(pttTimeoutTimer);
    pttTimeoutTimer = null;
  }
}

function releasePtt(reason = "released") {
  pttKeyDown = false;
  clearPttTimeout();
  if (!pttActive && reason !== "unload") {
    renderPtt({ active: false, reason });
    return;
  }

  sendPtt(false, reason);
}

function sendPtt(transmitting, reason = "") {
  const active = transmitting === true;
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    renderPtt({ active: false, reason });
    return;
  }

  socket.send(JSON.stringify({
    type: "setPtt",
    transmitting: active
  }));
  renderPtt({ active, reason });
}

function renderPtt(ptt = {}) {
  pttActive = Boolean(ptt?.active);
  const statusNode = pttStatusDisplay.closest(".ptt-status");
  pttStatusDisplay.textContent = pttActive ? "TX" : "Ready";
  statusNode?.classList.toggle("transmitting", pttActive);
}

function isFormField(element) {
  return ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element?.tagName);
}

function getAudioThresholdPercent() {
  return clamp(
    Number(audioThresholdSlider.value),
    Number(audioThresholdSlider.min || 2),
    Number(audioThresholdSlider.max || 35)
  );
}

function getRfGainTargetLiftPercent() {
  return clamp(
    Number(hunterRfGainSlider.value),
    Number(hunterRfGainSlider.dataset.autoMin || 6),
    Number(hunterRfGainSlider.dataset.autoMax || 35)
  );
}

function getLockTimeMs() {
  const seconds = clamp(
    Number(lockTimeSlider.value),
    Number(lockTimeSlider.min || 1),
    Number(lockTimeSlider.max || 60)
  );
  return Math.round(seconds * 1000);
}

function renderAudioThreshold(value = getAudioThresholdPercent()) {
  audioThresholdDisplay.textContent = `+${Math.round(value)}%`;
}

function renderLockTime(valueMs = getLockTimeMs()) {
  lockTimeDisplay.textContent = `${Math.round(valueMs / 1000)}s`;
}

function getBaseDwellMs() {
  return clamp(
    Number(baseSpeedSlider.value),
    Number(baseSpeedSlider.min || HUNTER_BASE_DWELL_MIN_MS),
    Number(baseSpeedSlider.max || HUNTER_BASE_DWELL_MAX_MS)
  );
}

function baseSliderValueFromDwellMs(dwellMs) {
  const dwell = Number(dwellMs);
  if (!Number.isFinite(dwell) || dwell <= 0) {
    return getBaseDwellMs();
  }
  return clamp(
    dwell,
    Number(baseSpeedSlider.min || HUNTER_BASE_DWELL_MIN_MS),
    Number(baseSpeedSlider.max || HUNTER_BASE_DWELL_MAX_MS)
  );
}

function loadBaseDwellMs(defaultBaseDwell = 35) {
  const stored = Number(localStorage.getItem(HUNTER_BASE_DWELL_STORAGE_KEY));
  const restored = Number.isFinite(stored) && stored >= defaultBaseDwell ? stored : defaultBaseDwell;
  return clamp(
    restored,
    Number(baseSpeedSlider.min || HUNTER_BASE_DWELL_MIN_MS),
    Number(baseSpeedSlider.max || HUNTER_BASE_DWELL_MAX_MS)
  );
}

function handleBaseSpeedInput() {
  const dwellMs = getBaseDwellMs();
  localStorage.setItem(HUNTER_BASE_DWELL_STORAGE_KEY, String(dwellMs));
  renderBaseSpeed(dwellMs);
  scheduleHunterOptionsSend();
}

function renderBaseSpeed(dwellMs = getBaseDwellMs()) {
  const dwell = Math.round(Number(dwellMs));
  const name = dwellName(dwell);
  const value = `${dwell} ms/step`;
  baseSpeedDisplay.replaceChildren(
    createSpeedDisplayPart("speed-name", name),
    createSpeedDisplayPart("speed-value", value)
  );
  baseSpeedDisplay.setAttribute("aria-label", `${value} ${name}`);
}

function dwellName(dwellMs) {
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return "Impulse";
  if (dwellMs <= 10) return "Ludicrous Speed";
  if (dwellMs <= 20) return "Ridiculous Speed";
  if (dwellMs <= 45) return "Light Speed";
  if (dwellMs <= 80) return "Scan Ahead";
  return "Impulse";
}

function speedName(mhzPerSecond) {
  if (!Number.isFinite(mhzPerSecond) || mhzPerSecond <= 0) return "Impulse";
  if (mhzPerSecond < 0.08) return "Scan Ahead";
  if (mhzPerSecond < 0.22) return "Light Speed";
  if (mhzPerSecond < 0.38) return "Ridiculous Speed";
  return "Ludicrous Speed";
}

function createSpeedDisplayPart(className, text) {
  const part = document.createElement("span");
  part.className = className;
  part.textContent = text;
  return part;
}

function scheduleHunterOptionsSend(options = {}) {
  pendingHunterOptionsIncludeRf = pendingHunterOptionsIncludeRf || options.includeRf === true;
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  const waitMs = HUNTER_OPTIONS_THROTTLE_MS - (Date.now() - lastHunterOptionsSentAt);
  if (waitMs <= 0) {
    sendHunterOptions({ includeRf: pendingHunterOptionsIncludeRf });
    pendingHunterOptionsIncludeRf = false;
    return;
  }

  if (!hunterOptionsSendTimer) {
    hunterOptionsSendTimer = setTimeout(() => {
      hunterOptionsSendTimer = null;
      sendHunterOptions({ includeRf: pendingHunterOptionsIncludeRf });
      pendingHunterOptionsIncludeRf = false;
    }, waitMs);
  }
}

function sendHunterOptions(options = {}) {
  renderAudioThreshold();
  renderLockTime();
  renderBaseSpeed();
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  if (hunterOptionsSendTimer) {
    clearTimeout(hunterOptionsSendTimer);
    hunterOptionsSendTimer = null;
  }

  lastHunterOptionsSentAt = Date.now();
  const payload = {
    type: "setHunterOptions",
    audioThresholdPercent: config?.scan?.ssbHunter?.minAudioLevelPercent ?? 15,
    audioLiftGatePercent: getAudioThresholdPercent(),
    lockMs: getLockTimeMs(),
    dwellMs: getBaseDwellMs()
  };
  if (options.includeRf === true) {
    payload.autoRfGainEnabled = autoRfGainToggle.checked;
    payload.rfGainTargetLiftPercent = getRfGainTargetLiftPercent();
  }
  socket.send(JSON.stringify(payload));
}

function renderRfGain(rfGain) {
  if (autoRfGainToggle.checked) {
    renderRfGainTarget();
    return;
  }

  if (!rfGain) {
    hunterRfGainDisplay.textContent = "--";
    return;
  }

  if (!canSyncRangeReadback(hunterRfGainSlider, lastRfGainSentAt)) return;
  hunterRfGainDisplay.textContent = `${rfGain.percent}%`;
  hunterRfGainSlider.value = String(rfGain.value);
  if (lastRfGainSentValue !== rfGain.value) lastRfGainSentValue = null;
}

function renderPendingRfGain() {
  if (autoRfGainToggle.checked) {
    renderRfGainTarget();
    return;
  }

  const value = Number(hunterRfGainSlider.value);
  hunterRfGainDisplay.textContent = `${Math.round((value / 255) * 100)}%`;
}

function handleRfGainInput() {
  renderPendingRfGain();
  if (autoRfGainToggle.checked) {
    scheduleHunterOptionsSend({ includeRf: true });
    return;
  }
  scheduleRfGainSend();
}

function handleAutoRfGainToggle(options = {}) {
  const rfGainConfig = config?.rfGainControl ?? {};
  if (autoRfGainToggle.checked) {
    hunterRfGainSlider.min = hunterRfGainSlider.dataset.autoMin || "6";
    hunterRfGainSlider.max = hunterRfGainSlider.dataset.autoMax || "35";
    hunterRfGainSlider.value = hunterRfGainSlider.dataset.autoValue || "14";
    renderRfGainTarget();
  } else {
    hunterRfGainSlider.min = hunterRfGainSlider.dataset.manualMin || String(rfGainConfig.min ?? 0);
    hunterRfGainSlider.max = hunterRfGainSlider.dataset.manualMax || String(rfGainConfig.max ?? 255);
    hunterRfGainSlider.value = String(latestState?.rfGain?.value ?? Math.round(((rfGainConfig.max ?? 255) * 0.45)));
    renderRfGain(latestState?.rfGain);
  }
  if (options.send !== false) {
    pendingAutoRfGainSyncUntil = Date.now() + 1200;
    scheduleHunterOptionsSend({ includeRf: true });
  }
}

function renderRfGainTarget() {
  const value = getRfGainTargetLiftPercent();
  hunterRfGainDisplay.textContent = `+${Math.round(value)}%`;
}

function scheduleRfGainSend() {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  pendingRfGainValue = Number(hunterRfGainSlider.value);
  const waitMs = RF_GAIN_LIVE_THROTTLE_MS - (Date.now() - lastRfGainSentAt);
  if (waitMs <= 0) {
    sendRfGainValue(pendingRfGainValue);
    return;
  }

  if (!rfGainSendTimer) {
    rfGainSendTimer = setTimeout(() => {
      rfGainSendTimer = null;
      if (pendingRfGainValue !== null) {
        sendRfGainValue(pendingRfGainValue);
      }
    }, waitMs);
  }
}

function setRfGain() {
  if (autoRfGainToggle.checked) {
    renderRfGainTarget();
    pendingAutoRfGainSyncUntil = Date.now() + 1200;
    sendHunterOptions({ includeRf: true });
    return;
  }
  renderPendingRfGain();
  sendRfGainValue(Number(hunterRfGainSlider.value), { flush: true });
}

function sendRfGainValue(value, options = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  if (options.flush && rfGainSendTimer) {
    clearTimeout(rfGainSendTimer);
    rfGainSendTimer = null;
  }

  pendingRfGainValue = null;
  if (!Number.isFinite(value) || value === lastRfGainSentValue) {
    return;
  }

  lastRfGainSentAt = Date.now();
  lastRfGainSentValue = value;
  socket.send(JSON.stringify({
    type: "setRfGain",
    value
  }));
}

async function refreshAudioInputs(preferredDeviceId = audioInputSelect.value) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    audioInputSelect.replaceChildren(new Option("Browser audio unavailable", ""));
    audioInputSelect.disabled = true;
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === "audioinput");
    audioInputSelect.replaceChildren();

    if (inputs.length === 0) {
      audioInputSelect.append(new Option("No audio inputs found", ""));
      audioInputSelect.disabled = true;
      return [];
    }

    inputs.forEach((device, index) => {
      const label = device.label || `Input ${index + 1} (browser label hidden)`;
      audioInputSelect.append(new Option(label, device.deviceId));
    });

    const selected = inputs.find((device) => device.deviceId === preferredDeviceId)
      ?? inputs.find((device) => PREFERRED_AUDIO_INPUT_PATTERN.test(device.label))
      ?? inputs.find((device) => device.deviceId === "default")
      ?? inputs[0];
    audioInputSelect.value = selected.deviceId;
    audioInputSelect.disabled = false;
    return inputs;
  } catch {
    audioInputSelect.replaceChildren(new Option("Audio scan failed", ""));
    audioInputSelect.disabled = true;
    return [];
  }
}

async function startAudio() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setAudioStatus("Browser audio unavailable");
    return;
  }

  setAudioStatus("Starting audio");
  let stream = null;
  try {
    const requestedDeviceId = audioInputSelect.value;
    stream = await requestAudioStream(requestedDeviceId);
    let currentDeviceId = getStreamDeviceId(stream);
    let inputs = await refreshAudioInputs(currentDeviceId ?? requestedDeviceId);
    const preferredInput = inputs.find((device) => PREFERRED_AUDIO_INPUT_PATTERN.test(device.label));

    if (!audioInputUserSelected && preferredInput?.deviceId && preferredInput.deviceId !== currentDeviceId) {
      stopMediaStream(stream);
      stream = await requestAudioStream(preferredInput.deviceId);
      currentDeviceId = getStreamDeviceId(stream);
      inputs = await refreshAudioInputs(currentDeviceId);
    }

    stopAudio({ keepStatus: true });
    audioStream = stream;
    stream = null;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextConstructor();
    audioSourceNode = audioContext.createMediaStreamSource(audioStream);
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 2048;
    audioAnalyser.smoothingTimeConstant = 0.38;
    audioFrequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioTimeData = new Uint8Array(audioAnalyser.fftSize);
    audioLevelHistory = [];
    audioSourceNode.connect(audioAnalyser);
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const selectedInput = inputs.find((device) => device.deviceId === currentDeviceId)
      ?? inputs.find((device) => device.deviceId === audioInputSelect.value);
    const label = selectedInput?.label || audioStream.getAudioTracks()[0]?.label || "selected input";
    setAudioStatus(`RX: ${shortAudioLabel(label)}`);
    if (!PREFERRED_AUDIO_INPUT_PATTERN.test(label)) {
      setStatus("Check RX input: choose USB Audio CODEC if the meter follows speaker volume.");
    }
    drawAudio();
  } catch (error) {
    if (stream) {
      stopMediaStream(stream);
    }
    stopAudio();
    setAudioStatus(formatAudioError(error));
  }
}

function requestAudioStream(deviceId) {
  const audio = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
  };

  if (deviceId && deviceId !== "default") {
    audio.deviceId = { exact: deviceId };
  }

  return navigator.mediaDevices.getUserMedia({ audio, video: false });
}

function getStreamDeviceId(stream) {
  return stream?.getAudioTracks?.()[0]?.getSettings?.().deviceId ?? null;
}

function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop());
}

function shortAudioLabel(label) {
  const safeLabel = String(label || "selected input");
  return safeLabel.length > 24 ? `${safeLabel.slice(0, 21)}...` : safeLabel;
}

function stopAudio(options = {}) {
  if (audioAnimationFrame) {
    cancelAnimationFrame(audioAnimationFrame);
    audioAnimationFrame = null;
  }

  stopMediaStream(audioStream);
  audioStream = null;
  audioSourceNode?.disconnect();
  audioAnalyser?.disconnect();
  audioContext?.close?.().catch(() => {});
  audioContext = null;
  audioSourceNode = null;
  audioAnalyser = null;
  audioFrequencyData = null;
  audioTimeData = null;
  audioLevelHistory = [];
  audioLevelHistoryKey = null;
  if (!options.keepStatus) {
    setAudioStatus("Idle");
  }
}

function drawAudio() {
  if (!audioAnalyser || !audioFrequencyData || !audioTimeData) {
    return;
  }

  audioAnalyser.getByteTimeDomainData(audioTimeData);
  audioAnalyser.getByteFrequencyData(audioFrequencyData);
  const audioMetrics = calculateAudioMetrics(audioTimeData);
  const spectrumStats = calculateSpectrumStats(audioFrequencyData);
  syncAudioLevelHistoryKey();
  const levelHistory = rememberAudioLevel(audioMetrics.percent);
  const voiceMetrics = calculateVoiceMetrics(audioFrequencyData, audioMetrics, spectrumStats, levelHistory);
  updateAudioMeters(audioMetrics, voiceMetrics, spectrumStats);
  sendAudioSample(audioMetrics, spectrumStats, voiceMetrics);
  audioAnimationFrame = requestAnimationFrame(drawAudio);
}

function sendAudioSample(audioMetrics, spectrumStats, voiceMetrics) {
  const scan = latestState?.scan;
  const manualStudy = isManualHunterStudy(scan);
  if (!isDashboardSamplingActive() || !socket || socket.readyState !== WebSocket.OPEN || !connected || scan?.intent !== "ssbHunter" || (!scan.active && !manualStudy)) {
    return;
  }

  const hz = scan.active && Number.isInteger(scan.currentHz)
    ? scan.currentHz
    : Number.isInteger(latestState?.hz)
    ? latestState.hz
    : scan.currentHz;
  if (!Number.isInteger(hz)) {
    return;
  }

  const now = Date.now();
  if (now - lastAudioScanSampleAt < AUDIO_SCAN_SAMPLE_INTERVAL_MS) {
    return;
  }

  lastAudioScanSampleAt = now;
  socket.send(JSON.stringify({
    type: "audioScanSample",
    bandId: scan.bandId ?? getHunterBandId(),
    hz,
    tunedAt: scan.active ? scan.tunedAt : now,
    manualStudy,
    levelPercent: audioMetrics.percent,
    dbfs: Number.isFinite(audioMetrics.dbfs) ? audioMetrics.dbfs : -Infinity,
    clipPercent: audioMetrics.clipPercent,
	    voiceScore: voiceMetrics.voiceScore,
	    voiceLikely: voiceMetrics.voiceLikely,
	    peakHz: spectrumStats.peakHz,
	    centroidHz: spectrumStats.centroidHz,
	    midRatio: voiceMetrics.midRatio,
	    lowRatio: voiceMetrics.lowRatio,
	    highRatio: voiceMetrics.highRatio,
	    voiceTextureScore: voiceMetrics.voiceTextureScore,
	    voiceSpread: voiceMetrics.voiceSpread,
	    voicePeakToMean: voiceMetrics.peakToMean
	  }));
	}

function isDashboardSamplingActive() {
  return !document.hidden && (!embeddedDashboard || dashboardActive);
}

function renderState(state) {
  latestState = state;
  connected = state.status === "connected";
  connectionDot.classList.toggle("connected", connected);
  renderPtt(state.ptt);
  if (!hunterBandId && state.band?.id) {
    setHunterBandId(state.band.id, { persist: false });
  }
  renderHunterBandSummary(state);

  modeDisplay.textContent = state.mode ?? "--";
  frequencyDisplay.textContent = getHunterFrequencyDisplay(state);
  lastCommandDisplay.textContent = state.lastCommand ?? "--";

  const hunter = state.scan?.hunter ?? {};
  const scan = state.scan ?? {};
  if (Number.isFinite(hunter.audioLiftGatePercent) && document.activeElement !== audioThresholdSlider) {
    audioThresholdSlider.value = String(hunter.audioLiftGatePercent);
    renderAudioThreshold(hunter.audioLiftGatePercent);
  }
  if (Number.isFinite(hunter.lockMs) && document.activeElement !== lockTimeSlider) {
    lockTimeSlider.value = String(Math.round(hunter.lockMs / 1000));
    renderLockTime(hunter.lockMs);
  }
  if (scan?.active && Number.isFinite(hunter.baseDwellMs) && document.activeElement !== baseSpeedSlider) {
    const dwellMs = baseSliderValueFromDwellMs(hunter.baseDwellMs);
    baseSpeedSlider.value = String(dwellMs);
    localStorage.setItem(HUNTER_BASE_DWELL_STORAGE_KEY, String(dwellMs));
    renderBaseSpeed(dwellMs);
  }
  const canSyncAutoRf = Date.now() > pendingAutoRfGainSyncUntil && document.activeElement !== autoRfGainToggle;
  if (canSyncAutoRf && Boolean(hunter.autoRfGainEnabled) !== autoRfGainToggle.checked) {
    autoRfGainToggle.checked = Boolean(hunter.autoRfGainEnabled);
    handleAutoRfGainToggle({ send: false });
  }
  if (autoRfGainToggle.checked && Number.isFinite(hunter.rfGainTargetLiftPercent) && document.activeElement !== hunterRfGainSlider) {
    hunterRfGainSlider.value = String(hunter.rfGainTargetLiftPercent);
  }
  renderRfGain(state.rfGain);
  phaseDisplay.textContent = hunter.phase ?? (scan.active ? scan.status : "Idle");
  stepDisplay.textContent = Number.isFinite(hunter.stepHz) ? `${hunter.stepHz} Hz` : "-- Hz";
  bestDisplay.textContent = Number.isInteger(hunter.bestHz) ? formatFrequency(hunter.bestHz) : "--";
  lockHoldDisplay.textContent = formatCountdown(hunter.lockUntil);
  scoreDisplay.textContent = String(Math.round(hunter.bestScore ?? hunter.currentScore ?? 0));
  decisionDisplay.textContent = hunter.decision ?? scan.status ?? "Idle";
  currentScoreDisplay.textContent = String(Math.round(hunter.currentScore ?? 0));
  bestScoreDisplay.textContent = String(Math.round(hunter.bestScore ?? 0));
  lockTimerDisplay.textContent = formatCountdown(hunter.lockUntil);
  resumeFrequencyDisplay.textContent = Number.isInteger(hunter.resumeHz) ? formatFrequency(hunter.resumeHz) : "--";
  hunterDwellDisplay.textContent = Number.isFinite(scan.dwellMs) ? `${scan.dwellMs} ms` : "-- ms";
  renderSpeed(scan);
  sampleCountDisplay.textContent = String(hunter.sampleCount ?? 0);
  noiseFloorDisplay.textContent = formatPercent(hunter.noiseFloorPercent);
  signalLiftDisplay.textContent = formatPercent(hunter.signalLiftPercent);
  voiceLikeDisplay.textContent = String(Math.round(hunter.voiceLikeScore ?? 0));
  spectralShapeDisplay.textContent = String(Math.round(hunter.spectralVoiceScore ?? 0));
  broadbandDisplay.textContent = hunter.broadbandRejected ? "Rejected" : "Clear";
  modulationDisplay.textContent = String(Math.round(hunter.modulationScore ?? 0));
  modulationFill.style.width = `${clamp(hunter.modulationScore ?? 0, 0, 100)}%`;
  toneRejectDisplay.textContent = hunter.toneRejected
    ? "Tone rejected"
    : hunter.broadbandRejected
    ? "Noise rejected"
    : "Tone gate clear";
  toneRejectDisplay.classList.toggle("rejected", Boolean(hunter.toneRejected || hunter.broadbandRejected));

  appendScoreTrace(hunter);
  drawScoreTrace();
  drawSweep(scan, hunter);
  drawEnvelopeFocus(scan, hunter);
  renderCandidates(scan.hits ?? []);
  syncControls();
}

function renderHunterBandOptions() {
  const previous = hunterBandId;
  hunterBandSelect.replaceChildren();
  for (const profile of Object.values(config?.bands ?? {})) {
    hunterBandSelect.append(new Option(profile.name ?? profile.id, profile.id));
  }

  const nextBandId = config?.bands?.[previous]
    ? previous
    : config?.bands?.[latestState?.band?.id]
    ? latestState.band.id
    : config?.defaultBandId
    ?? Object.keys(config?.bands ?? {})[0]
    ?? "";
  setHunterBandId(nextBandId, { persist: false });
}

function handleParentMessage(event) {
  if (event.origin !== location.origin) {
    return;
  }

  if (event.data?.type === "hunterBand") {
    setHunterBandId(event.data.bandId);
    return;
  }

  if (event.data?.type === "hunterVisibility") {
    dashboardActive = event.data.active === true;
    if (!dashboardActive && latestState?.scan?.active && latestState.scan.intent === "ssbHunter") {
      stopHunter();
      setStatus("Hunter paused because the tab is hidden");
    }
    return;
  }

  if (event.data?.type === "radioPower" && event.data.powered === false) {
    stopHunter();
    releasePtt("power down");
    stopAudio({ keepStatus: true });
    setStatus("Radio deck powered down");
  }
}

function handleDashboardVisibilityChange() {
  if (document.hidden && latestState?.scan?.active && latestState.scan.intent === "ssbHunter") {
    stopHunter();
    setStatus("Hunter paused because the page is hidden");
  }
}

function setHunterBandId(bandId, options = {}) {
  if (!config?.bands?.[bandId]) {
    return;
  }

  hunterBandId = bandId;
  if (hunterBandSelect.value !== bandId) {
    hunterBandSelect.value = bandId;
  }
  if (options.persist !== false) {
    localStorage.setItem("yeasuCatHunterBandId", bandId);
  }
  renderHunterBandSummary(latestState);
}

function getHunterBandId() {
  if (config?.bands?.[hunterBandId]) {
    return hunterBandId;
  }
  return latestState?.band?.id ?? config?.defaultBandId;
}

function renderHunterBandSummary(state = latestState) {
  const profile = config?.bands?.[getHunterBandId()] ?? state?.band;
  bandDisplay.textContent = profile?.name ?? "--";
  rangeDisplay.textContent = formatRange(profile?.scanRange);
  if (!state || (!Number.isInteger(state.hz) && !Number.isInteger(state.scan?.currentHz) && !state.frequency)) {
    frequencyDisplay.textContent = profile?.centerDisplay ?? "NO CAT";
  }
}

function getHunterFrequencyDisplay(state = latestState) {
  const profile = config?.bands?.[getHunterBandId()] ?? state?.band;
  if (Number.isInteger(state?.scan?.currentHz) && state?.scan?.intent === "ssbHunter" && state?.scan?.active) {
    return formatFrequency(state.scan.currentHz);
  }
  if (Number.isInteger(state?.hz)) {
    return formatFrequency(state.hz);
  }
  if (Number.isInteger(state?.scan?.currentHz)) {
    return formatFrequency(state.scan.currentHz);
  }
  return state?.frequency ?? profile?.centerDisplay ?? "NO CAT";
}

function renderCandidates(hits) {
  hitCountDisplay.textContent = String(hits.length);
  candidateList.replaceChildren();
  if (hits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No SSB candidates yet.";
    candidateList.append(empty);
    return;
  }

  for (const hit of hits.slice(0, 6)) {
    const row = document.createElement("div");
    row.className = "candidate-row";
    row.innerHTML = `
      <div>
        <strong>${hit.peakDisplay ?? formatFrequency(hit.peakHz)}</strong>
        <span>${hit.channelLabel ?? "SSB"} | seen ${hit.seenCount ?? 1} | lift ${formatPercent(hit.audioLiftPercent)}</span>
      </div>
      <span>${Math.round(hit.audioVoiceLikeScore ?? hit.audioScore ?? hit.score ?? 0)}</span>
      <button type="button" data-hit-id="${hit.id}">Tune</button>
    `;
    candidateList.append(row);
  }
}

function handleCandidateClick(event) {
  const button = event.target.closest("[data-hit-id]");
  if (!button || socket?.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({
    type: "jumpToHit",
    id: button.dataset.hitId
  }));
}

function syncControls() {
  const scan = latestState?.scan;
  const mode = String(latestState?.mode ?? "").toUpperCase();
  const modeReady = ["USB", "LSB"].includes(mode);
  startHunterButton.disabled = !connected || Boolean(scan?.active) || !modeReady;
  startHunterButton.title = !connected
    ? "Connect CAT first."
    : !modeReady
    ? "Choose USB or LSB before SSB Hunter."
    : "";
  stopHunterButton.disabled = !connected || !scan?.active;
  skipHunterButton.disabled = !connected || !scan?.active || scan?.intent !== "ssbHunter";
  hunterRfGainSlider.disabled = !connected;
  autoRfGainToggle.disabled = !connected;
}

function renderSpeed(scan = latestState?.scan) {
  const rate = Number(scan?.ratePerSecond ?? 0);
  const stepHz = Number(scan?.hunter?.stepHz ?? scan?.stepHz ?? 0);
  const mhzPerSecond = rate * stepHz / 1_000_000;
  const percent = clamp((mhzPerSecond / 0.4) * 100, 0, 100);
  hunterSpeedFill.style.width = `${percent}%`;
  hunterSpeedDisplay.textContent = speedLabel(rate, mhzPerSecond);
}

function speedLabel(rate, mhzPerSecond = 0) {
  if (!Number.isFinite(rate) || rate <= 0) return "Impulse";
  const pace = Number.isFinite(mhzPerSecond) && mhzPerSecond > 0
    ? `${mhzPerSecond.toFixed(2)} MHz/s`
    : `${rate.toFixed(1)}/s`;
  return `${pace} ${speedName(mhzPerSecond)}`;
}

function appendScoreTrace(hunter) {
  if (!hunter || !Number.isFinite(hunter.currentScore)) {
    return;
  }

  scoreTrace.push({
    score: hunter.currentScore,
    modulation: hunter.modulationScore ?? 0,
    voiceLike: hunter.voiceLikeScore ?? 0,
    lift: hunter.signalLiftPercent ?? 0,
    rejected: Boolean(hunter.toneRejected || hunter.broadbandRejected)
  });
  scoreTrace = scoreTrace.slice(-120);
}

function drawScoreTrace() {
  const context = scoreCanvas.getContext("2d");
  const { width, height } = scoreCanvas;
  context.clearRect(0, 0, width, height);
  drawGrid(context, width, height);
  if (scoreTrace.length < 2) {
    return;
  }

  drawTrace(context, scoreTrace.map((point) => point.score), "#ff304a", width, height);
  drawTrace(context, scoreTrace.map((point) => point.voiceLike), "#f8fbff", width, height);
  drawTrace(context, scoreTrace.map((point) => point.modulation), "#2f78ff", width, height);
}

function drawSweep(scan, hunter) {
  const context = sweepCanvas.getContext("2d");
  const { width, height } = sweepCanvas;
  context.clearRect(0, 0, width, height);
  drawGrid(context, width, height);
  const range = latestState?.band?.scanRange;
  const selectedRange = config?.bands?.[getHunterBandId()]?.scanRange ?? range;
  if (!selectedRange) {
    return;
  }

  const xForHz = (hz) => ((hz - selectedRange.startHz) / (selectedRange.endHz - selectedRange.startHz || 1)) * width;
  context.fillStyle = "rgba(47, 120, 255, 0.32)";
  context.fillRect(0, height * 0.45, width, height * 0.1);
  drawSweepHeat(context, width, height, selectedRange, hunter);
  const cursorHz = scan?.active && Number.isInteger(scan?.currentHz)
    ? scan.currentHz
    : Number.isInteger(latestState?.hz)
    ? latestState.hz
    : scan?.currentHz;
  if (Number.isInteger(cursorHz)) {
    context.fillStyle = "#f8fbff";
    context.fillRect(xForHz(cursorHz) - 2, 20, 4, height - 40);
  }
  if (Number.isInteger(hunter?.bestHz)) {
    context.fillStyle = "#ff304a";
    context.fillRect(xForHz(hunter.bestHz) - 3, 8, 6, height - 16);
  }
}

function drawEnvelopeFocus(scan, hunter) {
  const context = envelopeCanvas.getContext("2d");
  const { width, height } = envelopeCanvas;
  const envelope = hunter?.envelope;
  const focused = shouldShowEnvelopeFocus(scan, hunter);
  const selectedRange = selectedHunterRange(scan);
  const cursorHz = hunterCursorHz(scan);
  context.clearRect(0, 0, width, height);
  drawGrid(context, width, height);

  if (!focused) {
    if (shouldShowManualStudyFocus(scan, cursorHz, selectedRange)) {
      const range = centeredRange(cursorHz, HUNTER_MANUAL_STUDY_SPAN_HZ);
      envelopeStatusDisplay.textContent = `${formatAudioFrequency(HUNTER_MANUAL_STUDY_SPAN_HZ)} manual study`;
      drawEnvelopeManualStudy(context, width, height, range, selectedRange, scan, hunter, cursorHz);
      updateEnvelopeMetrics({
        view: "Manual 0.1 MHz",
        cursorHz,
        lowHz: range.startHz,
        highHz: range.endHz,
        peakHz: hunter?.bestHz
      });
      return;
    }

    if (scan?.active && scan?.intent === "ssbHunter" && selectedRange) {
      envelopeStatusDisplay.textContent = `${formatAudioFrequency(selectedRange.endHz - selectedRange.startHz)} whole band`;
      drawEnvelopeWholeBand(context, width, height, selectedRange, scan, hunter, cursorHz);
      updateEnvelopeMetrics({
        view: "Whole band",
        cursorHz,
        lowHz: selectedRange.startHz,
        highHz: selectedRange.endHz,
        peakHz: hunter?.bestHz
      });
      return;
    }

    envelopeStatusDisplay.textContent = "Standby";
    drawEnvelopeStandby(context, width, height, scan);
    updateEnvelopeMetrics();
    return;
  }

  const range = envelopeFocusRange(envelope, selectedRange, cursorHz);
  if (!range) {
    envelopeStatusDisplay.textContent = "Hunting";
    drawEnvelopeStandby(context, width, height, scan);
    updateEnvelopeMetrics();
    return;
  }

  const phase = String(hunter.phase ?? envelope.stage ?? "mapping").toUpperCase();
  const widthHz = Math.max(1, range.endHz - range.startHz);
  envelopeStatusDisplay.textContent = `${phase} ${formatAudioFrequency(widthHz)} zoom`;
  const xForHz = (hz) => ((hz - range.startHz) / widthHz) * width;

  drawEnvelopeFocusBase(context, width, height, range, selectedRange);
  drawEnvelopeHeat(context, width, height, range, hunter);
  drawEnvelopeWindow(context, xForHz, envelope, width, height);
  drawEnvelopeMarker(context, xForHz, envelope.suspectHz, height, "#8fb8ff", "suspect", 0.22);
  drawEnvelopeMarker(context, xForHz, envelope.lowEdgeHz, height, "#f8fbff", "first", 0.14);
  drawEnvelopeMarker(context, xForHz, envelope.highEdgeHz, height, "#f8fbff", "edge", 0.14);
  drawEnvelopeMarker(context, xForHz, envelope.bestHz ?? hunter.bestHz, height, "#ff304a", "peak", 0.34);
  drawCenteredCursor(context, width, height, xForHz, cursorHz);

  context.fillStyle = "rgba(248, 251, 255, 0.82)";
  context.font = "800 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(formatFrequency(range.startHz), 14, height - 14);
  const endLabel = formatFrequency(range.endHz);
  context.fillText(endLabel, width - context.measureText(endLabel).width - 14, height - 14);
  updateEnvelopeMetrics({
    view: formatAudioFrequency(widthHz),
    cursorHz,
    lowHz: envelope.lowEdgeHz ?? envelope.firstHeardHz,
    highHz: envelope.highEdgeHz ?? envelope.lastHeardHz,
    peakHz: envelope.bestHz ?? hunter.bestHz
  });
}

function selectedHunterRange(scan = latestState?.scan) {
  return config?.bands?.[getHunterBandId()]?.scanRange
    ?? scan?.range
    ?? latestState?.band?.scanRange
    ?? null;
}

function hunterCursorHz(scan = latestState?.scan) {
  if (!scan?.active && Number.isInteger(latestState?.hz)) {
    return latestState.hz;
  }
  return Number.isInteger(scan?.currentHz)
    ? scan.currentHz
    : Number.isInteger(latestState?.hz)
    ? latestState.hz
    : null;
}

function shouldShowEnvelopeFocus(scan, hunter) {
  if (!scan?.active || scan.intent !== "ssbHunter") {
    return false;
  }
  const phase = hunter?.phase;
  return Boolean(hunter?.envelope)
    && (phase === "mapping" || phase === "refining" || phase === "locked");
}

function shouldShowManualStudyFocus(scan, cursorHz, selectedRange) {
  if (!Number.isInteger(cursorHz) || !selectedRange) {
    return false;
  }
  if (scan?.active || scan?.intent !== "ssbHunter") {
    return false;
  }
  return Boolean(scan?.hunter);
}

function isManualHunterStudy(scan = latestState?.scan) {
  if (scan?.active || scan?.intent !== "ssbHunter" || !scan?.hunter) {
    return false;
  }
  return true;
}

function envelopeFocusRange(envelope, fallbackRange, cursorHz = null) {
  if (!envelope) {
    return null;
  }

  const heardCandidates = [
    envelope.lowEdgeHz,
    envelope.firstHeardHz,
    envelope.suspectHz,
    envelope.highEdgeHz,
    envelope.lastHeardHz,
    envelope.bestHz,
    envelope.suspectHz
  ].filter(Number.isInteger);
  if (heardCandidates.length === 0) {
    return null;
  }

  const stage = envelope.stage ?? "mapping";
  const stepHz = Math.max(10, Number(envelope.stepHz) || 250);
  const low = Math.min(...heardCandidates);
  const high = Math.max(...heardCandidates);
  const heardSpanHz = high > low ? high - low : stepHz * (stage === "refining" ? 18 : 12);
  const minimumSpanHz = stage === "refining"
    ? Math.max(700, stepHz * 26)
    : Math.max(2400, stepHz * 14);
  const maximumSpanHz = stage === "refining" ? 24_000 : 60_000;
  const padHz = Math.max(
    stage === "refining" ? 260 : 520,
    Math.round(heardSpanHz * 0.18),
    stepHz * 4
  );
  const center = Number.isInteger(cursorHz)
    ? cursorHz
    : Number.isInteger(envelope.bestHz)
    ? envelope.bestHz
    : Number.isInteger(envelope.suspectHz)
    ? envelope.suspectHz
    : Math.round((low + high) / 2);
  const rawSpanHz = Math.max(heardSpanHz + padHz * 2, minimumSpanHz);
  const spanHz = Math.min(rawSpanHz, maximumSpanHz, Math.max(1, fallbackRange?.endHz - fallbackRange?.startHz || rawSpanHz));
  return centeredRange(center, spanHz);
}

function centeredRange(centerHz, spanHz) {
  const boundedSpanHz = Math.max(1, Math.round(spanHz));
  const startHz = Math.round(centerHz - boundedSpanHz / 2);
  return {
    startHz,
    endHz: startHz + boundedSpanHz
  };
}

function drawEnvelopeWholeBand(context, width, height, range, scan, hunter, cursorHz) {
  const spanHz = Math.max(1, range.endHz - range.startHz);
  const xForHz = (hz) => ((hz - range.startHz) / spanHz) * width;
  drawEnvelopeFocusBase(context, width, height, range, range);
  drawEnvelopeHeat(context, width, height, range, hunter);
  if (Number.isInteger(hunter?.bestHz)) {
    drawEnvelopeMarker(context, xForHz, hunter.bestHz, height, "#ff304a", "best", 0.24, 4);
  }
  drawCenteredCursor(context, width, height, xForHz, cursorHz);

  context.fillStyle = "rgba(248, 251, 255, 0.82)";
  context.font = "800 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(formatFrequency(range.startHz), 14, height - 14);
  const endLabel = formatFrequency(range.endHz);
  context.fillText(endLabel, width - context.measureText(endLabel).width - 14, height - 14);

  context.fillStyle = "rgba(248, 251, 255, 0.9)";
  context.font = "900 46px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("HUNTING", width / 2, height * 0.24);
  context.font = "900 17px ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "rgba(184, 200, 231, 0.88)";
  context.fillText("whole band view until a suspect envelope is found", width / 2, height * 0.24 + 40);
  context.textAlign = "start";
  context.textBaseline = "alphabetic";
  void scan;
}

function drawEnvelopeManualStudy(context, width, height, range, bandRange, scan, hunter, cursorHz) {
  const spanHz = Math.max(1, range.endHz - range.startHz);
  const xForHz = (hz) => ((hz - range.startHz) / spanHz) * width;
  drawEnvelopeFocusBase(context, width, height, range, bandRange);
  drawEnvelopeHeat(context, width, height, range, hunter);
  drawCenteredCursor(context, width, height, xForHz, cursorHz);

  context.fillStyle = "rgba(248, 251, 255, 0.82)";
  context.font = "800 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(formatFrequency(range.startHz), 14, height - 14);
  const endLabel = formatFrequency(range.endHz);
  context.fillText(endLabel, width - context.measureText(endLabel).width - 14, height - 14);

  const readout = formatFrequency(cursorHz);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(248, 251, 255, 0.96)";
  context.font = "900 64px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(readout, width / 2, height * 0.28);
  context.font = "900 17px ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "rgba(184, 200, 231, 0.9)";
  context.fillText("manual VFO study window", width / 2, height * 0.28 + 48);
  context.textAlign = "start";
  context.textBaseline = "alphabetic";
  void scan;
}

function drawEnvelopeFocusBase(context, width, height, range, bandRange) {
  context.fillStyle = "rgba(47, 120, 255, 0.16)";
  context.fillRect(0, height * 0.45, width, height * 0.16);

  const spanHz = Math.max(1, range.endHz - range.startHz);
  const markerCount = 8;
  context.strokeStyle = "rgba(248, 251, 255, 0.16)";
  context.fillStyle = "rgba(184, 200, 231, 0.72)";
  context.font = "800 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  for (let index = 1; index < markerCount; index += 1) {
    const x = (index / markerCount) * width;
    const hz = Math.round(range.startHz + spanHz * (index / markerCount));
    context.beginPath();
    context.moveTo(x, height - 54);
    context.lineTo(x, height - 32);
    context.stroke();
    if (index % 2 === 0) {
      context.fillText(formatAudioFrequency(hz - (bandRange?.startHz ?? range.startHz)), x - 24, height - 36);
    }
  }
}

function drawEnvelopeWindow(context, xForHz, envelope, width, height) {
  const lowHz = envelope?.lowEdgeHz ?? envelope?.firstHeardHz;
  const highHz = envelope?.highEdgeHz ?? envelope?.lastHeardHz;
  if (!Number.isInteger(lowHz) || !Number.isInteger(highHz)) {
    return;
  }

  const lowX = clamp(xForHz(Math.min(lowHz, highHz)), 0, width);
  const highX = clamp(xForHz(Math.max(lowHz, highHz)), 0, width);
  const envelopeWidth = Math.max(4, highX - lowX);
  const gradient = context.createLinearGradient(lowX, 0, highX, 0);
  gradient.addColorStop(0, "rgba(47, 120, 255, 0.08)");
  gradient.addColorStop(0.5, "rgba(248, 251, 255, 0.16)");
  gradient.addColorStop(1, "rgba(255, 48, 74, 0.12)");
  context.fillStyle = gradient;
  context.fillRect(lowX, 18, envelopeWidth, height - 62);
  context.strokeStyle = "rgba(248, 251, 255, 0.46)";
  context.lineWidth = 2;
  context.strokeRect(lowX, 18, envelopeWidth, height - 62);
}

function drawCenteredCursor(context, width, height, xForHz, cursorHz) {
  if (!Number.isInteger(cursorHz)) {
    return;
  }

  const x = xForHz(cursorHz);
  if (!Number.isFinite(x) || x < -20 || x > width + 20) {
    return;
  }

  context.fillStyle = "rgba(248, 251, 255, 0.24)";
  context.fillRect(Math.max(0, x - 28), 8, 56, height - 34);
  context.fillStyle = "#ffffff";
  context.fillRect(x - 3, 8, 6, height - 34);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(x, 8);
  context.lineTo(x - 11, 26);
  context.lineTo(x + 11, 26);
  context.closePath();
  context.fill();
  context.font = "900 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText("CURSOR", Math.min(width - 86, Math.max(8, x + 9)), 42);
}

function updateEnvelopeMetrics({ view = "Whole band", cursorHz = null, lowHz = null, highHz = null, peakHz = null } = {}) {
  envelopeViewDisplay.textContent = view;
  envelopeCursorDisplay.textContent = Number.isInteger(cursorHz) ? formatFrequency(cursorHz) : "--";
  envelopeEdgesDisplay.textContent = Number.isInteger(lowHz) && Number.isInteger(highHz)
    ? `${formatFrequency(lowHz)} - ${formatFrequency(highHz)}`
    : "--";
  envelopePeakDisplay.textContent = Number.isInteger(peakHz) ? formatFrequency(peakHz) : "--";
}

function drawEnvelopeStandby(context, width, height, scan) {
  const text = scan?.active && scan?.intent === "ssbHunter" ? "HUNTING" : "STANDBY";
  context.fillStyle = "rgba(248, 251, 255, 0.92)";
  context.font = "900 56px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2 - 10);
  context.font = "800 18px ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "rgba(184, 200, 231, 0.82)";
  context.fillText("waiting for a suspect envelope", width / 2, height / 2 + 40);
  context.textAlign = "start";
  context.textBaseline = "alphabetic";
}

function drawEnvelopeHeat(context, width, height, range, hunter) {
  const points = compactVisualSweepPoints(
    (hunter?.sweep?.points ?? [])
      .filter((point) => Number.isFinite(point.hz) && point.hz >= range.startHz && point.hz <= range.endHz),
    HUNTER_ENVELOPE_VISUAL_MAX_POINTS
  );
  if (points.length === 0) {
    return;
  }

  const maxLevel = points.reduce(
    (max, point) => Math.max(max, point.levelPercent ?? point.signalLiftPercent ?? 0),
    1
  );
  const xForHz = (hz) => ((hz - range.startHz) / (range.endHz - range.startHz || 1)) * width;
  const barWidth = Math.max(3, Math.min(14, width / Math.max(40, points.length * 1.4)));
  for (const point of points) {
    const level = point.levelPercent ?? point.signalLiftPercent ?? 0;
    const normalized = clamp((level / maxLevel) * 100, 0, 100);
    const barHeight = Math.max(5, (normalized / 100) * (height - 52));
    const x = xForHz(point.hz) - barWidth / 2;
    const y = height - 28 - barHeight;
    context.fillStyle = sweepColor(normalized, point);
    context.shadowColor = sweepShadowColor(normalized, point);
    context.shadowBlur = normalized > 70 ? 14 : 5;
    context.fillRect(x, y, barWidth, barHeight);
    context.shadowBlur = 0;
  }
}

function drawEnvelopeMarker(context, xForHz, hz, height, color, label, alpha = 0.24, lineWidth = 3) {
  if (!Number.isInteger(hz)) {
    return;
  }

  const x = xForHz(hz);
  if (!Number.isFinite(x) || x < -20 || x > context.canvas.width + 20) {
    return;
  }

  context.fillStyle = markerGlow(color, alpha);
  context.fillRect(Math.max(0, x - 20), 10, 40, height - 36);
  context.fillStyle = color;
  context.fillRect(x - lineWidth / 2, 10, lineWidth, height - 36);
  context.font = "900 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(label.toUpperCase(), Math.min(context.canvas.width - 78, Math.max(8, x + 7)), 24);
}

function markerGlow(color, alpha) {
  if (color === "#ff304a") {
    return `rgba(255, 48, 74, ${alpha})`;
  }
  if (color === "#8fb8ff") {
    return `rgba(143, 184, 255, ${alpha})`;
  }
  return `rgba(248, 251, 255, ${alpha})`;
}

function drawSweepHeat(context, width, height, range, hunter) {
  const points = compactVisualSweepPoints(
    (hunter?.sweep?.points ?? [])
      .filter((point) => Number.isFinite(point.hz) && point.hz >= range.startHz && point.hz <= range.endHz),
    HUNTER_SWEEP_VISUAL_MAX_POINTS
  );
  if (points.length === 0) {
    return;
  }

  const maxLevel = points.reduce(
    (max, point) => Math.max(max, point.levelPercent ?? 0),
    Math.max(1, hunter?.sweep?.maxLevelPercent ?? 0)
  );
  const xForHz = (hz) => ((hz - range.startHz) / (range.endHz - range.startHz || 1)) * width;
  const barWidth = Math.max(2, Math.min(10, width / 120));

  for (const point of points) {
    if (!Number.isFinite(point.hz)) {
      continue;
    }
    const normalized = clamp(((point.levelPercent ?? 0) / maxLevel) * 100, 0, 100);
    const barHeight = Math.max(4, (normalized / 100) * (height - 24));
    const x = xForHz(point.hz) - barWidth / 2;
    const y = height - 12 - barHeight;
    context.fillStyle = sweepColor(normalized, point);
    context.shadowColor = sweepShadowColor(normalized, point);
    context.shadowBlur = normalized > 70 ? 10 : 4;
    context.fillRect(x, y, barWidth, barHeight);
    context.shadowBlur = 0;
  }
}

function compactVisualSweepPoints(points, maxPoints) {
  if (points.length <= maxPoints) {
    return points;
  }

  const stride = Math.ceil(points.length / maxPoints);
  const compacted = [];
  for (let index = 0; index < points.length; index += stride) {
    let best = points[index];
    let bestWeight = visualSweepPointWeight(best);
    const end = Math.min(points.length, index + stride);
    for (let scanIndex = index + 1; scanIndex < end; scanIndex += 1) {
      const point = points[scanIndex];
      const weight = visualSweepPointWeight(point);
      if (weight > bestWeight) {
        best = point;
        bestWeight = weight;
      }
    }
    compacted.push(best);
  }
  return compacted;
}

function visualSweepPointWeight(point) {
  if (!point) {
    return 0;
  }

  const level = Number(point.levelPercent ?? point.signalLiftPercent ?? 0);
  const quality = Math.max(
    Number(point.voiceLikeScore ?? 0),
    Number(point.spectralVoiceScore ?? 0),
    Number(point.modulationScore ?? 0),
    Number(point.voiceTextureScore ?? 0)
  );
  const acceptedBonus = point.accepted ? 100 : 0;
  const candidateBonus = point.fastCandidate ? 45 : 0;
  const rejectPenalty = point.toneRejected || point.broadbandRejected ? 60 : 0;
  return level + quality + acceptedBonus + candidateBonus - rejectPenalty;
}

function sweepColor(normalized, point) {
  if (point?.toneRejected || point?.broadbandRejected) {
    return `rgba(114, 130, 158, ${0.18 + normalized / 260})`;
  }
  if (normalized >= 75 || point?.accepted) {
    return `rgba(255, 48, 74, ${0.35 + normalized / 160})`;
  }
  const quality = Math.max(
    Number(point?.voiceLikeScore ?? 0),
    Number(point?.spectralVoiceScore ?? 0),
    Number(point?.modulationScore ?? 0),
    Number(point?.voiceTextureScore ?? 0)
  );
  if (point?.fastCandidate || quality >= 58) {
    return `rgba(78, 217, 255, ${0.36 + normalized / 170})`;
  }
  if (quality >= 36 || normalized >= 45) {
    return `rgba(47, 120, 255, ${0.34 + normalized / 190})`;
  }
  return `rgba(82, 100, 135, ${0.16 + normalized / 260})`;
}

function sweepShadowColor(normalized, point) {
  if (point?.toneRejected || point?.broadbandRejected) {
    return "rgba(114, 130, 158, 0.28)";
  }
  if (normalized >= 75 || point?.accepted) {
    return "rgba(255, 48, 74, 0.72)";
  }
  const quality = Math.max(
    Number(point?.voiceLikeScore ?? 0),
    Number(point?.spectralVoiceScore ?? 0),
    Number(point?.modulationScore ?? 0),
    Number(point?.voiceTextureScore ?? 0)
  );
  if (point?.fastCandidate || quality >= 58) {
    return "rgba(78, 217, 255, 0.72)";
  }
  return "rgba(47, 120, 255, 0.42)";
}

function drawEmptyCanvases() {
  drawScoreTrace();
  drawSweep(null, null);
  drawEnvelopeFocus(null, null);
}

function drawGrid(context, width, height) {
  context.fillStyle = "#02050c";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(143, 184, 255, 0.28)";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 8) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += height / 4) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawTrace(context, values, color, width, height) {
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  values.forEach((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - (clamp(value, 0, 100) / 100) * (height - 16) - 8;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
}

function calculateAudioMetrics(timeData) {
  let sumSquares = 0;
  let peak = 0;
  let clipped = 0;
  for (const value of timeData) {
    const normalized = (value - 128) / 128;
    sumSquares += normalized * normalized;
    peak = Math.max(peak, Math.abs(normalized));
    if (value <= 1 || value >= 254) {
      clipped += 1;
    }
  }

  const rms = Math.sqrt(sumSquares / timeData.length);
  const dbfs = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  return {
    percent: Math.round(clamp(rms * 260, 0, 100)),
    peakPercent: Math.round(clamp(peak * 100, 0, 100)),
    dbfs,
    clipPercent: Math.round((clipped / timeData.length) * 100)
  };
}

function calculateSpectrumStats(frequencyData) {
  const sampleRate = getAudioSampleRate();
  const binHz = sampleRate / (audioAnalyser?.fftSize ?? 2048);
  const firstBin = Math.max(1, Math.floor(20 / binHz));
  const lastBin = Math.min(frequencyData.length - 1, Math.ceil(AUDIO_SPECTRUM_MAX_HZ / binHz));
  let peakValue = 0;
  let peakBin = firstBin;
  let weightedHz = 0;
  let weightTotal = 0;

  for (let bin = firstBin; bin <= lastBin; bin += 1) {
    const value = frequencyData[bin];
    if (value > peakValue) {
      peakValue = value;
      peakBin = bin;
    }
    const weight = value * value;
    weightedHz += bin * binHz * weight;
    weightTotal += weight;
  }

  return {
    peakHz: peakValue > 4 ? peakBin * binHz : null,
    centroidHz: weightTotal > 0 ? weightedHz / weightTotal : null
  };
}

function calculateVoiceMetrics(frequencyData, audioMetrics, spectrumStats, levelHistory = audioLevelHistory) {
  const sampleRate = getAudioSampleRate();
  const binHz = sampleRate / (audioAnalyser?.fftSize ?? 2048);
  const bandEnergy = (startHz, endHz) => {
    const startBin = Math.max(1, Math.floor(startHz / binHz));
    const endBin = Math.min(frequencyData.length - 1, Math.ceil(endHz / binHz));
    let energy = 0;
    let peak = 0;
    let count = 0;
    for (let bin = startBin; bin <= endBin; bin += 1) {
      const value = frequencyData[bin];
      energy += value * value;
      peak = Math.max(peak, value);
      count += 1;
    }
    return { energy, peak, count, mean: count > 0 ? Math.sqrt(energy / count) : 0 };
  };
  const low = bandEnergy(80, 300);
  const voiceLow = bandEnergy(300, 900);
  const voiceMid = bandEnergy(900, 1800);
  const voiceHigh = bandEnergy(1800, 3000);
  const voice = {
    energy: voiceLow.energy + voiceMid.energy + voiceHigh.energy,
    peak: Math.max(voiceLow.peak, voiceMid.peak, voiceHigh.peak),
    mean: Math.sqrt((voiceLow.energy + voiceMid.energy + voiceHigh.energy) / Math.max(1, voiceLow.count + voiceMid.count + voiceHigh.count))
  };
  const high = bandEnergy(3000, AUDIO_SPECTRUM_MAX_HZ);
  const total = low.energy + voice.energy + high.energy;
  const midRatio = total > 0 ? voice.energy / total : 0;
  const lowRatio = total > 0 ? low.energy / total : 0;
  const highRatio = total > 0 ? high.energy / total : 0;
  const peakToMean = voice.mean > 0 ? voice.peak / voice.mean : 0;
  const voiceSubBands = [voiceLow.energy, voiceMid.energy, voiceHigh.energy];
  const voiceSubTotal = voiceSubBands.reduce((sum, value) => sum + value, 0);
  const voiceSpread = voiceSubTotal > 0
    ? voiceSubBands.filter((value) => value / voiceSubTotal >= 0.12).length / voiceSubBands.length
    : 0;
  const dominantVoiceRatio = voiceSubTotal > 0 ? Math.max(...voiceSubBands) / voiceSubTotal : 0;
  const centroid = Number.isFinite(spectrumStats.centroidHz) ? spectrumStats.centroidHz : 0;
  const voiceTextureScore = Math.round(clamp(
    midRatio * 52
      + voiceSpread * 24
      + clamp((peakToMean - 1.1) * 16, 0, 18)
      + clamp(((centroid - 450) / 1500) * 12, 0, 12)
      - highRatio * 34
      - lowRatio * 18
      - clamp((dominantVoiceRatio - 0.78) * 55, 0, 18),
    0,
    100
  ));
  const levelModulation = calculateLevelModulation(levelHistory);
  let score = levelModulation.score;
  score += clamp(audioMetrics.percent * 0.25, 0, 8);
  score += clamp((midRatio - 0.45) * 12, 0, 6);
  score += clamp((peakToMean - 1.25) * 4, 0, 4);
  score += voiceTextureScore * 0.25;
  score -= audioMetrics.clipPercent > 3 ? 12 : 0;
  score -= audioMetrics.dbfs < -58 ? 18 : 0;
  const voiceScore = Math.round(clamp(score, 0, 100));
  return {
    voiceScore,
    voiceLikely: voiceScore >= 38 && audioMetrics.percent >= 2,
    midRatio,
    lowRatio,
    highRatio,
    voiceTextureScore,
    voiceSpread,
    peakToMean,
    levelSpan: levelModulation.span,
    averageLevelDelta: levelModulation.averageDelta,
    levelDirectionChanges: levelModulation.directionChanges
  };
}

function rememberAudioLevel(percent) {
  audioLevelHistory.push(clamp(percent, 0, 100));
  audioLevelHistory = audioLevelHistory.slice(-AUDIO_LEVEL_HISTORY_SIZE);
  return audioLevelHistory;
}

function syncAudioLevelHistoryKey() {
  const scan = latestState?.scan;
  let nextKey = "monitor";
  if (scan?.intent === "ssbHunter" && scan.active) {
    nextKey = scan.hunter?.phase === "seeking"
      ? `hunter-seeking:${scan.bandId ?? getHunterBandId()}:${scan.hunter?.passId ?? 1}`
      : `hunter-${scan.hunter?.phase ?? "active"}:${scan.currentHz}:${scan.tunedAt ?? 0}`;
  } else if (isManualHunterStudy(scan)) {
    nextKey = `hunter-manual:${scan?.bandId ?? getHunterBandId()}`;
  }
  if (nextKey !== audioLevelHistoryKey) {
    audioLevelHistoryKey = nextKey;
    audioLevelHistory = [];
  }
}

function calculateLevelModulation(levels) {
  if (!Array.isArray(levels) || levels.length < 3) {
    return {
      score: 0,
      span: 0,
      averageDelta: 0,
      directionChanges: 0
    };
  }

  const span = Math.max(...levels) - Math.min(...levels);
  const deltas = [];
  let previousDirection = 0;
  let directionChanges = 0;
  for (let index = 1; index < levels.length; index += 1) {
    const delta = levels[index] - levels[index - 1];
    deltas.push(Math.abs(delta));
    const direction = Math.abs(delta) < 0.8 ? 0 : Math.sign(delta);
    if (direction !== 0 && previousDirection !== 0 && direction !== previousDirection) {
      directionChanges += 1;
    }
    if (direction !== 0) {
      previousDirection = direction;
    }
  }

  const averageDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  const score = clamp(span * 3.4 + averageDelta * 8.5 + Math.min(18, directionChanges * 4), 0, 100);
  return {
    score,
    span: Math.round(span * 10) / 10,
    averageDelta: Math.round(averageDelta * 10) / 10,
    directionChanges
  };
}

function updateAudioMeters(audioMetrics, voiceMetrics, spectrumStats) {
  audioLevelDisplay.textContent = `${audioMetrics.percent}%`;
  audioLevelFill.style.width = `${audioMetrics.percent}%`;
  peakDisplay.textContent = formatAudioFrequency(spectrumStats.peakHz);
  centroidDisplay.textContent = formatAudioFrequency(spectrumStats.centroidHz);
  dbDisplay.textContent = Number.isFinite(audioMetrics.dbfs) ? `${Math.max(-99, audioMetrics.dbfs).toFixed(1)} dBFS` : "--";
  if (!latestState?.scan?.hunter) {
    modulationDisplay.textContent = String(voiceMetrics.voiceScore);
    modulationFill.style.width = `${voiceMetrics.voiceScore}%`;
  }
}

function formatAudioError(error) {
  if (error?.name === "NotAllowedError" || /permission|denied|notallowed/i.test(error?.message ?? "")) {
    return "Audio blocked";
  }
  return `Audio failed: ${error?.message ?? "unknown"}`;
}

function setStatus(text) {
  statusText.textContent = text;
}

function setAudioStatus(text) {
  audioStatusDisplay.textContent = text;
}

function formatRange(range) {
  if (!range) {
    return "--";
  }
  return `${formatFrequency(range.startHz)}-${formatFrequency(range.endHz)}`;
}

function formatFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "--.---.---";
  }
  const mhz = Math.floor(hz / 1_000_000);
  const khz = Math.floor((hz % 1_000_000) / 1_000);
  const rest = hz % 1_000;
  return `${mhz}.${String(khz).padStart(3, "0")}.${String(rest).padStart(3, "0")}`;
}

function hzToMhz(hz) {
  return Number.isFinite(hz) ? (hz / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function formatCountdown(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "--";
  }
  return `${Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))}s`;
}

function formatAudioFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "-- Hz";
  }
  return hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${Math.round(hz)} Hz`;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : "--";
}

function getAudioSampleRate() {
  return audioContext?.sampleRate ?? 48_000;
}

function byteToAnalyserDb(value) {
  return AUDIO_SPECTRUM_MIN_DB + (value / 255) * (AUDIO_SPECTRUM_MAX_DB - AUDIO_SPECTRUM_MIN_DB);
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.min(max, Math.max(min, number));
}
