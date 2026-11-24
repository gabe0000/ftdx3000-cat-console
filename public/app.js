import { bandIdToAdifBand } from "./band-plan.js";
import { canSyncRangeReadback } from "./range-readback.js";

const portSelect = document.querySelector("#portSelect");
const baudSelect = document.querySelector("#baudSelect");
const pollSelect = document.querySelector("#pollSelect");
const rtsSelect = document.querySelector("#rtsSelect");
const stopBitsSelect = document.querySelector("#stopBitsSelect");
const refreshButton = document.querySelector("#refreshButton");
const connectButton = document.querySelector("#connectButton");
const disconnectButton = document.querySelector("#disconnectButton");
const applyPresetButton = document.querySelector("#applyPresetButton");
const atuTuneButton = document.querySelector("#atuTuneButton");
const radioPowerButton = document.querySelector("#radioPowerButton");
const rigPowerButton = document.querySelector("#rigPowerButton");
const runConnectButton = document.querySelector("#runConnectButton");
const runDisconnectButton = document.querySelector("#runDisconnectButton");
const tuneKeysToggle = document.querySelector("#tuneKeysToggle");
const pttArmToggle = document.querySelector("#pttArmToggle");
const pttStatusDisplay = document.querySelector("#pttStatusDisplay");
const connectionLight = document.querySelector("#connectionLight");
const statusText = document.querySelector("#statusText");
const updatedText = document.querySelector("#updatedText");
const bandNameDisplay = document.querySelector("#bandNameDisplay");
const hfBandTab = document.querySelector("#hfBandTab");
const phoneBandControl = document.querySelector("#phoneBandControl");
const phoneBandSelect = document.querySelector("#phoneBandSelect");
const phoneBandRange = document.querySelector("#phoneBandRange");
const bandPresetDisplay = document.querySelector("#bandPresetDisplay");
const frequencyDisplay = document.querySelector("#frequencyDisplay");
const operatorJournalStatus = document.querySelector("#operatorJournalStatus");
const operatorJournalInput = document.querySelector("#operatorJournalInput");
const operatorJournalFullButton = document.querySelector("#operatorJournalFullButton");
const operatorJournalSubmitButton = document.querySelector("#operatorJournalSubmitButton");
const operatorJournalEntries = document.querySelector("#operatorJournalEntries");
const operatorJournalOlderButton = document.querySelector("#operatorJournalOlderButton");
const operatorJournalNewerButton = document.querySelector("#operatorJournalNewerButton");
const operatorJournalLatestButton = document.querySelector("#operatorJournalLatestButton");
const cockpitFrequencyLabel = document.querySelector("#cockpitFrequencyLabel");
const cockpitFrequencyDisplay = document.querySelector("#cockpitFrequencyDisplay");
const cockpitFrequencySlider = document.querySelector("#cockpitFrequencySlider");
const cockpitClarifierDisplay = document.querySelector("#cockpitClarifierDisplay");
const cockpitClarifierSlider = document.querySelector("#cockpitClarifierSlider");
const cockpitClarifierCenterButton = document.querySelector("#cockpitClarifierCenterButton");
const potaButton = document.querySelector("#potaButton");
const logContactButton = document.querySelector("#logContactButton");
const manualFrequencyButton = document.querySelector("#manualFrequencyButton");
const modeDisplay = document.querySelector("#modeDisplay");
const modelDisplay = document.querySelector("#modelDisplay");
const lastCommandDisplay = document.querySelector("#lastCommandDisplay");
const meterRawDisplay = document.querySelector("#meterRawDisplay");
const meterPercentDisplay = document.querySelector("#meterPercentDisplay");
const meterFill = document.querySelector("#meterFill");
const meterNeedle = document.querySelector("#meterNeedle");
const powerMeterRawDisplay = document.querySelector("#powerMeterRawDisplay");
const powerMeterPercentDisplay = document.querySelector("#powerMeterPercentDisplay");
const powerMeterFill = document.querySelector("#powerMeterFill");
const powerMeterNeedle = document.querySelector("#powerMeterNeedle");
const swrMeterRawDisplay = document.querySelector("#swrMeterRawDisplay");
const swrMeterPercentDisplay = document.querySelector("#swrMeterPercentDisplay");
const swrMeterFill = document.querySelector("#swrMeterFill");
const swrMeterNeedle = document.querySelector("#swrMeterNeedle");
const rfGainDisplay = document.querySelector("#rfGainDisplay");
const rfGainSlider = document.querySelector("#rfGainSlider");
const scanThresholdSelect = document.querySelector("#scanThresholdSelect");
const scanStepSelect = document.querySelector("#scanStepSelect");
const scanDwellSlider = document.querySelector("#scanDwellSlider");
const scanDwellDisplay = document.querySelector("#scanDwellDisplay");
const regularScanDwellSlider = document.querySelector("#regularScanDwellSlider");
const regularScanDwellDisplay = document.querySelector("#regularScanDwellDisplay");
const scanRateDisplay = document.querySelector("#scanRateDisplay");
const readableScanToggle = document.querySelector("#readableScanToggle");
const busyAssistToggle = document.querySelector("#busyAssistToggle");
const smartListToggle = document.querySelector("#smartListToggle");
const regularScanSourceSelect = document.querySelector("#regularScanSourceSelect");
const regularScanStepSelect = document.querySelector("#regularScanStepSelect");
const startScanButton = document.querySelector("#startScanButton");
const busyScanButton = document.querySelector("#busyScanButton");
const ssbHunterButton = document.querySelector("#ssbHunterButton");
const ssbHunterFallbackLink = document.querySelector("#ssbHunterFallbackLink");
const mainHunterBandSelect = document.querySelector("#mainHunterBandSelect");
const hunterConnectButton = document.querySelector("#hunterConnectButton");
const hunterDisconnectButton = document.querySelector("#hunterDisconnectButton");
const hunterFrame = document.querySelector("#hunterFrame");
const potaBandStatus = document.querySelector("#potaBandStatus");
const potaFrame = document.querySelector("#potaFrame");
const newLoggerContactButton = document.querySelector("#newLoggerContactButton");
const loggerFrame = document.querySelector("#loggerFrame");
const stopScanButton = document.querySelector("#stopScanButton");
const benchmarkScanButton = document.querySelector("#benchmarkScanButton");
const benchmarkResults = document.querySelector("#benchmarkResults");
const scanStatus = document.querySelector("#scanStatus");
const scanHits = document.querySelector("#scanHits");
const clearSkipsButton = document.querySelector("#clearSkipsButton");
const scanRangeDisplay = document.querySelector("#scanRangeDisplay");
const channelPanel = document.querySelector("#channelPanel");
const channelGrid = document.querySelector("#channelGrid");
const channelPresetDisplay = document.querySelector("#channelPresetDisplay");
const channelModeDisplay = document.querySelector("#channelModeDisplay");
const channelSlider = document.querySelector("#channelSlider");
const channelSliderLabel = document.querySelector("#channelSliderLabel");
const channelSliderDisplay = document.querySelector("#channelSliderDisplay");
const channelSliderModeButtons = document.querySelectorAll("[data-slider-mode]");
const audioInputSelect = document.querySelector("#audioInputSelect");
const refreshAudioInputsButton = document.querySelector("#refreshAudioInputsButton");
const startAudioProbeButton = document.querySelector("#startAudioProbeButton");
const stopAudioProbeButton = document.querySelector("#stopAudioProbeButton");
const audioStatusText = document.querySelector("#audioStatusText");
const audioLevelDisplay = document.querySelector("#audioLevelDisplay");
const audioLevelFill = document.querySelector("#audioLevelFill");
const audioMonitorToggle = document.querySelector("#audioMonitorToggle");
const audioMonitorVolumeSlider = document.querySelector("#audioMonitorVolumeSlider");
const audioMonitorVolumeDisplay = document.querySelector("#audioMonitorVolumeDisplay");
const audioTestStatusText = document.querySelector("#audioTestStatusText");
const audioTestStartButton = document.querySelector("#audioTestStartButton");
const audioTestStopButton = document.querySelector("#audioTestStopButton");
const audioTestInputText = document.querySelector("#audioTestInputText");
const audioTestVolumeDisplay = document.querySelector("#audioTestVolumeDisplay");
const audioTestVolumeSlider = document.querySelector("#audioTestVolumeSlider");
const diagnosticsMonitorVolumeDisplay = document.querySelector("#diagnosticsMonitorVolumeDisplay");
const diagnosticsMonitorVolumeSlider = document.querySelector("#diagnosticsMonitorVolumeSlider");
const autoMicPeakButton = document.querySelector("#autoMicPeakButton");
const applyMicPeakButton = document.querySelector("#applyMicPeakButton");
const txAudioStatusText = document.querySelector("#txAudioStatusText");
const radioMonitorToggle = document.querySelector("#radioMonitorToggle");
const radioMonitorLevelDisplay = document.querySelector("#radioMonitorLevelDisplay");
const radioMonitorLevelSlider = document.querySelector("#radioMonitorLevelSlider");
const diagnosticsRadioMonitorToggle = document.querySelector("#diagnosticsRadioMonitorToggle");
const diagnosticsRadioMonitorLevelDisplay = document.querySelector("#diagnosticsRadioMonitorLevelDisplay");
const diagnosticsRadioMonitorLevelSlider = document.querySelector("#diagnosticsRadioMonitorLevelSlider");
const micGainDisplay = document.querySelector("#micGainDisplay");
const micGainSlider = document.querySelector("#micGainSlider");
const processorToggle = document.querySelector("#processorToggle");
const processorLevelDisplay = document.querySelector("#processorLevelDisplay");
const processorLevelSlider = document.querySelector("#processorLevelSlider");
const parametricEqToggle = document.querySelector("#parametricEqToggle");
const autoMicPeakStatus = document.querySelector("#autoMicPeakStatus");
const audioTestReturnDisplay = document.querySelector("#audioTestReturnDisplay");
const audioTestReturnFill = document.querySelector("#audioTestReturnFill");
const audioTestDbfsDisplay = document.querySelector("#audioTestDbfsDisplay");
const audioTestClipDisplay = document.querySelector("#audioTestClipDisplay");
const audioTestVoiceDisplay = document.querySelector("#audioTestVoiceDisplay");
const audioTestModulationDisplay = document.querySelector("#audioTestModulationDisplay");
const audioTestPeakDisplay = document.querySelector("#audioTestPeakDisplay");
const audioTestWaveformSummary = document.querySelector("#audioTestWaveformSummary");
const audioTestSpectrumSummary = document.querySelector("#audioTestSpectrumSummary");
const audioTestWaveCanvas = document.querySelector("#audioTestWaveCanvas");
const audioTestSpectrumCanvas = document.querySelector("#audioTestSpectrumCanvas");
const audioTestBalanceDisplay = document.querySelector("#audioTestBalanceDisplay");
const audioTestDiagnosisText = document.querySelector("#audioTestDiagnosisText");
const audioSpectrumSpanDisplay = document.querySelector("#audioSpectrumSpanDisplay");
const audioPeakDisplay = document.querySelector("#audioPeakDisplay");
const audioCentroidDisplay = document.querySelector("#audioCentroidDisplay");
const audioDbDisplay = document.querySelector("#audioDbDisplay");
const audioClipDisplay = document.querySelector("#audioClipDisplay");
const audioSpectrumCanvas = document.querySelector("#audioSpectrumCanvas");
const allowlistDisplay = document.querySelector("#allowlistDisplay");
const messageLog = document.querySelector("#messageLog");
const diagnosticsRefreshButton = document.querySelector("#diagnosticsRefreshButton");
const diagnosticsFreezeToggle = document.querySelector("#diagnosticsFreezeToggle");
const copyDiagnosticsButton = document.querySelector("#copyDiagnosticsButton");
const diagnosticsSnapshotTime = document.querySelector("#diagnosticsSnapshotTime");
const diagnosticsConnectionSummary = document.querySelector("#diagnosticsConnectionSummary");
const diagnosticsFrequencySummary = document.querySelector("#diagnosticsFrequencySummary");
const diagnosticsScanSummary = document.querySelector("#diagnosticsScanSummary");
const diagnosticsAudioSummary = document.querySelector("#diagnosticsAudioSummary");
const diagnosticsLinkGrid = document.querySelector("#diagnosticsLinkGrid");
const diagnosticsRadioGrid = document.querySelector("#diagnosticsRadioGrid");
const diagnosticsScanGrid = document.querySelector("#diagnosticsScanGrid");
const diagnosticsAudioGrid = document.querySelector("#diagnosticsAudioGrid");
const diagnosticsSafetyGrid = document.querySelector("#diagnosticsSafetyGrid");
const diagnosticsStorageGrid = document.querySelector("#diagnosticsStorageGrid");
const diagnosticsHunterDump = document.querySelector("#diagnosticsHunterDump");
const qrzLogbookStatus = document.querySelector("#qrzLogbookStatus");
const qrzRangeSelect = document.querySelector("#qrzRangeSelect");
const qsoCardFilterSelect = document.querySelector("#qsoCardFilterSelect");
const qrzStatusButton = document.querySelector("#qrzStatusButton");
const qrzRefreshButton = document.querySelector("#qrzRefreshButton");
const qrzLogbookBody = document.querySelector("#qrzLogbookBody");
const qrzMapCanvas = document.querySelector("#qrzMapCanvas");
const qrzMapPins = document.querySelector("#qrzMapPins");
const qrzMapSummary = document.querySelector("#qrzMapSummary");
const bandLogbookStatus = document.querySelector("#bandLogbookStatus");
const bandLogbookHeadRow = document.querySelector("#bandLogbookHeadRow");
const bandLogbookBody = document.querySelector("#bandLogbookBody");
const bandLogbookRefreshButton = document.querySelector("#bandLogbookRefreshButton");
const bandPotaPanel = document.querySelector("#bandPotaPanel");
const bandPotaStatus = document.querySelector("#bandPotaStatus");
const bandPotaList = document.querySelector("#bandPotaList");
const bandPotaRefreshButton = document.querySelector("#bandPotaRefreshButton");
const cbLocalLogStatus = document.querySelector("#cbLocalLogStatus");
const cbLocalLogBody = document.querySelector("#cbLocalLogBody");
const tabButtons = document.querySelectorAll(".tab");
const modeButtons = document.querySelectorAll(".mode-button");
const views = {
  run: document.querySelector("#runView"),
  hunter: document.querySelector("#hunterView"),
  pota: document.querySelector("#potaView"),
  audioTest: document.querySelector("#audioTestView"),
  logger: document.querySelector("#loggerView"),
  logbook: document.querySelector("#logbookView"),
  diagnostics: document.querySelector("#diagnosticsView")
};
const RF_GAIN_LIVE_THROTTLE_MS = 120;
const CHANNEL_TUNE_THROTTLE_MS = 120;
const BENCHMARK_DWELL_VALUES = Object.freeze([100, 50, 30, 20, 15, 10, 5]);
const PREFERRED_AUDIO_INPUT_PATTERN = /usb audio codec|yaesu|ftdx|burr-brown/i;
const AUDIO_SPECTRUM_MAX_HZ = 4000;
const AUDIO_SPECTRUM_MIN_DB = -90;
const AUDIO_SPECTRUM_MAX_DB = -10;
const AUDIO_SCAN_SAMPLE_INTERVAL_MS = 15;
const AUDIO_LEVEL_HISTORY_SIZE = 18;
const AUDIO_DEFAULT_MONITOR_VOLUME = 0;
const TX_AUDIO_LIVE_THROTTLE_MS = 180;
const AUTO_MIC_PEAK_RUN_MS = 8000;
const AUTO_MIC_TARGET_PEAK_DBFS = -12;
const SMART_SCAN_DURATION_MS = 30_000;
const FREQUENCY_SLIDER_STEP_HZ = 10;
const PTT_TIMEOUT_MS = 120_000;
const QRZ_LOGBOOK_MAX_PAGES = 40;
const CB_LOCAL_LOG_STORAGE_KEY = "yeasuCatCbLocalLog";
const QSO_CARD_QUEUE_STORAGE_KEY = "yeasuCatQsoCardQueue";
const RADIO_POWER_STORAGE_KEY = "yeasuCatRadioPower";
const BAND_FAVORITES_STORAGE_KEY = "yeasuCatBandFavorites";
const OPERATOR_JOURNAL_STORAGE_KEY = "yeasuCatOperatorJournal";
const OPERATOR_JOURNAL_MAX_ENTRIES = 250;
const CB_MIN_MHZ = 26.965;
const CB_MAX_MHZ = 27.405;
const DIAGNOSTICS_REFRESH_MS = 1000;
const BAND_POTA_REFRESH_MS = 2 * 60_000;
const BAND_POTA_VISIBLE_LIMIT = 12;

let socket = null;
let connected = false;
let receivedInitialCatState = false;
let radioPowered = localStorage.getItem(RADIO_POWER_STORAGE_KEY) !== "off";
let pendingStandbyAutoTune = false;
let lastRigPowerOn = null;
let lastLoggedRxCount = 0;
let scanActive = false;
let benchmarkRunning = false;
let lastScanState = null;
let lastRfGainSentAt = 0;
let lastRfGainSentValue = null;
let pendingRfGainValue = null;
let rfGainSendTimer = null;
let lastChannelSentAt = 0;
let lastChannelSentNumber = null;
let pendingChannelNumber = null;
let channelTuneTimer = null;
let lastFrequencySliderSentAt = 0;
let lastFrequencySliderSentHz = null;
let pendingFrequencySliderHz = null;
let frequencySliderTimer = null;
let channelSliderUserEditingUntil = 0;
let cockpitFrequencyUserEditingUntil = 0;
let lastCockpitClarifierSentAt = 0;
let lastCockpitClarifierSentHz = null;
let pendingCockpitClarifierHz = null;
let cockpitClarifierTuneTimer = null;
let cockpitClarifierOffsetHz = 0;
let cockpitClarifierBaseHz = null;
let atuTuneArmedUntil = 0;
let atuTuneArmTimer = null;
let activeBandId = "10m";
let bandProfiles = {};
let baseBandProfiles = {};
let selectedChannelNumber = null;
let channelSliderMode = "frequency";
let lastKnownHz = null;
let latestCatState = null;
let qrzAllRecords = [];
let qrzRecords = [];
let cbLocalRecords = loadLocalCbRecords();
let operatorJournalEntriesData = loadOperatorJournalEntries();
let operatorJournalIndex = 0;
let qrzLoadedOnce = false;
let qrzWorldMapData = null;
let qrzWorldMapPromise = null;
let audioStream = null;
let audioContext = null;
let audioSourceNode = null;
let audioAnalyser = null;
let audioMonitorGainNode = null;
let audioMonitorLimiterNode = null;
let audioMonitorConnected = false;
let audioFrequencyData = null;
let audioTimeData = null;
let audioLevelHistory = [];
let audioLevelHistoryKey = null;
let latestAudioSnapshot = null;
let audioAnimationFrame = null;
let lastAudioScanSampleAt = 0;
let macAudioInputs = [];
let autoAudioDefaultAttempted = false;
let pttActive = false;
let pttKeyDown = false;
let pttTimeoutTimer = null;
let lastDiagnosticsRenderAt = 0;
let diagnosticsLogEntries = [];
let diagnosticsLogRenderTimer = null;
let bandPotaSpots = [];
let bandPotaLoadingKey = "";
let bandPotaLoadedKey = "";
let bandPotaRequestId = 0;
let bandPotaError = "";
let bandPotaRefreshTimer = null;
let txAudioSendTimer = null;
let pendingTxAudioValue = null;
let lastTxAudioSentAt = 0;
let lastTxAudioSentKey = null;
let lastTxAudioSentValue = null;
let autoMicPeakRun = null;
let suggestedMicGainValue = null;

refreshButton.addEventListener("click", refreshPorts);
connectButton.addEventListener("click", connectCat);
disconnectButton.addEventListener("click", disconnect);
runConnectButton.addEventListener("click", connectCat);
runDisconnectButton.addEventListener("click", disconnect);
hunterConnectButton.addEventListener("click", connectCat);
hunterDisconnectButton.addEventListener("click", disconnect);
radioPowerButton.addEventListener("click", toggleRadioPower);
phoneBandSelect.addEventListener("change", () => selectRunBand(phoneBandSelect.value));
rigPowerButton.addEventListener("click", handleRigPowerClick);
tuneKeysToggle.addEventListener("change", setTuneKeys);
pttArmToggle.addEventListener("change", handlePttArmChange);
startScanButton.addEventListener("click", startScan);
busyScanButton.addEventListener("click", startBusyScan);
ssbHunterButton.addEventListener("click", openSsbHunterDashboard);
mainHunterBandSelect.addEventListener("change", handleMainHunterBandChange);
hunterFrame.addEventListener("load", () => {
  syncHunterFrameBand();
  syncHunterFrameVisibility(currentViewName());
  syncHunterFramePower();
});
potaFrame.addEventListener("load", handlePotaFrameLoad);
newLoggerContactButton.addEventListener("click", () => openContactLoggerTab());
potaButton.addEventListener("click", () => openPotaSpotsTab());
logContactButton.addEventListener("click", () => openContactLoggerTab());
manualFrequencyButton.addEventListener("click", () => openManualFrequencyPopout());
stopScanButton.addEventListener("click", stopScan);
benchmarkScanButton.addEventListener("click", runScanBenchmark);
scanDwellSlider.addEventListener("input", handleScanDwellInput);
scanDwellSlider.addEventListener("change", handleScanDwellInput);
regularScanDwellSlider.addEventListener("input", handleRegularScanDwellInput);
regularScanDwellSlider.addEventListener("change", handleRegularScanDwellInput);
readableScanToggle.addEventListener("change", syncScanControls);
busyAssistToggle.addEventListener("change", syncScanControls);
smartListToggle.addEventListener("change", setSmartListEnabled);
regularScanSourceSelect.addEventListener("change", handleRegularScanOptionsChange);
regularScanStepSelect.addEventListener("change", handleRegularScanOptionsChange);
scanHits.addEventListener("click", handleHitClick);
clearSkipsButton.addEventListener("click", clearScanSkips);
channelGrid.addEventListener("click", handleChannelClick);
channelSlider.addEventListener("input", handleChannelSliderInput);
channelSlider.addEventListener("change", handleChannelSliderChange);
channelSliderModeButtons.forEach((button) => button.addEventListener("click", () => setChannelSliderMode(button.dataset.sliderMode)));
cockpitFrequencySlider.addEventListener("input", handleCockpitFrequencySliderInput);
cockpitFrequencySlider.addEventListener("change", handleCockpitFrequencySliderChange);
cockpitClarifierSlider.addEventListener("input", handleCockpitClarifierInput);
cockpitClarifierSlider.addEventListener("change", handleCockpitClarifierInput);
cockpitClarifierCenterButton.addEventListener("click", centerCockpitClarifier);
atuTuneButton.addEventListener("click", handleAtuTuneClick);
refreshAudioInputsButton.addEventListener("click", async () => {
  await refreshMacAudioInputs();
  await refreshAudioInputs();
});
startAudioProbeButton.addEventListener("click", startAudioProbe);
stopAudioProbeButton.addEventListener("click", stopAudioProbe);
audioMonitorToggle.addEventListener("change", handleAudioMonitorChange);
audioMonitorVolumeSlider.addEventListener("input", handleAudioMonitorVolumeInput);
audioMonitorVolumeSlider.addEventListener("change", handleAudioMonitorVolumeInput);
audioTestStartButton.addEventListener("click", startAudioProbe);
audioTestStopButton.addEventListener("click", stopAudioProbe);
audioTestVolumeSlider.addEventListener("input", handleAudioTestVolumeInput);
audioTestVolumeSlider.addEventListener("change", handleAudioTestVolumeInput);
diagnosticsMonitorVolumeSlider.addEventListener("input", handleDiagnosticsMonitorVolumeInput);
diagnosticsMonitorVolumeSlider.addEventListener("change", handleDiagnosticsMonitorVolumeInput);
autoMicPeakButton.addEventListener("click", startAutoMicPeak);
applyMicPeakButton.addEventListener("click", applySuggestedMicGain);
radioMonitorToggle.addEventListener("change", handleRadioMonitorToggle);
diagnosticsRadioMonitorToggle.addEventListener("change", handleRadioMonitorToggle);
radioMonitorLevelSlider.addEventListener("input", handleRadioMonitorLevelInput);
radioMonitorLevelSlider.addEventListener("change", flushRadioMonitorLevel);
diagnosticsRadioMonitorLevelSlider.addEventListener("input", handleRadioMonitorLevelInput);
diagnosticsRadioMonitorLevelSlider.addEventListener("change", flushRadioMonitorLevel);
micGainSlider.addEventListener("input", handleMicGainInput);
micGainSlider.addEventListener("change", flushMicGain);
processorLevelSlider.addEventListener("input", handleProcessorLevelInput);
processorLevelSlider.addEventListener("change", flushProcessorLevel);
processorToggle.addEventListener("change", handleProcessorToggle);
parametricEqToggle.addEventListener("change", handleParametricEqToggle);
applyPresetButton.addEventListener("click", applyBandPreset);
rfGainSlider.addEventListener("input", handleRfGainInput);
rfGainSlider.addEventListener("change", setRfGain);
qrzStatusButton.addEventListener("click", loadQrzStatus);
qrzRefreshButton.addEventListener("click", loadQrzLogbook);
qrzRangeSelect.addEventListener("change", applyQrzRangeFilter);
qsoCardFilterSelect.addEventListener("change", applyQrzRangeFilter);
qrzLogbookBody.addEventListener("click", handleQrzTableClick);
bandLogbookBody.addEventListener("click", handleCbLogClick);
cbLocalLogBody.addEventListener("click", handleCbLogClick);
bandLogbookRefreshButton.addEventListener("click", refreshBandLogbook);
bandPotaRefreshButton.addEventListener("click", () => loadBandPotaSpots({ force: true, showLoading: true }));
bandPotaList.addEventListener("click", handleBandPotaClick);
operatorJournalFullButton?.addEventListener("click", openOperatorJournalWindow);
operatorJournalSubmitButton?.addEventListener("click", submitOperatorJournalNote);
operatorJournalInput?.addEventListener("keydown", handleOperatorJournalKeyDown);
operatorJournalOlderButton?.addEventListener("click", showOlderOperatorJournalNote);
operatorJournalNewerButton?.addEventListener("click", showNewerOperatorJournalNote);
operatorJournalLatestButton?.addEventListener("click", showLatestOperatorJournalNote);
diagnosticsRefreshButton.addEventListener("click", () => renderDiagnosticsSnapshot({ force: true }));
diagnosticsFreezeToggle.addEventListener("change", () => renderDiagnosticsSnapshot({ force: true }));
copyDiagnosticsButton.addEventListener("click", copyDiagnosticsSnapshot);
window.addEventListener("resize", () => drawQrzWorldMap());
window.addEventListener("hashchange", applyRouteFromHash);
window.addEventListener("storage", handleOperatorJournalStorage);
document.addEventListener("keydown", handleKeyDown, { capture: true });
document.addEventListener("keyup", handleKeyUp, { capture: true });
document.addEventListener("keypress", handlePttTextKey, { capture: true });
document.addEventListener("beforeinput", handlePttBeforeInput, { capture: true });
document.addEventListener("input", removePttCharacterFromField, { capture: true });
window.addEventListener("message", handleAppMessage);
window.addEventListener("blur", () => releasePtt("window blur"));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    releasePtt("page hidden");
  }
  syncHunterFrameVisibility(currentViewName());
});
window.addEventListener("pagehide", () => releasePtt("page hidden"));
window.addEventListener("beforeunload", () => {
  releasePtt("unload");
  stopAudioProbe({ keepStatus: true });
});
tabButtons.forEach((button) => button.addEventListener("click", () => handleTabClick(button)));
modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

setDefaultAudioMonitor();
drawEmptyAudioSpectrum();
drawEmptyAudioTest();
resetAudioSpectrumStats();
renderAudioMonitorVolume();
renderAudioTestControls();
syncAudioProbeControls();
syncTxAudioControls();
renderCbLocalLogbook();
renderOperatorJournal();
applyRadioPowerState({ notifyServer: false, quiet: true });
renderDiagnosticsSnapshot({ force: true });
renderDiagnosticsLog();
setInterval(renderDiagnosticsSnapshot, DIAGNOSTICS_REFRESH_MS);

if (location.protocol === "file:") {
  renderFileMode();
} else {
  await loadConfig();
  await refreshMacAudioInputs();
  await refreshAudioInputs();
  await refreshPorts();
  connectWebSocket();
  void ensureDefaultAudioMonitor({ once: true, startInput: false });
}

applyRouteFromHash();

async function loadConfig() {
  const response = await fetch("/api/config");
  const config = await response.json();
  baseBandProfiles = config.bands ?? {};
  bandProfiles = applyFavoriteOverrides(baseBandProfiles);
  activeBandId = config.defaultBandId ?? activeBandId;
  allowlistDisplay.textContent = `${config.readOnlyCommands.join(", ")}, FA set, RG set, AC tune, TX PTT, PS rig power`;
  pollSelect.value = String(config.defaultPollMs ?? 250);
  rtsSelect.value = config.defaultRtsHigh ? "high" : "low";
  stopBitsSelect.value = String(config.defaultStopBits ?? 2);
  smartListToggle.checked = config.scan?.defaultSmartList !== false;
  buildScanOptions(config.scan);
  renderPhoneBandOptions();
  renderMainHunterBandOptions();
  setActiveBand(activeBandId);
  scheduleBandPotaRefresh();
  void loadQrzConfig();
  void ensureBandLogbookLoaded();
}

async function loadQrzConfig() {
  try {
    const response = await fetch("/api/qrz/config");
    const data = await response.json();
    qrzLogbookStatus.textContent = data.configured ? "Ready" : "Set QRZ_LOGBOOK_KEY";
  } catch {
    qrzLogbookStatus.textContent = "QRZ unavailable";
  }
}

async function refreshPorts() {
  portSelect.replaceChildren(new Option("Scanning...", ""));

  try {
    const response = await fetch("/api/ports");
    const data = await response.json();
    const ports = data.ports ?? [];
    portSelect.replaceChildren();

    if (ports.length === 0) {
      portSelect.append(new Option("No serial ports found", ""));
      return;
    }

    for (const port of ports) {
      const suffix = [
        port.recommended ? "recommended CAT" : "",
        port.blocked ? "blocked TX-control risk" : "",
        port.manufacturer
      ].filter(Boolean).join(" / ");
      const option = new Option(`${port.path}${suffix ? ` (${suffix})` : ""}`, port.path);
      option.disabled = port.blocked;
      portSelect.append(option);
    }

    const recommended = ports.find((port) => port.recommended && !port.blocked);
    if (recommended) {
      portSelect.value = recommended.path;
    }
  } catch (error) {
    portSelect.replaceChildren(new Option(`Port scan failed: ${error.message}`, ""));
  }
}

async function refreshMacAudioInputs() {
  if (location.protocol === "file:") {
    macAudioInputs = [];
    return [];
  }

  try {
    const response = await fetch("/api/audio-inputs");
    const data = await response.json();
    macAudioInputs = data.inputs ?? [];
    return macAudioInputs;
  } catch {
    macAudioInputs = [];
    return [];
  }
}

async function refreshAudioInputs(preferredDeviceId = audioInputSelect.value) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    audioInputSelect.replaceChildren(disabledAudioOption("Browser audio unavailable"));
    setAudioProbeStatus("Browser audio unavailable");
    syncAudioProbeControls();
    return [];
  }

  const previousDisabled = audioInputSelect.disabled;
  audioInputSelect.disabled = true;
  audioInputSelect.replaceChildren(new Option("Scanning audio...", ""));

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === "audioinput");
    audioInputSelect.replaceChildren();

    if (inputs.length === 0) {
      audioInputSelect.append(disabledAudioOption("No audio inputs found"));
      setAudioProbeStatus("No audio inputs found");
      syncAudioProbeControls();
      return [];
    }

    inputs.forEach((device, index) => {
      const label = device.label || `Input ${index + 1} (browser label hidden)`;
      audioInputSelect.append(new Option(label, device.deviceId));
    });

    const selectedDevice = inputs.find((device) => device.deviceId === preferredDeviceId)
      ?? inputs.find((device) => PREFERRED_AUDIO_INPUT_PATTERN.test(device.label))
      ?? inputs.find((device) => device.deviceId === "default")
      ?? inputs[0];
    audioInputSelect.value = selectedDevice.deviceId;

    if (audioStream) {
      setAudioProbeStatus(`Audio probe running${selectedDevice.label ? `: ${selectedDevice.label}` : ""}`);
    } else if (inputs.every((device) => !device.label)) {
      setAudioProbeStatus(formatHiddenAudioLabelStatus());
    } else {
      setAudioProbeStatus("Ready");
    }

    return inputs;
  } catch (error) {
    audioInputSelect.replaceChildren(disabledAudioOption("Audio scan failed"));
    setAudioProbeStatus(`Audio scan failed: ${error.message}`);
    return [];
  } finally {
    audioInputSelect.disabled = previousDisabled && !audioStream;
    syncAudioProbeControls();
  }
}

function setDefaultAudioMonitor(options = {}) {
  audioMonitorToggle.checked = true;
  if (options.resetVolume !== false) {
    audioMonitorVolumeSlider.value = String(AUDIO_DEFAULT_MONITOR_VOLUME);
  }
  renderAudioMonitorVolume();
  syncAudioMonitor();
  syncAudioProbeControls();
}

async function ensureDefaultAudioMonitor(options = {}) {
  if (options.once && autoAudioDefaultAttempted) {
    return;
  }

  if (options.once) {
    autoAudioDefaultAttempted = true;
  }

  setDefaultAudioMonitor({ resetVolume: options.resetVolume === true });
  if (options.startInput === false) {
    return;
  }

  if (audioStream || !navigator.mediaDevices?.getUserMedia) {
    return;
  }

  const hasInput = Array.from(audioInputSelect.options).some((option) => !option.disabled);
  if (!hasInput) {
    return;
  }

  await startAudioProbe();
}

async function startAudioProbe() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setAudioProbeStatus("Browser audio unavailable");
    syncAudioProbeControls();
    return;
  }

  startAudioProbeButton.disabled = true;
  setAudioProbeStatus("Starting audio...");

  let stream = null;
  try {
    const requestedDeviceId = audioInputSelect.value;
    stream = await requestAudioStream(requestedDeviceId);
    const currentDeviceId = getStreamDeviceId(stream);
    const inputs = await refreshAudioInputs(currentDeviceId ?? requestedDeviceId);
    const preferredInput = inputs.find((device) => PREFERRED_AUDIO_INPUT_PATTERN.test(device.label));

    if (preferredInput?.deviceId && preferredInput.deviceId !== currentDeviceId) {
      stopMediaStream(stream);
      audioInputSelect.value = preferredInput.deviceId;
      stream = await requestAudioStream(preferredInput.deviceId);
    }

    await attachAudioStream(stream);
    stream = null;
    await refreshAudioInputs(audioInputSelect.value);
    logMessage("Audio probe started.");
  } catch (error) {
    if (stream) {
      stopMediaStream(stream);
    }
    stopAudioProbe({ keepStatus: true });
    const message = formatAudioError(error);
    setAudioProbeStatus(message);
    logMessage(message);
  } finally {
    syncAudioProbeControls();
  }
}

function requestAudioStream(deviceId) {
  const audio = {
    autoGainControl: false,
    echoCancellation: false,
    noiseSuppression: false
  };

  if (deviceId && deviceId !== "default") {
    audio.deviceId = { exact: deviceId };
  }

  return navigator.mediaDevices.getUserMedia({ audio, video: false });
}

async function attachAudioStream(stream) {
  stopAudioProbe({ keepStatus: true });
  audioStream = stream;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContextConstructor();
  audioSourceNode = audioContext.createMediaStreamSource(audioStream);
  audioAnalyser = audioContext.createAnalyser();
  audioMonitorGainNode = audioContext.createGain();
  audioMonitorLimiterNode = audioContext.createDynamicsCompressor();
  audioAnalyser.fftSize = 2048;
  audioAnalyser.smoothingTimeConstant = 0.76;
  audioAnalyser.minDecibels = AUDIO_SPECTRUM_MIN_DB;
  audioAnalyser.maxDecibels = AUDIO_SPECTRUM_MAX_DB;
  audioLevelHistory = [];
  audioMonitorGainNode.gain.value = getAudioMonitorGain();
  audioMonitorLimiterNode.threshold.value = -18;
  audioMonitorLimiterNode.knee.value = 8;
  audioMonitorLimiterNode.ratio.value = 12;
  audioMonitorLimiterNode.attack.value = 0.004;
  audioMonitorLimiterNode.release.value = 0.16;
  audioFrequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
  audioTimeData = new Uint8Array(audioAnalyser.fftSize);
  audioSourceNode.connect(audioAnalyser);
  syncAudioMonitor();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  setAudioProbeStatus("Audio probe running");
  drawAudioProbe();
}

function stopAudioProbe(options = {}) {
  if (autoMicPeakRun) {
    clearTimeout(autoMicPeakRun.timer);
    autoMicPeakRun = null;
    autoMicPeakButton.classList.remove("active");
    suggestedMicGainValue = null;
    autoMicPeakStatus.textContent = "Auto MIC Peak stopped with the audio probe.";
  }

  if (audioAnimationFrame) {
    cancelAnimationFrame(audioAnimationFrame);
    audioAnimationFrame = null;
  }

  if (audioStream) {
    stopMediaStream(audioStream);
  }

  disconnectAudioMonitor();
  if (audioContext) {
    audioContext.close().catch(() => {});
  }

  audioStream = null;
  audioContext = null;
  audioSourceNode = null;
  audioAnalyser = null;
  audioMonitorGainNode = null;
  audioMonitorLimiterNode = null;
  audioMonitorConnected = false;
  audioFrequencyData = null;
  audioTimeData = null;
  audioLevelHistory = [];
  audioLevelHistoryKey = null;
  updateAudioLevel(0);
  resetAudioSpectrumStats();
  drawEmptyAudioSpectrum();
  drawEmptyAudioTest();

  if (!options.keepStatus) {
    setAudioProbeStatus("Idle");
    logMessage("Audio probe stopped.");
  }

  syncAudioProbeControls();
}

function stopMediaStream(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

function getStreamDeviceId(stream) {
  return stream.getAudioTracks()[0]?.getSettings?.().deviceId ?? null;
}

function drawAudioProbe() {
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
  latestAudioSnapshot = {
    audioMetrics,
    spectrumStats,
    voiceMetrics,
    input: audioInputSelect.selectedOptions[0]?.textContent ?? audioInputSelect.value ?? "--",
    monitorEnabled: audioMonitorToggle.checked,
    monitorVolume: Number(audioMonitorVolumeSlider.value),
    updatedAt: Date.now()
  };
  updateAudioLevel(audioMetrics.percent);
  updateAudioTestAnalysis(audioMetrics, spectrumStats, voiceMetrics);
  updateAudioSpectrumStats(audioMetrics, spectrumStats);
  drawAudioSpectrum(audioFrequencyData);
  sendAudioScanSample(audioMetrics, spectrumStats, voiceMetrics);
  audioAnimationFrame = requestAnimationFrame(drawAudioProbe);
}

function calculateAudioMetrics(timeData) {
  let sum = 0;
  let clipped = 0;
  for (const value of timeData) {
    const centered = (value - 128) / 128;
    sum += centered * centered;
    if (Math.abs(centered) >= 0.98) {
      clipped += 1;
    }
  }

  const rms = Math.sqrt(sum / timeData.length);
  return {
    percent: Math.min(100, Math.round(rms * 260)),
    dbfs: rms > 0 ? 20 * Math.log10(rms) : -Infinity,
    clipPercent: Math.round((clipped / timeData.length) * 1000) / 10
  };
}

function updateAudioLevel(percent) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  audioLevelDisplay.textContent = `RX audio ${clamped}%`;
  audioLevelFill.style.width = `${clamped}%`;
}

function updateAudioTestAnalysis(audioMetrics, spectrumStats, voiceMetrics) {
  audioTestReturnDisplay.textContent = `${Math.round(clamp(audioMetrics.percent, 0, 100))}%`;
  audioTestReturnFill.style.width = `${clamp(audioMetrics.percent, 0, 100)}%`;
  audioTestReturnFill.classList.toggle("clipping", audioMetrics.clipPercent >= 1);
  audioTestDbfsDisplay.textContent = formatDbfs(audioMetrics.dbfs);
  audioTestClipDisplay.textContent = `${audioMetrics.clipPercent}%`;
  audioTestClipDisplay.classList.toggle("warning", audioMetrics.clipPercent >= 1);
  audioTestVoiceDisplay.textContent = String(voiceMetrics.voiceScore);
  audioTestModulationDisplay.textContent = `${voiceMetrics.levelSpan} span / ${voiceMetrics.averageLevelDelta} avg`;
  audioTestPeakDisplay.textContent = `${formatAudioFrequency(spectrumStats.peakHz)} / ${formatAudioFrequency(spectrumStats.centroidHz)}`;
  audioTestBalanceDisplay.textContent = `Low ${formatRatio(voiceMetrics.lowRatio)} / Voice ${formatRatio(voiceMetrics.midRatio)} / High ${formatRatio(voiceMetrics.highRatio)}`;
  audioTestWaveformSummary.textContent = `Level ${Math.round(audioMetrics.percent)}%, ${formatDbfs(audioMetrics.dbfs)}`;
  audioTestSpectrumSummary.textContent = `Peak ${formatAudioFrequency(spectrumStats.peakHz)}, centroid ${formatAudioFrequency(spectrumStats.centroidHz)}`;
  audioTestDiagnosisText.textContent = buildAudioTestDiagnosis(audioMetrics, spectrumStats, voiceMetrics);
  updateAutoMicPeak(audioMetrics, voiceMetrics);
  drawAudioTestWaveform(audioTimeData, audioMetrics);
  drawAudioTestSpectrum(audioFrequencyData, spectrumStats, voiceMetrics);
  renderAudioTestControls();
}

async function startAutoMicPeak() {
  if (autoMicPeakRun) {
    return;
  }

  if (!audioStream) {
    await startAudioProbe();
  }

  if (!audioStream) {
    autoMicPeakStatus.textContent = "Start audio first, then speak into the mic while watching the radio MONI path.";
    return;
  }

  suggestedMicGainValue = null;
  autoMicPeakRun = {
    startedAt: Date.now(),
    endsAt: Date.now() + AUTO_MIC_PEAK_RUN_MS,
    samples: 0,
    peakDbfs: -Infinity,
    maxClipPercent: 0,
    maxReturnPercent: 0,
    voiceSamples: 0,
    timer: setTimeout(finishAutoMicPeak, AUTO_MIC_PEAK_RUN_MS)
  };
  autoMicPeakButton.classList.add("active");
  applyMicPeakButton.disabled = true;
  autoMicPeakStatus.textContent = "Auto MIC Peak running: talk normally for 8 seconds. Aim for clean peaks, not max loudness.";
  syncTxAudioControls(latestCatState?.txAudio);
}

function updateAutoMicPeak(audioMetrics, voiceMetrics) {
  if (!autoMicPeakRun) {
    return;
  }

  autoMicPeakRun.samples += 1;
  autoMicPeakRun.peakDbfs = Math.max(autoMicPeakRun.peakDbfs, audioMetrics.dbfs);
  autoMicPeakRun.maxClipPercent = Math.max(autoMicPeakRun.maxClipPercent, audioMetrics.clipPercent);
  autoMicPeakRun.maxReturnPercent = Math.max(autoMicPeakRun.maxReturnPercent, audioMetrics.percent);
  if (voiceMetrics.voiceScore >= 28 || voiceMetrics.levelSpan >= 4) {
    autoMicPeakRun.voiceSamples += 1;
  }

  const remainingMs = Math.max(0, autoMicPeakRun.endsAt - Date.now());
  autoMicPeakStatus.textContent = `Auto MIC Peak running: ${Math.ceil(remainingMs / 1000)}s left / peak ${formatDbfs(autoMicPeakRun.peakDbfs)} / clip ${autoMicPeakRun.maxClipPercent}%.`;
}

function finishAutoMicPeak() {
  if (!autoMicPeakRun) {
    return;
  }

  clearTimeout(autoMicPeakRun.timer);
  const run = autoMicPeakRun;
  autoMicPeakRun = null;
  autoMicPeakButton.classList.remove("active");

  if (run.samples < 10 || !Number.isFinite(run.peakDbfs)) {
    suggestedMicGainValue = null;
    autoMicPeakStatus.textContent = "Auto MIC Peak did not get enough return audio. Start audio, turn radio MONI on, key up, and talk normally.";
    syncTxAudioControls(latestCatState?.txAudio);
    return;
  }

  const currentGain = Number.isFinite(latestCatState?.txAudio?.micGain?.value)
    ? latestCatState.txAudio.micGain.value
    : Number(micGainSlider.value);
  let delta = 0;
  let verdict = "Good headroom";
  if (run.maxClipPercent >= 0.5 || run.peakDbfs > -6) {
    delta = -Math.max(4, Math.ceil((run.peakDbfs - AUTO_MIC_TARGET_PEAK_DBFS) * 1.1 + run.maxClipPercent * 2));
    verdict = "Too hot";
  } else if (run.peakDbfs < -24 || run.maxReturnPercent < 8) {
    delta = Math.min(15, Math.ceil((AUTO_MIC_TARGET_PEAK_DBFS - run.peakDbfs) * 0.45));
    verdict = "Too low";
  } else if (run.peakDbfs < -18) {
    delta = Math.min(8, Math.ceil((-16 - run.peakDbfs) * 0.5));
    verdict = "A little low";
  }

  suggestedMicGainValue = Math.min(100, Math.max(0, Math.round(currentGain + delta)));
  const suggestionText = suggestedMicGainValue === currentGain
    ? "leave MIC gain where it is"
    : `try MIC gain ${suggestedMicGainValue}%`;
  const voiceText = run.voiceSamples > 0 ? "voice movement seen" : "voice movement weak";
  autoMicPeakStatus.textContent = `${verdict}: peak ${formatDbfs(run.peakDbfs)}, clip ${run.maxClipPercent}%, ${voiceText}. Suggested: ${suggestionText}.`;
  syncTxAudioControls(latestCatState?.txAudio);
}

function applySuggestedMicGain() {
  if (!Number.isFinite(suggestedMicGainValue)) {
    return;
  }

  if (!canSendRadioCommand()) {
    setStatus("Connect CAT before applying MIC gain", false);
    return;
  }

  const confirmed = window.confirm(`Apply Yaesu MIC gain ${suggestedMicGainValue}%?`);
  if (!confirmed) {
    return;
  }

  renderMicGain(suggestedMicGainValue);
  sendTxAudioValue("setMicGain", suggestedMicGainValue, { flush: true });
  autoMicPeakStatus.textContent = `Applied MIC gain ${suggestedMicGainValue}%. Run Auto MIC Peak again after one real speaking pass.`;
  suggestedMicGainValue = null;
  syncTxAudioControls(latestCatState?.txAudio);
}

function buildAudioTestDiagnosis(audioMetrics, spectrumStats, voiceMetrics) {
  if (!audioStream) {
    return "Start audio to analyze receiver audio. For your transmit voice, use the radio PHONES jack with MONI enabled.";
  }

  const notes = [];
  if (audioMetrics.clipPercent >= 1) {
    notes.push("The return is clipping at the browser input. That can sound harsh, splattery, or crushed.");
  } else if (audioMetrics.dbfs > -8) {
    notes.push("The return is very hot. It may sound strained even before obvious clipping.");
  } else if (audioMetrics.dbfs < -45 || audioMetrics.percent < 3) {
    notes.push("The return is very low. A low monitor return can sound thin and noisy.");
  } else {
    notes.push("Return level is in a usable range.");
  }

  if (voiceMetrics.highRatio > 0.32 && voiceMetrics.lowRatio < 0.08) {
    notes.push("Spectrum is high-heavy with little low body, which matches a thin/light sound.");
  } else if (voiceMetrics.lowRatio > 0.42) {
    notes.push("Spectrum is low-heavy; rumble or monitor hum may be in the path.");
  } else if (voiceMetrics.midRatio < 0.46) {
    notes.push("Voice-band energy is not dominant, so the monitor return may not be representing speech cleanly.");
  } else {
    notes.push("Voice-band energy is present.");
  }

  if (voiceMetrics.levelSpan < 2 && audioMetrics.percent > 4) {
    notes.push("Level is very steady; if you are speaking, this USB return is not behaving like a transmit voice monitor.");
  } else if (voiceMetrics.voiceScore >= 38) {
    notes.push("Modulation looks voice-like.");
  }

  if (Number.isFinite(spectrumStats.centroidHz) && spectrumStats.centroidHz > 2400) {
    notes.push("Centroid is high, another sign of bright/thin audio.");
  }

  return notes.join(" ");
}

function drawAudioTestWaveform(timeData, audioMetrics) {
  const context = prepareDisplayCanvas(audioTestWaveCanvas, 360, 140);
  const { width, height } = audioTestWaveCanvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#050b17";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(248, 251, 255, 0.18)";
  context.lineWidth = 1;
  for (let row = 1; row < 4; row += 1) {
    const y = (height / 4) * row;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.strokeStyle = audioMetrics.clipPercent >= 1 ? "#ff304a" : "#f8fbff";
  context.lineWidth = Math.max(2, width / 360);
  context.beginPath();
  for (let index = 0; index < timeData.length; index += 1) {
    const x = (index / (timeData.length - 1)) * width;
    const centered = (timeData[index] - 128) / 128;
    const y = height / 2 - centered * height * 0.42;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.stroke();
}

function drawAudioTestSpectrum(frequencyData, spectrumStats, voiceMetrics) {
  const context = prepareDisplayCanvas(audioTestSpectrumCanvas, 360, 140);
  const { width, height } = audioTestSpectrumCanvas;
  context.clearRect(0, 0, width, height);
  const chart = drawAudioGrid(context, width, height);
  const sampleRate = getAudioSampleRate();
  const binHz = sampleRate / (audioAnalyser?.fftSize ?? 2048);
  const firstBin = Math.max(1, Math.floor(20 / binHz));
  const lastBin = Math.min(frequencyData.length - 1, Math.ceil(AUDIO_SPECTRUM_MAX_HZ / binHz));
  const barCount = 112;
  const gap = 1;
  const barWidth = Math.max(2, (chart.width - gap * (barCount - 1)) / barCount);
  const binSpan = Math.max(1, (lastBin - firstBin + 1) / barCount);

  for (let index = 0; index < barCount; index += 1) {
    let peak = 0;
    const start = Math.floor(firstBin + index * binSpan);
    const end = Math.min(Math.floor(start + binSpan), lastBin + 1);
    for (let bin = start; bin < end; bin += 1) {
      peak = Math.max(peak, frequencyData[bin]);
    }
    const hz = (start + end) * 0.5 * binHz;
    const ratio = normalizeAnalyserDb(byteToAnalyserDb(peak));
    const barHeight = Math.max(2, ratio * chart.height);
    const x = chart.left + index * (barWidth + gap);
    const y = chart.bottom - barHeight;
    context.fillStyle = hz < 300 ? "#6ea2ff" : hz <= 3000 ? "#f8fbff" : "#ff304a";
    context.globalAlpha = ratio > 0.05 ? 1 : 0.35;
    context.fillRect(x, y, barWidth, barHeight);
  }
  context.globalAlpha = 1;

  if (Number.isFinite(spectrumStats.centroidHz)) {
    const x = chart.left + (Math.min(spectrumStats.centroidHz, AUDIO_SPECTRUM_MAX_HZ) / AUDIO_SPECTRUM_MAX_HZ) * chart.width;
    context.strokeStyle = voiceMetrics.highRatio > 0.32 ? "#ff304a" : "#8fd5ff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, chart.top);
    context.lineTo(x, chart.bottom);
    context.stroke();
  }
}

function calculateSpectrumStats(frequencyData, analyser = audioAnalyser, context = audioContext) {
  const sampleRate = getAudioSampleRate(context);
  const binHz = sampleRate / (analyser?.fftSize ?? 2048);
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
    peakDb: byteToAnalyserDb(peakValue),
    centroidHz: weightTotal > 0 ? weightedHz / weightTotal : null,
    sampleRate,
    binHz
  };
}

function calculateVoiceMetrics(frequencyData, audioMetrics, spectrumStats, levelHistory = audioLevelHistory, analyser = audioAnalyser, context = audioContext) {
  const sampleRate = getAudioSampleRate(context);
  const binHz = sampleRate / (analyser?.fftSize ?? 2048);
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

    return {
      energy,
      peak,
      count,
      mean: count > 0 ? Math.sqrt(energy / count) : 0
    };
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
  audioLevelHistory = rememberLevelValue(audioLevelHistory, percent);
  return audioLevelHistory;
}

function rememberLevelValue(levels, percent) {
  const nextLevels = [...levels, clamp(percent, 0, 100)];
  return nextLevels.slice(-AUDIO_LEVEL_HISTORY_SIZE);
}

function syncAudioLevelHistoryKey() {
  const scan = lastScanState;
  const nextKey = scanActive && scan?.active && Number.isInteger(scan.currentHz)
    ? `${scan.intent}:${scan.currentHz}:${scan.tunedAt ?? 0}`
    : "monitor";
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

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function sendAudioScanSample(audioMetrics, spectrumStats, voiceMetrics) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected || !scanActive || !audioStream) {
    return;
  }

  const scan = lastScanState;
  if (!scan?.audioAssist || !["smart", "regular"].includes(scan.intent) || !Number.isInteger(scan.currentHz)) {
    return;
  }

  const now = Date.now();
  if (now - lastAudioScanSampleAt < AUDIO_SCAN_SAMPLE_INTERVAL_MS) {
    return;
  }

  lastAudioScanSampleAt = now;
  socket.send(JSON.stringify({
    type: "audioScanSample",
    bandId: activeBandId,
    hz: scan.currentHz,
    tunedAt: scan.tunedAt,
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

function updateAudioSpectrumStats(audioMetrics, spectrumStats) {
  audioSpectrumSpanDisplay.textContent = `0-${formatAudioFrequency(AUDIO_SPECTRUM_MAX_HZ)}`;
  audioPeakDisplay.textContent = formatAudioFrequency(spectrumStats.peakHz);
  audioCentroidDisplay.textContent = formatAudioFrequency(spectrumStats.centroidHz);
  audioDbDisplay.textContent = formatDbfs(audioMetrics.dbfs);
  audioClipDisplay.textContent = `${audioMetrics.clipPercent}%`;
}

function resetAudioSpectrumStats() {
  audioSpectrumSpanDisplay.textContent = `0-${formatAudioFrequency(AUDIO_SPECTRUM_MAX_HZ)}`;
  audioPeakDisplay.textContent = "-- Hz";
  audioCentroidDisplay.textContent = "-- Hz";
  audioDbDisplay.textContent = "-- dBFS";
  audioClipDisplay.textContent = "0%";
}

function handleAudioMonitorChange() {
  renderAudioMonitorVolume();
  syncAudioMonitor();
  syncAudioProbeControls();
}

function handleAudioMonitorVolumeInput() {
  renderAudioMonitorVolume();
  if (audioMonitorGainNode) {
    audioMonitorGainNode.gain.value = getAudioMonitorGain();
  }
}

function handleAudioTestVolumeInput() {
  audioMonitorVolumeSlider.value = audioTestVolumeSlider.value;
  handleAudioMonitorVolumeInput();
}

function handleDiagnosticsMonitorVolumeInput() {
  audioMonitorVolumeSlider.value = diagnosticsMonitorVolumeSlider.value;
  handleAudioMonitorVolumeInput();
}

function handleRadioMonitorToggle(event) {
  const enabled = event.currentTarget.checked;
  radioMonitorToggle.checked = enabled;
  diagnosticsRadioMonitorToggle.checked = enabled;
  sendTxAudioCommand("setRadioMonitorEnabled", { enabled });
}

function handleRadioMonitorLevelInput(event) {
  const value = Number(event.currentTarget.value);
  renderRadioMonitorLevel(value);
  scheduleTxAudioValueSend("setRadioMonitorLevel", value);
}

function flushRadioMonitorLevel() {
  sendTxAudioValue("setRadioMonitorLevel", Number(radioMonitorLevelSlider.value), { flush: true });
}

function handleMicGainInput() {
  const value = Number(micGainSlider.value);
  renderMicGain(value);
  scheduleTxAudioValueSend("setMicGain", value);
}

function flushMicGain() {
  sendTxAudioValue("setMicGain", Number(micGainSlider.value), { flush: true });
}

function handleProcessorLevelInput() {
  const value = Number(processorLevelSlider.value);
  renderProcessorLevel(value);
  scheduleTxAudioValueSend("setProcessorLevel", value);
}

function flushProcessorLevel() {
  sendTxAudioValue("setProcessorLevel", Number(processorLevelSlider.value), { flush: true });
}

function handleProcessorToggle() {
  sendTxAudioCommand("setProcessorEnabled", { enabled: processorToggle.checked });
}

function handleParametricEqToggle() {
  sendTxAudioCommand("setParametricEqEnabled", { enabled: parametricEqToggle.checked });
}

function scheduleTxAudioValueSend(type, value) {
  if (!canSendRadioCommand()) {
    return;
  }

  pendingTxAudioValue = { type, value };
  const waitMs = TX_AUDIO_LIVE_THROTTLE_MS - (Date.now() - lastTxAudioSentAt);
  if (waitMs <= 0) {
    sendTxAudioValue(type, value);
    return;
  }

  if (!txAudioSendTimer) {
    txAudioSendTimer = setTimeout(() => {
      txAudioSendTimer = null;
      if (pendingTxAudioValue) {
        sendTxAudioValue(pendingTxAudioValue.type, pendingTxAudioValue.value);
      }
    }, waitMs);
  }
}

function sendTxAudioValue(type, value, options = {}) {
  if (!canSendRadioCommand()) {
    setStatus("Connect CAT before changing Yaesu audio controls", false);
    return;
  }

  if (options.flush && txAudioSendTimer) {
    clearTimeout(txAudioSendTimer);
    txAudioSendTimer = null;
  }

  pendingTxAudioValue = null;
  if (!Number.isFinite(value)) {
    return;
  }

  const rounded = Math.round(value);
  if (type === lastTxAudioSentKey && rounded === lastTxAudioSentValue) {
    return;
  }

  lastTxAudioSentAt = Date.now();
  lastTxAudioSentKey = type;
  lastTxAudioSentValue = rounded;
  socket.send(JSON.stringify({ type, value: rounded }));
}

function sendTxAudioCommand(type, payload) {
  if (!canSendRadioCommand()) {
    setStatus("Connect CAT before changing Yaesu audio controls", false);
    syncTxAudioControls(latestCatState?.txAudio);
    return;
  }

  socket.send(JSON.stringify({ type, ...payload }));
}

function renderAudioMonitorVolume() {
  const value = audioMonitorVolumeSlider.value;
  audioMonitorVolumeDisplay.textContent = `${value}%`;
  audioTestVolumeSlider.value = value;
  audioTestVolumeDisplay.textContent = `${value}%`;
  diagnosticsMonitorVolumeSlider.value = value;
  diagnosticsMonitorVolumeDisplay.textContent = `${value}%`;
}

function canSendRadioCommand() {
  return radioPowered && connected && socket?.readyState === WebSocket.OPEN;
}

function getAudioMonitorGain() {
  const percent = Number(audioMonitorVolumeSlider.value);
  const clamped = Math.min(Math.max(Number.isFinite(percent) ? percent : AUDIO_DEFAULT_MONITOR_VOLUME, 0), 100);
  return (clamped / 100) ** 2;
}

function syncAudioMonitor() {
  if (!audioSourceNode || !audioMonitorGainNode || !audioMonitorLimiterNode || !audioContext) {
    audioMonitorConnected = false;
    return;
  }

  if (audioMonitorConnected) {
    disconnectAudioMonitor();
  }

  audioMonitorGainNode.gain.value = getAudioMonitorGain();
  if (audioMonitorToggle.checked) {
    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => {});
    }
    audioSourceNode.connect(audioMonitorGainNode);
    audioMonitorGainNode.connect(audioMonitorLimiterNode);
    audioMonitorLimiterNode.connect(audioContext.destination);
    audioMonitorConnected = true;
  }
}

function disconnectAudioMonitor() {
  if (!audioMonitorConnected || !audioSourceNode || !audioMonitorGainNode) {
    audioMonitorConnected = false;
    return;
  }

  audioSourceNode.disconnect(audioMonitorGainNode);
  audioMonitorGainNode.disconnect();
  audioMonitorLimiterNode?.disconnect();
  audioMonitorConnected = false;
}

function drawAudioSpectrum(frequencyData) {
  const context = prepareAudioCanvas();
  const { width, height } = audioSpectrumCanvas;
  context.clearRect(0, 0, width, height);
  const chart = drawAudioGrid(context, width, height);

  const sampleRate = getAudioSampleRate();
  const binHz = sampleRate / (audioAnalyser?.fftSize ?? 2048);
  const firstBin = Math.max(1, Math.floor(20 / binHz));
  const lastBin = Math.min(frequencyData.length - 1, Math.ceil(AUDIO_SPECTRUM_MAX_HZ / binHz));
  const barCount = 96;
  const gap = 2;
  const barWidth = Math.max(2, (chart.width - gap * (barCount - 1)) / barCount);
  const binSpan = Math.max(1, (lastBin - firstBin + 1) / barCount);

  for (let index = 0; index < barCount; index += 1) {
    let peak = 0;
    const start = Math.floor(firstBin + index * binSpan);
    const end = Math.min(Math.floor(start + binSpan), lastBin + 1);
    for (let bin = start; bin < end; bin += 1) {
      peak = Math.max(peak, frequencyData[bin]);
    }

    const ratio = normalizeAnalyserDb(byteToAnalyserDb(peak));
    const barHeight = Math.max(2, ratio * chart.height);
    const x = chart.left + index * (barWidth + gap);
    const y = chart.bottom - barHeight;
    context.fillStyle = ratio > 0.72 ? "#ff304a" : ratio > 0.42 ? "#f8fbff" : "#2f78ff";
    context.fillRect(x, y, barWidth, barHeight);
  }
}

function drawEmptyAudioSpectrum() {
  const context = prepareAudioCanvas();
  const { width, height } = audioSpectrumCanvas;
  context.clearRect(0, 0, width, height);
  drawAudioGrid(context, width, height);
}

function drawEmptyAudioTest() {
  if (!audioTestWaveCanvas || !audioTestSpectrumCanvas) {
    return;
  }

  const waveContext = prepareDisplayCanvas(audioTestWaveCanvas, 360, 140);
  waveContext.clearRect(0, 0, audioTestWaveCanvas.width, audioTestWaveCanvas.height);
  waveContext.fillStyle = "#050b17";
  waveContext.fillRect(0, 0, audioTestWaveCanvas.width, audioTestWaveCanvas.height);
  waveContext.strokeStyle = "rgba(248, 251, 255, 0.24)";
  waveContext.beginPath();
  waveContext.moveTo(0, audioTestWaveCanvas.height / 2);
  waveContext.lineTo(audioTestWaveCanvas.width, audioTestWaveCanvas.height / 2);
  waveContext.stroke();

  const spectrumContext = prepareDisplayCanvas(audioTestSpectrumCanvas, 360, 140);
  spectrumContext.clearRect(0, 0, audioTestSpectrumCanvas.width, audioTestSpectrumCanvas.height);
  drawAudioGrid(spectrumContext, audioTestSpectrumCanvas.width, audioTestSpectrumCanvas.height);
  audioTestReturnDisplay.textContent = "0%";
  audioTestReturnFill.style.width = "0%";
  audioTestDbfsDisplay.textContent = "-- dBFS";
  audioTestClipDisplay.textContent = "0%";
  audioTestVoiceDisplay.textContent = "0";
  audioTestModulationDisplay.textContent = "0";
  audioTestPeakDisplay.textContent = "-- / --";
  audioTestBalanceDisplay.textContent = "Low -- / Voice -- / High --";
  audioTestWaveformSummary.textContent = "Waiting for audio";
  audioTestSpectrumSummary.textContent = "0-4 kHz";
  audioTestDiagnosisText.textContent = "Start audio to analyze the selected receiver/audio input. Use the radio PHONES jack and MONI function to judge transmitted mic audio.";
}

function prepareAudioCanvas() {
  const context = audioSpectrumCanvas.getContext("2d");
  const rect = audioSpectrumCanvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width * pixelRatio));
  const height = Math.max(120, Math.floor(rect.height * pixelRatio));

  if (audioSpectrumCanvas.width !== width || audioSpectrumCanvas.height !== height) {
    audioSpectrumCanvas.width = width;
    audioSpectrumCanvas.height = height;
  }

  return context;
}

function prepareDisplayCanvas(canvas, minWidth, minHeight) {
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(minWidth, Math.floor(rect.width * pixelRatio));
  const height = Math.max(minHeight, Math.floor(rect.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return context;
}

function drawAudioGrid(context, width, height) {
  const chart = getAudioChartBounds(width, height);
  context.fillStyle = "#050b17";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(248, 251, 255, 0.22)";
  context.lineWidth = 1;
  context.font = `${Math.max(10, Math.round(height * 0.07))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillStyle = "rgba(248, 251, 255, 0.78)";

  for (let hz = 0; hz <= AUDIO_SPECTRUM_MAX_HZ; hz += 1000) {
    const x = chart.left + (hz / AUDIO_SPECTRUM_MAX_HZ) * chart.width;
    context.beginPath();
    context.moveTo(x, chart.top);
    context.lineTo(x, chart.bottom);
    context.stroke();
    context.textAlign = "center";
    context.fillText(formatAudioFrequency(hz), x, height - 6);
  }

  for (const db of [-90, -70, -50, -30, -10]) {
    const ratio = normalizeAnalyserDb(db);
    const y = chart.bottom - ratio * chart.height;
    context.beginPath();
    context.moveTo(chart.left, y);
    context.lineTo(chart.right, y);
    context.stroke();
    context.textAlign = "right";
    context.fillText(String(db), chart.left - 6, y + 4);
  }

  context.strokeStyle = "rgba(255, 48, 74, 0.72)";
  const centerX = chart.left + chart.width / 2;
  context.beginPath();
  context.moveTo(centerX, chart.top);
  context.lineTo(centerX, chart.bottom);
  context.stroke();

  context.strokeStyle = "rgba(248, 251, 255, 0.58)";
  context.strokeRect(chart.left, chart.top, chart.width, chart.height);
  return chart;
}

function getAudioChartBounds(width, height) {
  const left = Math.max(38, width * 0.055);
  const top = Math.max(8, height * 0.06);
  const bottom = height - Math.max(24, height * 0.16);
  const right = width - Math.max(8, width * 0.018);
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

function getAudioSampleRate(context = audioContext) {
  return context?.sampleRate ?? 48000;
}

function byteToAnalyserDb(value) {
  const ratio = Math.min(Math.max(value / 255, 0), 1);
  return AUDIO_SPECTRUM_MIN_DB + ratio * (AUDIO_SPECTRUM_MAX_DB - AUDIO_SPECTRUM_MIN_DB);
}

function normalizeAnalyserDb(db) {
  return Math.min(Math.max((db - AUDIO_SPECTRUM_MIN_DB) / (AUDIO_SPECTRUM_MAX_DB - AUDIO_SPECTRUM_MIN_DB), 0), 1);
}

function formatAudioFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "-- Hz";
  }

  if (hz >= 1000) {
    const khz = hz / 1000;
    return `${Number.isInteger(khz) ? khz : khz.toFixed(2)} kHz`;
  }

  return `${Math.round(hz)} Hz`;
}

function formatDbfs(db) {
  if (!Number.isFinite(db)) {
    return "-- dBFS";
  }

  return `${Math.max(-99.9, db).toFixed(1)} dBFS`;
}

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function formatRadioMonitor(monitor) {
  if (!monitor) {
    return "--";
  }

  const enabled = typeof monitor.enabled === "boolean" ? (monitor.enabled ? "on" : "off") : "--";
  const level = Number.isFinite(monitor.level) ? `${monitor.level}%` : "--";
  return `${enabled} @ ${level}`;
}

function formatProcessor(processor) {
  if (!processor) {
    return "--";
  }

  const enabled = typeof processor.enabled === "boolean" ? (processor.enabled ? "on" : "off") : "--";
  const level = Number.isFinite(processor.level) ? `${processor.level}%` : "--";
  return `${enabled} @ ${level}`;
}

function setAudioProbeStatus(text) {
  audioStatusText.textContent = text;
  audioTestStatusText.textContent = text;
}

function formatHiddenAudioLabelStatus() {
  const preferredInput = macAudioInputs.find((input) => PREFERRED_AUDIO_INPUT_PATTERN.test(input.name))
    ?? macAudioInputs.find((input) => input.default)
    ?? macAudioInputs[0];
  if (!preferredInput) {
    return "Browser labels hidden until audio permission succeeds.";
  }

  return `Browser label hidden. macOS sees ${formatMacAudioInput(preferredInput)}.`;
}

function formatMacAudioInput(input) {
  const parts = [
    input.name,
    input.transport,
    input.sampleRate ? `${input.sampleRate / 1000} kHz` : "",
    input.default ? "default" : ""
  ].filter(Boolean);
  return parts.join(" ");
}

function formatAudioError(error) {
  if (error?.name === "NotAllowedError" || /permission|denied|notallowed/i.test(error?.message ?? "")) {
    return "Audio blocked: allow microphone/audio input for this browser or Codex in macOS Privacy settings, then reload.";
  }

  if (error?.name === "NotFoundError" || /not found|device/i.test(error?.message ?? "")) {
    return "Audio input not found: check the USB Audio CODEC connection, then refresh audio.";
  }

  return `Audio probe failed: ${error?.message ?? "unknown error"}`;
}

function renderAudioTestControls() {
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && navigator.mediaDevices?.enumerateDevices);
  const hasInput = Array.from(audioInputSelect.options).some((option) => !option.disabled);
  const selectedLabel = audioInputSelect.selectedOptions[0]?.textContent?.trim();
  audioTestInputText.textContent = selectedLabel || (supported ? "No input selected" : "Browser audio unavailable");
  audioTestStartButton.disabled = !supported || Boolean(audioStream) || !hasInput;
  audioTestStopButton.disabled = !audioStream;
  audioTestVolumeSlider.disabled = !supported || !audioMonitorToggle.checked;
  audioTestVolumeSlider.value = audioMonitorVolumeSlider.value;
  audioTestVolumeDisplay.textContent = `${audioMonitorVolumeSlider.value}%`;
  diagnosticsMonitorVolumeSlider.disabled = !supported || !audioMonitorToggle.checked;
  diagnosticsMonitorVolumeSlider.value = audioMonitorVolumeSlider.value;
  diagnosticsMonitorVolumeDisplay.textContent = `${audioMonitorVolumeSlider.value}%`;
}

function syncAudioProbeControls() {
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && navigator.mediaDevices?.enumerateDevices);
  const hasInput = Array.from(audioInputSelect.options).some((option) => !option.disabled);
  audioInputSelect.disabled = !supported || Boolean(audioStream);
  refreshAudioInputsButton.disabled = !supported;
  startAudioProbeButton.disabled = !supported || Boolean(audioStream) || !hasInput;
  stopAudioProbeButton.disabled = !audioStream;
  audioMonitorToggle.disabled = !supported;
  audioMonitorVolumeSlider.disabled = !supported || !audioMonitorToggle.checked;
  renderAudioTestControls();
}

function disabledAudioOption(label) {
  const option = new Option(label, "");
  option.disabled = true;
  return option;
}

function renderFileMode() {
  setStatus("Open http://localhost:3030", false);
  updatedText.textContent = "Raw file view";
  allowlistDisplay.textContent = "Use the local server URL";
  portSelect.replaceChildren(new Option("Open http://localhost:3030", ""));
  messageLog.replaceChildren();
  logMessage("This page was opened as a file. Use http://localhost:3030 for the CAT bridge.");

  [
    refreshButton,
    connectButton,
    disconnectButton,
    runConnectButton,
    runDisconnectButton,
    applyPresetButton,
    atuTuneButton,
    startScanButton,
    stopScanButton,
    benchmarkScanButton,
    scanDwellSlider,
    regularScanDwellSlider,
    readableScanToggle,
    busyAssistToggle,
    smartListToggle,
    regularScanSourceSelect,
    regularScanStepSelect,
    busyScanButton,
    ssbHunterButton,
    potaButton,
    logContactButton,
    manualFrequencyButton,
    clearSkipsButton,
    tuneKeysToggle,
    pttArmToggle,
    rfGainSlider,
    channelSlider,
    ...channelSliderModeButtons,
    rigPowerButton,
    audioInputSelect,
    refreshAudioInputsButton,
    startAudioProbeButton,
    stopAudioProbeButton,
    audioMonitorToggle,
    audioMonitorVolumeSlider,
    audioTestStartButton,
    audioTestStopButton,
    audioTestVolumeSlider,
    diagnosticsMonitorVolumeSlider,
    autoMicPeakButton,
    applyMicPeakButton,
    radioMonitorToggle,
    radioMonitorLevelSlider,
    diagnosticsRadioMonitorToggle,
    diagnosticsRadioMonitorLevelSlider,
    micGainSlider,
    processorToggle,
    processorLevelSlider,
    parametricEqToggle,
    ...modeButtons
  ].forEach((control) => {
    control.disabled = true;
  });
}

function connectWebSocket() {
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/cat`);

  socket.addEventListener("open", () => {
    setStatus("Ready", false);
    if (!radioPowered) {
      sendRadioPowerState();
    }
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "error") {
      setStatus(message.message, false);
      logMessage(message.message);
      return;
    }

    if (message.type === "state") {
      renderState(message);
    } else if (message.type === "powerState") {
      setRadioPowered(message.radioPowerOn !== false, { notifyServer: false, status: false });
    }
  });

  socket.addEventListener("close", () => {
    connected = false;
    pttKeyDown = false;
    clearPttTimeout();
    renderPtt({ active: false, timeoutMs: PTT_TIMEOUT_MS });
    setStatus("Display bridge closed", false);
    setTimeout(connectWebSocket, 1200);
  });
}

function connectCat(options = {}) {
  if (!radioPowered) {
    setStatus("Power on the HF Stack before connecting CAT", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !portSelect.value) {
    setStatus("Choose an available serial port", false);
    showView("diagnostics");
    return;
  }

  const autoTune = options.autoTune === true || pendingStandbyAutoTune === true;
  const tuneTarget = browserTuneTargetForConnect();
  void ensureDefaultAudioMonitor();
  socket.send(JSON.stringify({
    type: "connect",
    path: portSelect.value,
    baudRate: Number(baudSelect.value),
    pollMs: Number(pollSelect.value),
    rtsHigh: rtsSelect.value === "high",
    stopBits: Number(stopBitsSelect.value),
    bandId: tuneTarget.bandId,
    tuneTarget,
    customChannels: customChannelsForMessage(tuneTarget.bandId),
    autoTune
  }));
  if (autoTune) {
    pendingStandbyAutoTune = false;
    setStatus(`Connecting CAT to ${tuneTarget.display} and staging ATU on ${bandProfiles[tuneTarget.bandId]?.name ?? tuneTarget.bandId}`, false);
  } else {
    setStatus(`Connecting CAT to ${tuneTarget.display}`, false);
  }
}

function browserTuneTargetForConnect() {
  const bandId = connectBandIdForCurrentView();
  const profile = bandProfiles[bandId] ?? bandProfiles[activeBandId];
  const fallbackHz = profile?.centerHz ?? lastKnownHz ?? 0;
  let hz = fallbackHz;
  let source = "frequency";

  if (bandId === activeBandId) {
    const clarifierHz = cockpitClarifierTargetHz();
    if (Number.isInteger(clarifierHz)) {
      hz = clarifierHz;
      source = "clarifier";
    } else if (isCockpitChannelMode(profile)) {
      const channel = findChannel(profile, Number(cockpitFrequencySlider.value))
        ?? findChannel(profile, selectedChannelNumber);
      if (channel) {
        hz = channel.hz;
        source = "channel";
      }
    } else if (channelSliderMode === "presets") {
      const channel = findChannel(profile, Number(channelSlider.value))
        ?? findChannel(profile, selectedChannelNumber);
      if (channel) {
        hz = channel.hz;
        source = "channel";
      }
    } else if (Number.isInteger(lastKnownHz)) {
      hz = lastKnownHz;
    }
  }

  const safeHz = snapFrequencyToSliderStep(hz, profile);
  const channel = findChannelForHz(profile, safeHz);
  return {
    bandId: profile?.id ?? activeBandId,
    hz: safeHz,
    display: formatFrequencyDisplay(safeHz),
    channelNumber: channel?.number ?? null,
    source: channel ? "channel" : source
  };
}

function connectBandIdForCurrentView() {
  if (currentViewName() === "hunter" && bandProfiles[mainHunterBandSelect.value]) {
    return mainHunterBandSelect.value;
  }

  return activeBandId;
}

function disconnect() {
  releasePtt("disconnect");
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "disconnect" }));
  }
}

function toggleRadioPower() {
  const poweringOn = !radioPowered;
  setRadioPowered(poweringOn, {
    notifyServer: true,
    status: true
  });
  if (poweringOn) {
    handleStandbyResume();
  }
}

function setRadioPowered(powered, options = {}) {
  radioPowered = powered === true;
  localStorage.setItem(RADIO_POWER_STORAGE_KEY, radioPowered ? "on" : "off");
  applyRadioPowerState(options);
}

function applyRadioPowerState(options = {}) {
  document.body.classList.toggle("radio-powered-down", !radioPowered);
  radioPowerButton?.setAttribute("aria-pressed", String(radioPowered));
  const label = radioPowerButton?.querySelector("strong");
  if (label) {
    label.textContent = radioPowered ? "On" : "Standby";
  }

  if (!radioPowered) {
    releasePtt("power down");
    stopScan();
    stopAudioProbe({ keepStatus: true });
    syncHunterFramePower();
  }

  if (options.notifyServer) {
    sendRadioPowerState();
  }

  if (options.quiet) {
    return;
  }

  if (options.status !== false && !radioPowered) {
    setStatus("Powered down - visual/logbook mode", false);
  } else {
    setStatus(connected ? statusText.textContent : "Ready", connected);
  }
  syncRigPowerButton();
}

function handleStandbyResume() {
  if (!isAtuBand(activeBandId)) {
    pendingStandbyAutoTune = false;
    return;
  }

  pendingStandbyAutoTune = true;
  if (socket?.readyState === WebSocket.OPEN && portSelect.value) {
    connectCat({ autoTune: true });
    return;
  }

  setStatus(`HF Stack on. Connect CAT and the ATU will run on ${bandProfiles[activeBandId]?.name ?? activeBandId}.`, false);
}

function handleRigPowerClick() {
  if (!radioPowered) {
    setStatus("Turn HF Stack on before using CAT radio power", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before using radio power", false);
    return;
  }

  const knownOn = typeof lastRigPowerOn === "boolean" ? lastRigPowerOn : null;
  const nextPowered = knownOn === null ? true : !knownOn;
  const label = nextPowered ? "ON" : "OFF";

  socket.send(JSON.stringify({
    type: "setRadioPowerSwitch",
    powered: nextPowered
  }));
  setStatus(`Radio power ${label} command staged`, connected);
  syncRigPowerButton({ on: nextPowered, pending: true });
}

function syncRigPowerButton(powerState = latestCatState?.radioPowerSwitch) {
  if (!rigPowerButton) {
    return;
  }

  const pending = powerState?.pending === true;
  const knownOn = typeof powerState?.on === "boolean" ? powerState.on : lastRigPowerOn;
  const label = rigPowerButton.querySelector("strong");
  if (label) {
    label.textContent = pending
      ? "Wait"
      : knownOn === true
      ? "On"
      : knownOn === false
      ? "Off"
      : "--";
  }
  rigPowerButton.classList.toggle("is-on", knownOn === true && !pending);
  rigPowerButton.setAttribute("aria-pressed", String(knownOn === true));
  rigPowerButton.disabled = !radioPowered || !connected || pending;
}

function sendRadioPowerState() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "radioPower",
      powered: radioPowered
    }));
  }
}

function syncHunterFramePower() {
  if (!hunterFrame?.contentWindow) {
    return;
  }

  hunterFrame.contentWindow.postMessage({
    type: "radioPower",
    powered: radioPowered
  }, location.origin);
}

function setTuneKeys() {
  tuneKeysToggle.checked = true;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({
    type: "setTuneKeys",
    enabled: true
  }));
}

function setMode(mode) {
  if (!radioPowered) {
    setStatus("Power on the HF Stack before setting mode", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before setting mode", false);
    return;
  }

  void ensureDefaultAudioMonitor();
  socket.send(JSON.stringify({
    type: "setMode",
    mode
  }));
}

function applyBandPreset() {
  sendBandPreset(activeBandId);
}

function handleAtuTuneClick() {
  if (!radioPowered) {
    setStatus("Power on the HF Stack before starting the antenna tuner", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before starting the antenna tuner", false);
    return;
  }

  if (!isAtuBand(activeBandId)) {
    setStatus("ATU Tune is enabled only on 10 meters, 6 meters, and CB", false);
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before starting the antenna tuner", false);
    return;
  }

  const now = Date.now();
  if (now < atuTuneArmedUntil) {
    clearAtuTuneArm();
    socket.send(JSON.stringify({
      type: "startAntennaTuner",
      bandId: activeBandId
    }));
    setStatus("ATU tune command sent", true);
    return;
  }

  atuTuneArmedUntil = now + 4000;
  atuTuneButton.textContent = "Confirm Tune";
  setStatus(`Confirm ATU tune on ${bandProfiles[activeBandId]?.name ?? activeBandId}`, true);
  if (atuTuneArmTimer) {
    clearTimeout(atuTuneArmTimer);
  }
  atuTuneArmTimer = setTimeout(clearAtuTuneArm, 4000);
}

function clearAtuTuneArm() {
  atuTuneArmedUntil = 0;
  if (atuTuneArmTimer) {
    clearTimeout(atuTuneArmTimer);
    atuTuneArmTimer = null;
  }
  atuTuneButton.textContent = "ATU Tune";
}

function sendBandPreset(bandId, options = {}) {
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  socket.send(JSON.stringify({
    type: "applyBandPreset",
    bandId,
    customChannels: customChannelsForMessage(bandId),
    autoTune: options.autoTune === true
  }));
}

async function startScan() {
  if (!radioPowered) {
    setStatus("Power on the HF Stack before scanning", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before scanning", false);
    return;
  }

  releasePtt("scan");
  if (!audioStream) {
    await startAudioProbe();
  }

  if (!audioStream || !audioAnalyser) {
    setStatus("Start audio before Smart scan", connected);
    return;
  }

  const dwellMs = Number(scanDwellSlider.value);

  socket.send(JSON.stringify({
    type: "startScan",
    thresholdS: 0,
    stepHz: Number(regularScanStepSelect.value),
    dwellMs,
    bandId: activeBandId,
    intent: "smart",
    scanSource: regularScanSourceSelect.value,
    customChannels: customChannelsForMessage(),
    smartList: smartListToggle.checked,
    readableMode: false,
    useBusy: false,
    audioAssist: true,
    durationMs: SMART_SCAN_DURATION_MS
  }));

  setStatus("30 second audio smart scan running", true);
}

async function startBusyScan() {
  if (!radioPowered) {
    setStatus("Power on the HF Stack before scanning", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before scanning", false);
    return;
  }

  releasePtt("scan");
  if (!audioStream) {
    await startAudioProbe();
  }

  if (!audioStream || !audioAnalyser) {
    setStatus("Start audio before regular scan", connected);
    return;
  }

  socket.send(JSON.stringify({
    type: "startScan",
    thresholdS: 0,
    stepHz: Number(regularScanStepSelect.value),
    dwellMs: Number(regularScanDwellSlider.value),
    bandId: activeBandId,
    intent: "regular",
    scanSource: regularScanSourceSelect.value,
    customChannels: customChannelsForMessage(),
    smartList: smartListToggle.checked,
    readableMode: false,
    useBusy: false,
    audioAssist: true
  }));

  setStatus(activeBandId === "cb" ? "CB fast audio scan running" : "Audio regular scan running", true);
}

function handleRegularScanOptionsChange() {
  syncScanControls();
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  socket.send(JSON.stringify({
    type: "setScanOptions",
    stepHz: Number(regularScanStepSelect.value),
    scanSource: regularScanSourceSelect.value,
    customChannels: customChannelsForMessage()
  }));
}

function openSsbHunterDashboard() {
  ssbHunterFallbackLink.hidden = true;
  if (activeBandId !== "cb") {
    mainHunterBandSelect.value = activeBandId;
    localStorage.setItem("yeasuCatHunterBandId", activeBandId);
  }
  showView("hunter");
  syncHunterFrameBand();
  setStatus("SSB Hunter tab ready", connected);
}

function renderMainHunterBandOptions() {
  const selectedBandId = localStorage.getItem("yeasuCatHunterBandId") ?? activeBandId;
  mainHunterBandSelect.replaceChildren();
  for (const profile of Object.values(bandProfiles)) {
    mainHunterBandSelect.append(new Option(profile.name ?? profile.id, profile.id));
  }

  mainHunterBandSelect.value = bandProfiles[selectedBandId] ? selectedBandId : activeBandId;
  syncHunterFrameBand();
}

function handleMainHunterBandChange() {
  localStorage.setItem("yeasuCatHunterBandId", mainHunterBandSelect.value);
  syncHunterFrameBand();
  setStatus(`${bandProfiles[mainHunterBandSelect.value]?.name ?? "Band"} staged for SSB Hunter`, connected);
}

function syncHunterFrameBand() {
  if (!hunterFrame?.contentWindow || !mainHunterBandSelect.value) {
    return;
  }

  hunterFrame.contentWindow.postMessage({
    type: "hunterBand",
    bandId: mainHunterBandSelect.value
  }, location.origin);
}

function syncHunterFrameVisibility(viewName = currentViewName()) {
  if (!hunterFrame?.contentWindow) {
    return;
  }

  hunterFrame.contentWindow.postMessage({
    type: "hunterVisibility",
    active: viewName === "hunter" && !document.hidden
  }, location.origin);
}

function openPotaSpotsTab(contextDraft = null) {
  const draft = contextDraft ?? stagePotaContext();
  persistPotaContext(draft);
  showView("pota");
  syncPotaFrameContext(draft);
  setStatus("POTA spots ready", connected);
}

function stagePotaContext() {
  return {
    state: contactContextFromState(),
    openedAt: Date.now()
  };
}

function persistPotaContext(draft) {
  localStorage.setItem("yeasuCatPotaContext", JSON.stringify(draft));
  renderPotaBandStatus(draft.state);
}

function handlePotaFrameLoad() {
  if (potaFrame?.dataset.loaded === "1") {
    let pendingContext = null;
    if (potaFrame.dataset.pendingContext) {
      try {
        pendingContext = JSON.parse(potaFrame.dataset.pendingContext);
      } catch {
        pendingContext = null;
      }
      delete potaFrame.dataset.pendingContext;
    }
    syncPotaFrameContext(pendingContext);
  }
}

function syncPotaFrameContext(contextDraft = null) {
  const draft = contextDraft ?? stagePotaContext();
  persistPotaContext(draft);
  if (!potaFrame?.contentWindow) {
    return;
  }
  if (potaFrame.dataset.loaded !== "1") {
    potaFrame.dataset.loaded = "1";
    potaFrame.dataset.pendingContext = JSON.stringify(draft);
    potaFrame.src = potaFrame.dataset.src ?? "/pota-spots.html?embedded=1";
    return;
  }

  potaFrame.contentWindow.postMessage({
    type: "potaContext",
    context: draft
  }, location.origin);
}

function openContactLoggerTab(record = null, options = {}) {
  const draft = options.draft ?? {
    record,
    state: options.state ?? contactContextFromState(),
    openedAt: Date.now()
  };
  localStorage.setItem("yeasuCatContactDraft", JSON.stringify(draft));
  reloadLoggerFrame();
  showView("logger");
  setStatus(
    draft.record?.localOnly ? "Local CB log edit loaded"
      : draft.record ? "QRZ edit loaded in Logger tab"
      : "QRZ contact logger ready",
    connected
  );
}

function reloadLoggerFrame() {
  if (!loggerFrame) {
    return;
  }

  loggerFrame.src = `/contact-log.html?embedded=1&draft=${Date.now()}`;
}

function handleAppMessage(event) {
  if (event.origin !== location.origin) {
    return;
  }

  if (event.data?.type === "openContactLogger") {
    openContactLoggerTab(event.data?.draft?.record ?? null, {
      draft: event.data?.draft,
      state: event.data?.state
    });
    return;
  }

  if (event.data?.type === "openPotaSpots") {
    openPotaSpotsTab(event.data?.context ?? null);
    return;
  }

  if (event.data?.type === "cbLocalLogUpdated") {
    cbLocalRecords = loadLocalCbRecords();
    renderBandLogbook();
    renderCbLocalLogbook();
    setStatus("Local CB log updated", connected);
    return;
  }

  if (event.data?.type === "qsoCardStatusUpdated") {
    if (qrzLoadedOnce || qrzAllRecords.length > 0) {
      applyQrzRangeFilter();
    } else {
      renderQrzTable(qrzRecords);
    }
    renderBandLogbook();
    renderCbLocalLogbook();
    setStatus("QSO card queue updated", connected);
  }
}

function applyRouteFromHash() {
  const route = location.hash.replace(/^#/, "");
  if (route === "pota") {
    openPotaSpotsTab();
    return;
  }
  if (route === "logger" || route === "logbook" || route === "hunter" || route === "audioTest" || route === "diagnostics") {
    showView(route === "diagnostics" ? "diagnostics" : route);
  }
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
    setStatus("Popout blocked. Allow popouts for manual frequency entry.", connected);
    return;
  }

  popup.focus();
  setStatus("Manual frequency popout opened", connected);
}

function contactContextFromState() {
  const profile = bandProfiles[activeBandId] ?? {};
  const hz = Number.isInteger(latestCatState?.hz) ? latestCatState.hz : lastKnownHz;
  return {
    connected,
    bandId: activeBandId,
    band: profile.id,
    bandName: profile.name,
    adifBand: bandIdToAdifBand(activeBandId),
    hz,
    frequency: Number.isInteger(hz) ? formatFrequencyDisplay(hz) : profile.centerDisplay,
    frequencyMhz: Number.isInteger(hz) ? hzToMhz(hz) : hzToMhz(profile.centerHz),
    mode: latestCatState?.mode ?? modeDisplay.textContent ?? profile.defaultMode,
    channel: latestCatState?.channel ?? null
  };
}

async function loadQrzStatus() {
  qrzLogbookStatus.textContent = "Checking...";
  try {
    const response = await fetch("/api/qrz/status");
    const data = await response.json();
    qrzLogbookStatus.textContent = data.ok ? "QRZ ready" : data.reason ?? "QRZ status failed";
    if (!data.ok) {
      logMessage(`QRZ status: ${data.reason ?? "failed"}`);
    }
  } catch (error) {
    qrzLogbookStatus.textContent = "QRZ status failed";
    logMessage(`QRZ status failed: ${error.message}`);
  }
}

async function loadQrzLogbook() {
  qrzLoadedOnce = true;
  qrzRefreshButton.disabled = true;
  bandLogbookRefreshButton.disabled = true;
  qrzLogbookStatus.textContent = "Fetching all logs...";
  bandLogbookStatus.textContent = "Fetching all logs...";
  renderQrzTable([]);
  renderQrzMap([]);

  try {
    const response = await fetch(`/api/qrz/logbook?range=all&max=250&maxPages=${QRZ_LOGBOOK_MAX_PAGES}`);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "QRZ fetch failed");
    }

    qrzAllRecords = data.records ?? [];
    applyQrzRangeFilter({
      truncated: data.truncated,
      totalCount: data.count
    });
  } catch (error) {
    qrzAllRecords = [];
    qrzRecords = [];
    qrzLogbookStatus.textContent = "QRZ fetch failed";
    bandLogbookStatus.textContent = "QRZ fetch failed";
    renderBandLogbook([]);
    renderQrzTable([]);
    renderQrzMap([]);
    logMessage(`QRZ logbook fetch failed: ${error.message}`);
  } finally {
    qrzRefreshButton.disabled = false;
    bandLogbookRefreshButton.disabled = false;
  }
}

function applyQrzRangeFilter(options = {}) {
  if (!qrzLoadedOnce && qrzAllRecords.length === 0) {
    void loadQrzLogbook();
    return;
  }

  const range = qrzRangeSelect.value;
  const rangeRecords = filterQrzRecordsByRange(qrzAllRecords, range);
  const cardFilter = qsoCardFilterSelect.value;
  qrzRecords = filterQrzRecordsByCardStatus(rangeRecords, cardFilter);
  const rangeLabel = qrzRangeSelect.selectedOptions[0]?.textContent ?? range;
  const cardLabel = qsoCardFilterSelect.selectedOptions[0]?.textContent ?? cardFilter;
  const total = qrzAllRecords.length;
  const suffix = options.truncated ? " (QRZ fetch truncated)" : "";
  if (cardFilter !== "all") {
    qrzLogbookStatus.textContent = `${qrzRecords.length} ${cardLabel.toLowerCase()} in ${rangeLabel.toLowerCase()} of ${total} contacts${suffix}`;
  } else {
    qrzLogbookStatus.textContent = range === "all"
      ? `${total} contacts${suffix}`
      : `${qrzRecords.length} ${rangeLabel.toLowerCase()} of ${total} contacts${suffix}`;
  }
  renderQrzTable(qrzRecords);
  renderQrzMap(qrzRecords);
  renderBandLogbook();
}

function filterQrzRecordsByRange(records, range) {
  if (range === "all") {
    return records;
  }

  const now = new Date();
  const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : null;
  if (!days) {
    return records;
  }

  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - (days - 1));
  const end = startOfLocalDay(now);
  end.setDate(end.getDate() + 1);
  return records.filter((record) => {
    const qsoDate = qrzRecordLocalDate(record);
    return qsoDate && qsoDate >= start && qsoDate < end;
  });
}

function filterQrzRecordsByCardStatus(records, filter) {
  if (filter === "queued") {
    return records.filter((record) => qsoCardStatusForRecord(record)?.status === "queued");
  }
  if (filter === "sent") {
    return records.filter((record) => qsoCardStatusForRecord(record)?.status === "sent");
  }
  return records;
}

function ensureBandLogbookLoaded() {
  if (qrzLoadedOnce || qrzAllRecords.length > 0) {
    renderBandLogbook();
    return;
  }

  void loadQrzLogbook();
}

function refreshBandLogbook() {
  cbLocalRecords = loadLocalCbRecords();
  if (activeBandId === "cb") {
    renderBandLogbook();
    return;
  }

  void loadQrzLogbook();
}

function scheduleBandPotaRefresh() {
  if (bandPotaRefreshTimer) {
    clearInterval(bandPotaRefreshTimer);
  }

  bandPotaRefreshTimer = setInterval(() => {
    if (isBandPotaAvailable()) {
      void loadBandPotaSpots({ force: true });
    }
  }, BAND_POTA_REFRESH_MS);
}

async function loadBandPotaSpots(options = {}) {
  if (!bandPotaPanel) {
    return;
  }

  if (!isBandPotaAvailable()) {
    bandPotaRequestId += 1;
    bandPotaSpots = [];
    bandPotaError = "";
    bandPotaLoadedKey = "";
    bandPotaLoadingKey = "";
    renderBandPotaPanel();
    return;
  }

  const { force = false } = options;
  const requestBandId = activeBandId;
  const requestKey = `${requestBandId}:active`;
  if (!force && (bandPotaLoadingKey === requestKey || bandPotaLoadedKey === requestKey)) {
    renderBandPotaPanel();
    return;
  }

  const requestId = ++bandPotaRequestId;
  if (bandPotaLoadedKey !== requestKey) bandPotaSpots = [];
  bandPotaLoadingKey = requestKey;
  bandPotaError = "";
  bandPotaRefreshButton.disabled = true;
  if (options.showLoading ?? bandPotaSpots.length === 0) {
    renderBandPotaPanel({ loading: true });
  }

  try {
    const response = await fetch(`/api/pota/spots?bandId=${encodeURIComponent(requestBandId)}&includeQrt=false`);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "POTA fetch failed");
    }
    if (requestId !== bandPotaRequestId) {
      return;
    }

    bandPotaSpots = data.spots ?? [];
    bandPotaLoadedKey = requestKey;
    renderBandPotaPanel({ total: data.total ?? bandPotaSpots.length });
  } catch (error) {
    if (requestId === bandPotaRequestId) {
      bandPotaSpots = [];
      bandPotaError = error.message;
      renderBandPotaPanel();
    }
  } finally {
    if (requestId === bandPotaRequestId) {
      bandPotaLoadingKey = "";
      bandPotaRefreshButton.disabled = false;
      renderBandPotaPanel();
    }
  }
}

function renderBandPotaPanel(options = {}) {
  if (!bandPotaPanel || !bandPotaStatus || !bandPotaList) {
    return;
  }

  const available = isBandPotaAvailable();
  bandPotaPanel.hidden = !available;
  if (!available) {
    return;
  }

  const profile = bandProfiles[activeBandId] ?? {};
  const visibleSpots = bandPotaSpots.slice(0, BAND_POTA_VISIBLE_LIMIT);
  const loading = options.loading || bandPotaLoadingKey.startsWith(`${activeBandId}:`);
  if (loading && bandPotaSpots.length === 0) {
    bandPotaStatus.textContent = `Checking ${profile.name ?? activeBandId} activations...`;
  } else if (bandPotaError) {
    bandPotaStatus.textContent = `POTA unavailable: ${bandPotaError}`;
  } else if (bandPotaSpots.length === 0) {
    bandPotaStatus.textContent = `No active spots on ${profile.name ?? activeBandId}`;
  } else {
    const suffix = bandPotaSpots.length > visibleSpots.length ? `, showing ${visibleSpots.length}` : "";
    bandPotaStatus.textContent = `${bandPotaSpots.length} active spots${suffix}`;
  }

  bandPotaList.replaceChildren();
  if (loading && bandPotaSpots.length === 0) {
    bandPotaList.append(createBandPotaEmpty("Loading current POTA activations..."));
    return;
  }

  if (bandPotaError) {
    bandPotaList.append(createBandPotaEmpty("Could not load POTA spots. Hit Refresh and we will try again."));
    return;
  }

  if (visibleSpots.length === 0) {
    bandPotaList.append(createBandPotaEmpty(`No active POTA spots inside ${profile.name ?? activeBandId}'s scan range.`));
    return;
  }

  for (const spot of visibleSpots) {
    bandPotaList.append(createBandPotaRow(spot));
  }
}

function createBandPotaEmpty(message) {
  const empty = document.createElement("div");
  empty.className = "band-pota-empty";
  empty.textContent = message;
  return empty;
}

function createBandPotaRow(spot) {
  const row = document.createElement("section");
  row.className = "band-pota-row";
  row.dataset.spotId = spot.id ?? "";

  const main = document.createElement("div");
  main.className = "band-pota-main";
  const title = document.createElement("strong");
  title.textContent = spot.activator || "--";
  const park = document.createElement("span");
  park.textContent = [spot.reference, spot.parkName].filter(Boolean).join(" - ") || "POTA activation";
  const comments = document.createElement("small");
  comments.textContent = [spot.locationDesc, spot.comments].filter(Boolean).join(" | ");
  main.append(title, park, comments);

  const meta = document.createElement("div");
  meta.className = "band-pota-meta";
  const frequency = document.createElement("strong");
  frequency.textContent = spot.displayFrequency ?? formatFrequencyDisplay(spot.hz);
  const mode = document.createElement("span");
  mode.textContent = spot.mode || "--";
  const age = document.createElement("small");
  age.textContent = `${formatPotaSpotAge(spot.ageMinutes)} | spots ${spot.count ?? 0}`;
  meta.append(frequency, mode, age);

  const actions = document.createElement("div");
  actions.className = "band-pota-actions";
  const tune = document.createElement("button");
  tune.type = "button";
  tune.dataset.bandPotaTuneId = spot.id ?? "";
  tune.textContent = "Tune";
  actions.append(tune);

  row.append(main, meta, actions);
  return row;
}

function handleBandPotaClick(event) {
  const tuneButton = event.target.closest("[data-band-pota-tune-id]");
  if (!tuneButton) {
    return;
  }

  const spot = bandPotaSpots.find((candidate) => String(candidate.id ?? "") === String(tuneButton.dataset.bandPotaTuneId));
  if (spot) {
    tuneBandPotaSpot(spot);
  }
}

function tuneBandPotaSpot(spot) {
  rememberBandPotaSpot(spot);
  if (!Number.isInteger(spot.hz)) {
    setStatus("POTA spot does not have a usable frequency", connected);
    return;
  }

  if (!radioPowered) {
    setStatus("Power on the HF Stack before tuning a POTA spot", false);
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    setStatus("Connect CAT before tuning a POTA spot", false);
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before tuning a POTA spot", connected);
    return;
  }

  previewCockpitFrequency(spot.hz);
  sendFrequencyTune(spot.hz, { flush: true, force: true, showDisconnectedStatus: true });
  setStatus(`Tuned ${spot.displayFrequency ?? formatFrequencyDisplay(spot.hz)} for ${spot.activator || "POTA"}`, true);
}

function rememberBandPotaSpot(spot) {
  localStorage.setItem("yeasuCatLastPotaSpot", JSON.stringify({
    activator: spot.activator ?? "",
    reference: spot.reference ?? "",
    parkName: spot.parkName ?? "",
    mode: spot.mode ?? "",
    hz: spot.hz,
    displayFrequency: spot.displayFrequency ?? "",
    savedAt: Date.now()
  }));
}

function isBandPotaAvailable(bandId = activeBandId) {
  return bandId !== "cb" && Boolean(bandProfiles[bandId]);
}

function formatPotaSpotAge(minutes) {
  if (!Number.isFinite(minutes)) {
    return "--";
  }
  if (minutes < 1) {
    return "now";
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  return `${Math.round(minutes / 60)} hr`;
}

function renderBandLogbook(records = qrzAllRecords) {
  if (!bandLogbookBody) {
    return;
  }

  bandLogbookBody.replaceChildren();
  syncBandLogbookHeader(activeBandId === "cb");
  const band = bandIdToAdifBand(activeBandId);
  const bandName = bandProfiles[activeBandId]?.name ?? activeBandId;
  if (activeBandId === "cb") {
    const bandRecords = cbLocalRecords
      .filter(isCbQrzRecord)
      .sort(compareQrzRecordsNewestFirst);
    bandLogbookStatus.textContent = `${bandRecords.length} local-only CB contacts`;
    if (bandRecords.length === 0) {
      appendBandLogbookEmpty("No local CB contacts yet. CB QSOs are saved locally and never synced to QRZ.");
      return;
    }
    renderCbLogRows(bandLogbookBody, bandRecords);
    return;
  }

  if (!qrzLoadedOnce && records.length === 0) {
    bandLogbookStatus.textContent = `${bandName} contacts loading...`;
    appendBandLogbookEmpty("Loading QRZ contacts...");
    return;
  }

  const bandRecords = records
    .filter((record) => normalizeBandLabel(record.band) === normalizeBandLabel(band))
    .sort(compareQrzRecordsNewestFirst);

  bandLogbookStatus.textContent = `${bandRecords.length} logged on ${bandName}`;
  if (bandRecords.length === 0) {
    appendBandLogbookEmpty(`No ${bandName} contacts found in the loaded QRZ logbook.`);
    return;
  }

  renderHamBandLogbookRows(bandRecords);
}

function renderHamBandLogbookRows(records) {
  for (const [index, record] of records.entries()) {
    const row = document.createElement("tr");
    row.dataset.logid = record.logid ?? "";
    row.dataset.recordIndex = String(index);

    const callCell = document.createElement("td");
    if (record.call) {
      const callWrap = document.createElement("div");
      callWrap.className = "qrz-call-cell";
      if (record.localOnly) {
        const localCall = document.createElement("button");
        localCall.type = "button";
        localCall.className = "local-cb-edit-button";
        localCall.dataset.cbLogEdit = record.logid ?? "";
        localCall.title = "Edit local CB log entry";
        localCall.textContent = record.call;
        callWrap.append(localCall);
        const localBadge = document.createElement("span");
        localBadge.className = "local-only-badge";
        localBadge.textContent = "local CB";
        callWrap.append(localBadge);
      } else {
        const link = document.createElement("a");
        link.href = record.qrzUrl || `https://www.qrz.com/db/${encodeURIComponent(record.call)}`;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = record.call;
        callWrap.append(link);
      }
      if (record.name) {
        const name = record.localOnly ? document.createElement("button") : document.createElement("span");
        name.className = "qrz-contact-name";
        if (record.localOnly) {
          name.type = "button";
          name.classList.add("local-cb-edit-button", "local-cb-name-button");
          name.dataset.cbLogEdit = record.logid ?? "";
          name.title = "Edit local CB log entry";
        }
        name.textContent = record.name;
        callWrap.append(name);
      }
      callCell.append(callWrap);
    } else {
      callCell.textContent = "--";
    }

    const values = [
      formatAdifDate(record.qso_date),
      formatAdifTime(record.time_on),
      record.displayMode ?? record.mode ?? "--",
      record.freq ?? "--",
      [record.gridsquare, record.qth].filter(Boolean).join(" / ") || "--"
    ];
    row.append(callCell, ...values.map((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      return cell;
    }));

    bandLogbookBody.append(row);
  }
}

function syncBandLogbookHeader(isCb = activeBandId === "cb") {
  if (!bandLogbookHeadRow) {
    return;
  }

  const headers = isCb
    ? ["Number", "Handle", "Location", "Freq", "Mode", "Date EST", "Time EST", "Edit"]
    : ["Call", "Date", "Time", "Mode", "Freq", "Grid/QTH"];
  bandLogbookHeadRow.replaceChildren(...headers.map((label) => {
    const header = document.createElement("th");
    header.textContent = label;
    return header;
  }));
}

function appendBandLogbookEmpty(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = activeBandId === "cb" ? 8 : 6;
  cell.textContent = message;
  row.append(cell);
  bandLogbookBody.append(row);
}

function normalizeBandLabel(value) {
  return String(value ?? "").trim().toLowerCase();
}

function compareQrzRecordsNewestFirst(a, b) {
  const aTime = qrzRecordLocalDate(a)?.getTime() ?? 0;
  const bTime = qrzRecordLocalDate(b)?.getTime() ?? 0;
  return bTime - aTime;
}

function loadLocalCbRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(CB_LOCAL_LOG_STORAGE_KEY) ?? "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function loadOperatorJournalEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(OPERATOR_JOURNAL_STORAGE_KEY) ?? "[]");
    return Array.isArray(entries)
      ? entries.filter((entry) => String(entry?.note ?? "").trim()).slice(0, OPERATOR_JOURNAL_MAX_ENTRIES)
      : [];
  } catch {
    return [];
  }
}

function saveOperatorJournalEntries() {
  localStorage.setItem(OPERATOR_JOURNAL_STORAGE_KEY, JSON.stringify(operatorJournalEntriesData.slice(0, OPERATOR_JOURNAL_MAX_ENTRIES)));
}

function handleOperatorJournalStorage(event) {
  if (event.key !== OPERATOR_JOURNAL_STORAGE_KEY) {
    return;
  }

  operatorJournalEntriesData = loadOperatorJournalEntries();
  operatorJournalIndex = Math.min(operatorJournalIndex, Math.max(0, operatorJournalEntriesData.length - 1));
  renderOperatorJournal();
}

function handleOperatorJournalKeyDown(event) {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    submitOperatorJournalNote();
  }
}

function openOperatorJournalWindow() {
  const left = Math.max(0, Math.round((window.screenX || 0) + 80));
  const top = Math.max(0, Math.round((window.screenY || 0) + 60));
  const popup = window.open(
    "/operator-journal.html",
    "operator-journal",
    `popup=yes,width=660,height=620,left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
  if (!popup) {
    setStatus("Journal popout blocked. Allow popouts for this console.", connected);
    operatorJournalStatus.textContent = "Popout blocked";
    return;
  }
  popup.focus?.();
  setStatus("Operator journal opened", connected);
}

function submitOperatorJournalNote() {
  const note = String(operatorJournalInput.value ?? "").trim();
  if (!note) {
    operatorJournalStatus.textContent = "Nothing to stamp";
    setStatus("Journal note is blank", connected);
    operatorJournalInput.focus();
    return;
  }

  const context = operatorJournalContext();
  operatorJournalEntriesData = [{
    id: `note-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    note,
    ...context
  }, ...operatorJournalEntriesData].slice(0, OPERATOR_JOURNAL_MAX_ENTRIES);
  operatorJournalIndex = 0;
  saveOperatorJournalEntries();
  operatorJournalInput.value = "";
  renderOperatorJournal();
  setStatus("Journal note stamped", connected);
}

function showOlderOperatorJournalNote() {
  if (operatorJournalIndex < operatorJournalEntriesData.length - 1) {
    operatorJournalIndex += 1;
    renderOperatorJournal();
  }
}

function showNewerOperatorJournalNote() {
  if (operatorJournalIndex > 0) {
    operatorJournalIndex -= 1;
    renderOperatorJournal();
  }
}

function showLatestOperatorJournalNote() {
  if (operatorJournalIndex !== 0) {
    operatorJournalIndex = 0;
    renderOperatorJournal();
  }
}

function removeOperatorJournalNote(id) {
  const noteId = String(id ?? "");
  if (!noteId) {
    return;
  }

  const nextEntries = operatorJournalEntriesData.filter((entry) => String(entry.id ?? "") !== noteId);
  if (nextEntries.length === operatorJournalEntriesData.length) {
    return;
  }

  operatorJournalEntriesData = nextEntries;
  operatorJournalIndex = Math.min(operatorJournalIndex, Math.max(0, operatorJournalEntriesData.length - 1));
  saveOperatorJournalEntries();
  renderOperatorJournal();
  setStatus("Journal note removed", connected);
}

function operatorJournalContext() {
  const profile = bandProfiles[activeBandId] ?? {};
  const hz = Number.isInteger(latestCatState?.hz)
    ? latestCatState.hz
    : Number.isInteger(lastKnownHz)
    ? lastKnownHz
    : null;
  return {
    bandId: activeBandId,
    bandName: profile.name ?? activeBandId,
    frequency: Number.isInteger(hz) ? formatFrequencyDisplay(hz) : frequencyDisplay.textContent,
    mode: modeDisplay.textContent && modeDisplay.textContent !== "--"
      ? modeDisplay.textContent
      : profile.defaultMode ?? ""
  };
}

function renderOperatorJournal() {
  const count = operatorJournalEntriesData.length;
  operatorJournalIndex = Math.min(Math.max(operatorJournalIndex, 0), Math.max(0, count - 1));
  operatorJournalStatus.textContent = count === 0
    ? "Rolling notes"
    : count === 1
    ? "1 stamped note"
    : `Note ${operatorJournalIndex + 1} of ${count}`;

  if (!operatorJournalEntries) {
    return;
  }

  operatorJournalEntries.replaceChildren();

  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "operator-journal-viewer";
    empty.innerHTML = `
      <div class="operator-journal-empty">No notes stamped yet.</div>
      <div class="operator-journal-nav" aria-label="Journal navigation">
        <button type="button" disabled>&larr; Older</button>
        <button type="button" disabled>Newer &rarr;</button>
        <button type="button" disabled>Latest</button>
      </div>
    `;
    operatorJournalEntries.append(empty);
    return;
  }

  const entry = operatorJournalEntriesData[operatorJournalIndex];
  const viewer = document.createElement("div");
  viewer.className = "operator-journal-viewer";
  viewer.append(createOperatorJournalEntry(entry), createOperatorJournalNav({
    canShowOlder: operatorJournalIndex < count - 1,
    canShowNewer: operatorJournalIndex > 0,
    canShowLatest: operatorJournalIndex > 0
  }));
  operatorJournalEntries.append(viewer);
}

function createOperatorJournalNav({ canShowOlder, canShowNewer, canShowLatest }) {
  const nav = document.createElement("div");
  nav.className = "operator-journal-nav";
  nav.setAttribute("aria-label", "Journal navigation");

  const older = document.createElement("button");
  older.type = "button";
  older.textContent = "\u2190 Older";
  older.disabled = !canShowOlder;
  older.addEventListener("click", showOlderOperatorJournalNote);

  const newer = document.createElement("button");
  newer.type = "button";
  newer.textContent = "Newer \u2192";
  newer.disabled = !canShowNewer;
  newer.addEventListener("click", showNewerOperatorJournalNote);

  const latest = document.createElement("button");
  latest.type = "button";
  latest.textContent = "Latest";
  latest.disabled = !canShowLatest;
  latest.addEventListener("click", showLatestOperatorJournalNote);

  nav.append(older, newer, latest);
  return nav;
}

function createOperatorJournalEntry(entry) {
  const item = document.createElement("article");
  item.className = "operator-journal-entry";

  const meta = document.createElement("div");
  meta.className = "operator-journal-meta";
  const time = document.createElement("time");
  time.dateTime = entry.createdAt ?? "";
  time.textContent = formatOperatorJournalTimestamp(entry.createdAt);
  const station = document.createElement("span");
  station.textContent = [
    entry.bandName ?? entry.bandId,
    entry.frequency,
    entry.mode
  ].filter(Boolean).join(" | ");
  meta.append(time, station);

  const body = document.createElement("p");
  body.textContent = entry.note ?? "";

  const actions = document.createElement("div");
  actions.className = "operator-journal-entry-actions";
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove Note";
  removeButton.addEventListener("click", () => removeOperatorJournalNote(entry.id));
  actions.append(removeButton);

  item.append(meta, body, actions);
  return item;
}

function formatOperatorJournalTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function renderCbLocalLogbook() {
  if (!cbLocalLogBody) {
    return;
  }

  cbLocalLogBody.replaceChildren();
  const records = cbLocalRecords
    .filter(isCbQrzRecord)
    .sort(compareQrzRecordsNewestFirst);
  cbLocalLogStatus.textContent = records.length === 1
    ? "1 local-only CB contact"
    : `${records.length} local-only CB contacts`;
  if (records.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "No local CB contacts yet. CB QSOs stay in this browser and never sync to QRZ.";
    row.append(cell);
    cbLocalLogBody.append(row);
    return;
  }

  renderCbLogRows(cbLocalLogBody, records);
}

function renderCbLogRows(container, records) {
  for (const record of records) {
    const row = document.createElement("tr");
    row.dataset.logid = record.logid ?? "";
    const eastern = formatCbEasternDateTime(record);
    const values = [
      createCbNumberCell(record),
      createCbHandleCell(record),
      record.qth || record.gridsquare || "--",
      record.freq ?? "--",
      record.displayMode ?? record.mode ?? "--",
      eastern.date,
      eastern.time,
      createCbEditCell(record)
    ];
    row.append(...values.map((value) => {
      if (value instanceof Node) {
        return value;
      }
      const cell = document.createElement("td");
      cell.textContent = value;
      return cell;
    }));
    container.append(row);
  }
}

function createCbNumberCell(record) {
  const cell = document.createElement("td");
  cell.textContent = record.call || "--";
  return cell;
}

function createCbHandleCell(record) {
  const cell = document.createElement("td");
  cell.textContent = record.name || "--";
  return cell;
}

function createCbEditCell(record) {
  const cell = document.createElement("td");
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "local-cb-edit-button";
  edit.dataset.cbLogEdit = record.logid ?? "";
  edit.title = "Edit local CB log entry";
  edit.textContent = "Edit";
  cell.append(edit);
  appendQsoCardControls(cell, record);
  return cell;
}

function formatCbEasternDateTime(record = {}) {
  const cleanDate = String(record.qso_date ?? "").replace(/\D/g, "");
  const cleanTime = String(record.time_on ?? "").replace(/\D/g, "").padEnd(6, "0");
  if (cleanDate.length !== 8 || cleanTime.length < 6) {
    return { date: "--", time: "--" };
  }

  const qsoDate = new Date(Date.UTC(
    Number(cleanDate.slice(0, 4)),
    Number(cleanDate.slice(4, 6)) - 1,
    Number(cleanDate.slice(6, 8)),
    Number(cleanTime.slice(0, 2)),
    Number(cleanTime.slice(2, 4)),
    Number(cleanTime.slice(4, 6))
  ));
  if (Number.isNaN(qsoDate.getTime())) {
    return { date: "--", time: "--" };
  }

  return {
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    }).format(qsoDate),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit"
    }).format(qsoDate)
  };
}

function isCbQrzRecord(record = {}) {
  const band = String(record.band ?? record.bandId ?? "").trim().toLowerCase();
  const freq = Number(record.freq ?? record.frequencyMhz);
  return band === "11m"
    || band === "cb"
    || (Number.isFinite(freq) && freq >= CB_MIN_MHZ && freq <= CB_MAX_MHZ);
}

function handleCbLogClick(event) {
  const queueCardButton = event.target.closest("[data-qso-card-queue]");
  if (queueCardButton) {
    const record = findQsoCardActionRecord(queueCardButton.dataset.qsoCardQueue);
    if (record) {
      const entry = queueQsoCardForRecord(record);
      setStatus(entry?.call ? `QSO card queued for ${entry.call}` : "QSO card queued", connected);
      renderBandLogbook();
      renderCbLocalLogbook();
    }
    return;
  }

  const sentCardButton = event.target.closest("[data-qso-card-sent]");
  if (sentCardButton) {
    const record = findQsoCardActionRecord(sentCardButton.dataset.qsoCardSent);
    if (record) {
      const entry = markQsoCardSentForRecord(record);
      setStatus(entry?.call ? `QSO card marked sent for ${entry.call}` : "QSO card marked sent", connected);
      renderBandLogbook();
      renderCbLocalLogbook();
    }
    return;
  }

  const target = event.target.closest("[data-cb-log-edit]");
  if (!target) {
    return;
  }

  const record = findLocalCbRecord(target.dataset.cbLogEdit);
  if (!record) {
    setStatus("Local CB record not found", connected);
    return;
  }

  openContactLoggerTab(record, {
    state: {
      ...contactContextFromState(),
      bandId: "cb",
      band: "cb",
      bandName: "CB",
      adifBand: "11m",
      frequencyMhz: record.freq,
      hz: mhzToHz(record.freq),
      mode: record.mode ?? "AM"
    }
  });
}

function findLocalCbRecord(logid) {
  return cbLocalRecords.find((record) => String(record.logid ?? "") === String(logid ?? ""));
}

function loadQsoCardQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QSO_CARD_QUEUE_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveQsoCardQueue(queue) {
  localStorage.setItem(QSO_CARD_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

function qsoCardStatusForRecord(record = {}) {
  const key = qsoCardRecordKey(record);
  const signature = qsoCardSignature(record);
  const queue = loadQsoCardQueue();
  if (queue[key]) {
    return { ...queue[key], key };
  }

  const fallback = Object.entries(queue)
    .find(([, entry]) => entry?.signature && entry.signature === signature);
  return fallback ? { ...fallback[1], key: fallback[0] } : null;
}

function queueQsoCardForRecord(record = {}) {
  const entry = qsoCardEntryFromRecord(record, { status: "queued" });
  if (!entry) {
    return null;
  }

  const queue = loadQsoCardQueue();
  const existing = qsoCardStatusForRecord(record);
  if (existing?.key && existing.key !== entry.key) {
    delete queue[existing.key];
  }
  queue[entry.key] = {
    ...queue[entry.key],
    ...entry,
    status: "queued",
    queuedAt: queue[entry.key]?.queuedAt ?? existing?.queuedAt ?? new Date().toISOString(),
    sentAt: null
  };
  saveQsoCardQueue(queue);
  return queue[entry.key];
}

function markQsoCardSentForRecord(record = {}) {
  const entry = qsoCardEntryFromRecord(record, { status: "sent" });
  if (!entry) {
    return null;
  }

  const queue = loadQsoCardQueue();
  const existing = qsoCardStatusForRecord(record);
  if (existing?.key && existing.key !== entry.key) {
    delete queue[existing.key];
  }
  queue[entry.key] = {
    ...queue[entry.key],
    ...existing,
    ...entry,
    status: "sent",
    queuedAt: existing?.queuedAt ?? queue[entry.key]?.queuedAt ?? new Date().toISOString(),
    sentAt: new Date().toISOString()
  };
  saveQsoCardQueue(queue);
  return queue[entry.key];
}

function qsoCardEntryFromRecord(record = {}, options = {}) {
  const call = String(record.call ?? "").trim().toUpperCase();
  if (!call) {
    return null;
  }

  const localOnly = record.localOnly === true || isCbQrzRecord(record);
  const key = qsoCardRecordKey(record);
  const signature = qsoCardSignature(record);
  return {
    key,
    signature,
    logid: String(record.logid ?? "").trim(),
    localOnly,
    source: localOnly ? "local-cb" : "qrz",
    status: options.status ?? "queued",
    call,
    name: String(record.name ?? "").trim(),
    qth: String(record.qth ?? "").trim(),
    grid: String(record.gridsquare ?? record.grid ?? "").trim().toUpperCase(),
    qsoDate: normalizeAdifDateValue(record.qso_date),
    timeOn: normalizeAdifTimeValue(record.time_on),
    freq: normalizeQsoCardMhz(record.freq),
    band: String(record.band ?? "").trim(),
    mode: String(record.submode || record.displayMode || record.mode || "").trim().toUpperCase()
  };
}

function qsoCardRecordKey(record = {}) {
  const logid = String(record.logid ?? "").trim();
  if (logid) {
    return `${record.localOnly === true || isCbQrzRecord(record) ? "cb" : "qrz"}:${logid}`;
  }
  return `contact:${qsoCardSignature(record)}`;
}

function qsoCardSignature(record = {}) {
  return [
    String(record.call ?? "").trim().toUpperCase(),
    normalizeAdifDateValue(record.qso_date ?? record.qsoDate),
    normalizeAdifTimeValue(record.time_on ?? record.timeOn).slice(0, 4),
    normalizeQsoCardMhz(record.freq)
  ].join(":");
}

function normalizeAdifDateValue(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length === 8 ? clean : "";
}

function normalizeAdifTimeValue(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length >= 4 ? clean.padEnd(6, "0").slice(0, 6) : "";
}

function normalizeQsoCardMhz(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
    : String(value ?? "").trim();
}

function formatQsoCardDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function renderQrzTable(records) {
  qrzLogbookBody.replaceChildren();
  if (records.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = qsoCardFilterSelect.value === "queued"
      ? "No queued unsent QSO cards match this logbook filter."
      : qsoCardFilterSelect.value === "sent"
      ? "No sent QSO cards match this logbook filter."
      : "No QRZ records loaded.";
    row.append(cell);
    qrzLogbookBody.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement("tr");
    row.dataset.logid = record.logid ?? "";
    const callCell = document.createElement("td");
    if (record.call) {
      const callWrap = document.createElement("div");
      callWrap.className = "qrz-call-cell";
      const link = document.createElement("a");
      link.href = record.qrzUrl || `https://www.qrz.com/db/${encodeURIComponent(record.call)}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = record.call;
      callWrap.append(link);
      if (record.name) {
        const name = document.createElement("span");
        name.className = "qrz-contact-name";
        name.textContent = record.name;
        callWrap.append(name);
      }
      callCell.append(callWrap);
    } else {
      callCell.textContent = "--";
    }

    const values = [
      formatAdifDate(record.qso_date),
      formatAdifTime(record.time_on),
      record.band ?? "--",
      record.displayMode ?? record.mode ?? "--",
      record.freq ?? "--",
      [record.gridsquare, record.qth].filter(Boolean).join(" / ") || "--"
    ];
    row.append(callCell, ...values.map((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      return cell;
    }));

    const toolsCell = document.createElement("td");
    toolsCell.className = "qrz-tools";
    if (isCbQrzRecord(record)) {
      const blocked = document.createElement("span");
      blocked.className = "local-only-badge";
      blocked.textContent = "11m write blocked";
      toolsCell.append(blocked);
    } else {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "mini-button";
      editButton.dataset.qrzEdit = record.logid ?? "";
      editButton.textContent = "Edit";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "mini-button danger-mini";
      deleteButton.dataset.qrzDelete = record.logid ?? "";
      deleteButton.textContent = "Delete";
      deleteButton.disabled = !record.logid;
      toolsCell.append(editButton, deleteButton);
    }
    appendQsoCardControls(toolsCell, record);
    row.append(toolsCell);
    qrzLogbookBody.append(row);
  }
}

function appendQsoCardControls(container, record) {
  const status = qsoCardStatusForRecord(record);
  if (status?.status === "sent") {
    const badge = document.createElement("span");
    badge.className = "qso-card-badge sent";
    badge.textContent = "Card sent";
    badge.title = status.sentAt ? `Marked sent ${formatQsoCardDateTime(status.sentAt)}` : "QSO card marked sent";
    container.append(badge);

    const requeue = document.createElement("button");
    requeue.type = "button";
    requeue.className = "mini-button";
    requeue.dataset.qsoCardQueue = qsoCardRecordKey(record);
    requeue.textContent = "Queue Again";
    container.append(requeue);
    return;
  }

  if (status?.status === "queued") {
    const badge = document.createElement("span");
    badge.className = "qso-card-badge queued";
    badge.textContent = "Card queued";
    badge.title = status.queuedAt ? `Queued ${formatQsoCardDateTime(status.queuedAt)}` : "QSO card queued";
    container.append(badge);

    const sent = document.createElement("button");
    sent.type = "button";
    sent.className = "mini-button primary-mini";
    sent.dataset.qsoCardSent = qsoCardRecordKey(record);
    sent.textContent = "Card Sent";
    container.append(sent);
    return;
  }

  const queue = document.createElement("button");
  queue.type = "button";
  queue.className = "mini-button";
  queue.dataset.qsoCardQueue = qsoCardRecordKey(record);
  queue.textContent = "Queue Card";
  container.append(queue);
}

function renderQrzMap(records) {
  qrzMapPins.replaceChildren();
  void drawQrzWorldMap();
  const mapped = records.filter((record) => Number.isFinite(record.coordinates?.lat) && Number.isFinite(record.coordinates?.lon));
  qrzMapSummary.textContent = mapped.length > 0
    ? `${mapped.length} mapped contacts of ${records.length} shown`
    : records.length > 0
    ? "Loaded contacts do not include lat/lon or grid squares for map pins."
    : "No contacts loaded.";

  for (const record of mapped) {
    const pin = document.createElement("a");
    pin.className = "map-pin";
    pin.href = record.qrzUrl || "#";
    pin.target = "_blank";
    pin.rel = "noreferrer";
    pin.title = `${record.call ?? "QSO"} ${record.band ?? ""} ${record.gridsquare ?? ""}`.trim();
    const left = ((record.coordinates.lon + 180) / 360) * 100;
    const top = ((90 - record.coordinates.lat) / 180) * 100;
    pin.style.left = `${Math.max(0, Math.min(100, left))}%`;
    pin.style.top = `${Math.max(0, Math.min(100, top))}%`;
    qrzMapPins.append(pin);
  }
}

async function loadQrzWorldMapData() {
  if (qrzWorldMapData) {
    return qrzWorldMapData;
  }

  if (!qrzWorldMapPromise) {
    qrzWorldMapPromise = fetch("/assets/ne_110m_land.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error("World map data failed to load.");
        }
        return response.json();
      })
      .then((data) => {
        qrzWorldMapData = data;
        return data;
      })
      .catch((error) => {
        logMessage(`Map overlay failed: ${error.message}`);
        return null;
      });
  }

  return qrzWorldMapPromise;
}

async function drawQrzWorldMap() {
  if (!qrzMapCanvas) {
    return;
  }

  const rect = qrzMapCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (qrzMapCanvas.width !== width || qrzMapCanvas.height !== height) {
    qrzMapCanvas.width = width;
    qrzMapCanvas.height = height;
  }

  const context = qrzMapCanvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawQrzMapBase(context, rect.width, rect.height);

  const data = await loadQrzWorldMapData();
  if (!data) {
    return;
  }

  drawQrzLand(context, data, rect.width, rect.height);
}

function drawQrzMapBase(context, width, height) {
  const ocean = context.createLinearGradient(0, 0, width, height);
  ocean.addColorStop(0, "#071a38");
  ocean.addColorStop(0.54, "#041127");
  ocean.addColorStop(1, "#120816");
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "rgba(143, 184, 255, 0.16)";
  context.lineWidth = 1;
  for (let lon = -150; lon <= 150; lon += 30) {
    const { x } = projectQrzMapPoint(lon, 0, width, height);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const { y } = projectQrzMapPoint(0, lat, width, height);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.strokeStyle = "rgba(248, 251, 255, 0.26)";
  const equator = projectQrzMapPoint(0, 0, width, height).y;
  const prime = projectQrzMapPoint(0, 0, width, height).x;
  context.beginPath();
  context.moveTo(0, equator);
  context.lineTo(width, equator);
  context.moveTo(prime, 0);
  context.lineTo(prime, height);
  context.stroke();
  context.restore();
}

function drawQrzLand(context, data, width, height) {
  context.save();
  context.fillStyle = "rgba(47, 120, 255, 0.22)";
  context.strokeStyle = "rgba(248, 251, 255, 0.58)";
  context.lineWidth = 1.4;
  context.shadowColor = "rgba(47, 120, 255, 0.32)";
  context.shadowBlur = 10;

  for (const feature of data.features ?? []) {
    drawQrzGeometry(context, feature.geometry, width, height);
  }

  context.restore();
}

function drawQrzGeometry(context, geometry, width, height) {
  if (!geometry) {
    return;
  }

  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
    ? geometry.coordinates
    : [];

  for (const polygon of polygons) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach(([lon, lat], index) => {
        const point = projectQrzMapPoint(lon, lat, width, height);
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.closePath();
    }
    context.fill("evenodd");
    context.stroke();
  }
}

function projectQrzMapPoint(lon, lat, width, height) {
  return {
    x: ((Number(lon) + 180) / 360) * width,
    y: ((90 - Number(lat)) / 180) * height
  };
}

function handleQrzTableClick(event) {
  const queueCardButton = event.target.closest("[data-qso-card-queue]");
  if (queueCardButton) {
    const record = findQsoCardActionRecord(queueCardButton.dataset.qsoCardQueue);
    if (record) {
      const entry = queueQsoCardForRecord(record);
      qrzLogbookStatus.textContent = entry?.call ? `QSO card queued for ${entry.call}` : "QSO card queued";
      logMessage(qrzLogbookStatus.textContent);
      applyQrzRangeFilter();
    }
    return;
  }

  const sentCardButton = event.target.closest("[data-qso-card-sent]");
  if (sentCardButton) {
    const record = findQsoCardActionRecord(sentCardButton.dataset.qsoCardSent);
    if (record) {
      const entry = markQsoCardSentForRecord(record);
      qrzLogbookStatus.textContent = entry?.call ? `QSO card marked sent for ${entry.call}` : "QSO card marked sent";
      logMessage(qrzLogbookStatus.textContent);
      applyQrzRangeFilter();
    }
    return;
  }

  const editButton = event.target.closest("[data-qrz-edit]");
  if (editButton) {
    const record = findQrzRecord(editButton.dataset.qrzEdit, editButton);
    if (record) {
      if (isCbQrzRecord(record)) {
        qrzLogbookStatus.textContent = "CB QRZ writes blocked";
        logMessage("CB/11m contacts stay local-only. QRZ edit is blocked.");
        return;
      }
      openContactLoggerTab(record);
    } else {
      qrzLogbookStatus.textContent = "Edit record not found";
      logMessage(`QRZ edit failed: no loaded record for logid ${editButton.dataset.qrzEdit || "(blank)"}`);
    }
    return;
  }

  const deleteButton = event.target.closest("[data-qrz-delete]");
  if (deleteButton) {
    const record = findQrzRecord(deleteButton.dataset.qrzDelete, deleteButton);
    if (record) {
      if (isCbQrzRecord(record)) {
        qrzLogbookStatus.textContent = "CB QRZ writes blocked";
        logMessage("CB/11m contacts stay local-only. QRZ delete is blocked.");
        return;
      }
      void deleteQrzRecord(record);
    } else {
      qrzLogbookStatus.textContent = "Delete record not found";
      logMessage(`QRZ delete failed: no loaded record for logid ${deleteButton.dataset.qrzDelete || "(blank)"}`);
    }
  }
}

function findQsoCardActionRecord(key) {
  const records = [...qrzRecords, ...qrzAllRecords, ...cbLocalRecords];
  return records.find((record) => (
    qsoCardRecordKey(record) === key
      || qsoCardStatusForRecord(record)?.key === key
  )) ?? null;
}

function findQrzRecord(logid, sourceElement = null) {
  const safeLogid = String(logid ?? "");
  const direct = [...qrzRecords, ...qrzAllRecords].find((record) => String(record.logid ?? "") === safeLogid);
  if (direct) {
    return direct;
  }

  const row = sourceElement?.closest?.("tr");
  const rowLogid = String(row?.dataset?.logid ?? "");
  if (rowLogid && rowLogid !== safeLogid) {
    const rowMatch = [...qrzRecords, ...qrzAllRecords].find((record) => String(record.logid ?? "") === rowLogid);
    if (rowMatch) {
      return rowMatch;
    }
  }

  const rowIndex = Number(row?.dataset?.recordIndex);
  if (Number.isInteger(rowIndex) && rowIndex >= 0 && rowIndex < qrzRecords.length) {
    return qrzRecords[rowIndex];
  }

  return null;
}

async function deleteQrzRecord(record) {
  if (isCbQrzRecord(record)) {
    qrzLogbookStatus.textContent = "CB QRZ writes blocked";
    logMessage("CB/11m contacts stay local-only. QRZ delete is blocked.");
    return;
  }

  const label = `${record.call ?? "this contact"} ${formatAdifDate(record.qso_date)} ${formatAdifTime(record.time_on)}`.trim();
  if (!confirm(`Delete ${label} from QRZ Logbook? QRZ says deleted logbook records cannot be recovered.`)) {
    return;
  }

  qrzLogbookStatus.textContent = "Deleting...";
  try {
    const response = await fetch("/api/qrz/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ logid: record.logid })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "QRZ delete failed");
    }
    qrzLogbookStatus.textContent = "Deleted";
    await loadQrzLogbook();
  } catch (error) {
    qrzLogbookStatus.textContent = "Delete failed";
    logMessage(`QRZ delete failed: ${error.message}`);
  }
}

function setSmartListEnabled() {
  syncScanControls();
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    renderBandIdleScan(bandProfiles[activeBandId]);
    return;
  }

  socket.send(JSON.stringify({
    type: "setSmartList",
    enabled: smartListToggle.checked
  }));
}

function handleScanDwellInput() {
  renderScanDwell(Number(scanDwellSlider.value), lastScanState);
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected || lastScanState?.intent !== "smart") {
    return;
  }

  socket.send(JSON.stringify({
    type: "setScanDwell",
    dwellMs: Number(scanDwellSlider.value)
  }));
}

function handleRegularScanDwellInput() {
  renderRegularScanDwell(Number(regularScanDwellSlider.value));
  renderScanDwell(Number(scanDwellSlider.value), lastScanState);
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected || lastScanState?.intent !== "regular") {
    return;
  }

  socket.send(JSON.stringify({
    type: "setScanDwell",
    dwellMs: Number(regularScanDwellSlider.value)
  }));
}

function stopScan() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stopScan" }));
  }
}

async function runScanBenchmark() {
  const profile = bandProfiles[activeBandId];
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    showView("diagnostics");
    setStatus("Connect CAT before running a speed test", false);
    return;
  }

  if ((profile?.channels?.length ?? 0) === 0) {
    setStatus("Speed test is only available on channelized pages", false);
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before running a speed test", false);
    return;
  }

  if (!audioStream) {
    await startAudioProbe();
  }

  if (!audioStream || !audioAnalyser) {
    setStatus("Start audio before running the speed test", connected);
    return;
  }

  benchmarkRunning = true;
  syncScanControls();
  const results = [];
  renderBenchmarkResults(results, { dwellMs: BENCHMARK_DWELL_VALUES[0], status: "testing" });

  try {
    for (const dwellMs of BENCHMARK_DWELL_VALUES) {
      if (!benchmarkRunning) {
        break;
      }

      scanDwellSlider.value = String(dwellMs);
      renderScanDwell(dwellMs);
      renderBenchmarkResults(results, { dwellMs, status: "testing" });
      socket.send(JSON.stringify({
        type: "startScan",
        thresholdS: 0,
        stepHz: Number(scanStepSelect.value),
        dwellMs,
        bandId: activeBandId,
        intent: "smart",
        scanSource: regularScanSourceSelect.value,
        smartList: smartListToggle.checked,
        readableMode: false,
        useBusy: false,
        audioAssist: true
      }));

      await sleep(Math.max(850, dwellMs * 45 + 500));
      socket.send(JSON.stringify({ type: "stopScan" }));
      await sleep(250);
      results.push(summarizeBenchmarkResult(dwellMs, lastScanState));
      renderBenchmarkResults(results);
    }
  } finally {
    benchmarkRunning = false;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stopScan" }));
    }
    syncScanControls();
  }
}

function summarizeBenchmarkResult(dwellMs, scan) {
  const metrics = scan?.metrics ?? {};
  const audioSamples = metrics.audioSampleCount ?? 0;
  const voiceSamples = metrics.voiceSampleCount ?? 0;
  const voicePercent = audioSamples > 0 ? Math.round((voiceSamples / audioSamples) * 100) : 0;
  return {
    dwellMs,
    targetRate: dwellMs > 0 ? 1000 / dwellMs : 0,
    actualRate: scan?.ratePerSecond ?? 0,
    audioSamples,
    voiceSamples,
    voicePercent,
    late: metrics.lateSampleCount ?? 0,
    missed: metrics.missedSampleCount ?? 0,
    untargeted: metrics.untargetedSampleCount ?? 0
  };
}

function renderBenchmarkResults(results, pending = null) {
  benchmarkResults.hidden = results.length === 0 && !pending;
  if (benchmarkResults.hidden) {
    benchmarkResults.replaceChildren();
    return;
  }

  const rows = [
    ...results.map(formatBenchmarkResult),
    ...(pending ? [`<div class="benchmark-row testing"><span>${pending.dwellMs} ms</span><span>Testing</span><span>--</span><span>--</span><span>--</span></div>`] : [])
  ].join("");
  benchmarkResults.innerHTML = `
    <div class="benchmark-row benchmark-head">
      <span>Dwell</span>
      <span>Actual</span>
      <span>Audio</span>
      <span>Voice</span>
      <span>Drops</span>
    </div>
    ${rows}
  `;
}

function formatBenchmarkResult(result) {
  const actualRate = Number(result.actualRate ?? 0).toFixed(1);
  return `
    <div class="benchmark-row">
      <span>${result.dwellMs} ms</span>
      <span>${actualRate} ch/s</span>
      <span>${result.audioSamples} samples</span>
      <span>${result.voicePercent}% (${result.voiceSamples})</span>
      <span>${result.missed + result.untargeted}</span>
    </div>
  `;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleHitClick(event) {
  const skipButton = event.target.closest("[data-skip-hit-id]");
  if (skipButton && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "skipScanHit",
      id: skipButton.dataset.skipHitId
    }));
    return;
  }

  const tuneButton = event.target.closest("[data-hit-id]");
  if (!tuneButton || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({
    type: "jumpToHit",
    id: tuneButton.dataset.hitId
  }));
}

function clearScanSkips() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "clearScanSkips" }));
  }
}

function handleCockpitFrequencySliderInput() {
  cockpitFrequencyUserEditingUntil = Date.now() + 500;
  if (isCockpitChannelMode()) {
    const channel = findChannel(bandProfiles[activeBandId], Number(cockpitFrequencySlider.value));
    if (channel) {
      previewChannel(channel);
      scheduleChannelTune(channel.number);
    }
    return;
  }

  const hz = getCockpitFrequencySliderHz();
  previewCockpitFrequency(hz, { updateSlider: false });
  scheduleFrequencyTune(hz);
}

function handleCockpitFrequencySliderChange() {
  cockpitFrequencyUserEditingUntil = Date.now() + 250;
  if (isCockpitChannelMode()) {
    const channel = findChannel(bandProfiles[activeBandId], Number(cockpitFrequencySlider.value));
    if (channel) {
      previewChannel(channel);
      sendChannelTune(channel.number, { flush: true, force: true, showDisconnectedStatus: true });
    }
    return;
  }

  const hz = getCockpitFrequencySliderHz();
  previewCockpitFrequency(hz, { updateSlider: false });
  sendFrequencyTune(hz, { flush: true, force: true, showDisconnectedStatus: true });
}

function handleCockpitClarifierInput() {
  const nextOffsetHz = Math.round(Number(cockpitClarifierSlider.value));
  if (!Number.isFinite(nextOffsetHz)) {
    return;
  }

  if (!Number.isInteger(cockpitClarifierBaseHz)) {
    cockpitClarifierBaseHz = Number.isInteger(lastKnownHz) ? lastKnownHz : bandProfiles[activeBandId]?.centerHz ?? null;
  }

  cockpitClarifierOffsetHz = nextOffsetHz;
  renderCockpitClarifier();
  const targetHz = cockpitClarifierTargetHz();
  if (!Number.isInteger(targetHz)) {
    return;
  }

  previewCockpitFrequency(targetHz);
  if (scanActive) {
    setStatus("Stop scan before using clarifier", connected);
    return;
  }
  scheduleCockpitClarifierTune(targetHz);
}

function centerCockpitClarifier() {
  const targetHz = Number.isInteger(cockpitClarifierBaseHz)
    ? cockpitClarifierBaseHz
    : lastKnownHz;
  cockpitClarifierOffsetHz = 0;
  cockpitClarifierSlider.value = "0";
  renderCockpitClarifier();
  if (Number.isInteger(targetHz)) {
    previewCockpitFrequency(targetHz);
    sendCockpitClarifierTune(targetHz, { flush: true, force: true, showDisconnectedStatus: true });
  }
}

function getCockpitFrequencySliderHz() {
  const profile = bandProfiles[activeBandId];
  return snapFrequencyToSliderStep(Number(cockpitFrequencySlider.value), profile);
}

function previewCockpitFrequency(hz, options = {}) {
  const profile = bandProfiles[activeBandId];
  if (!profile?.scanRange) {
    return;
  }

  const safeHz = snapFrequencyToSliderStep(hz, profile);
  lastKnownHz = safeHz;
  cockpitClarifierBaseHz = safeHz - cockpitClarifierOffsetHz;
  frequencyDisplay.textContent = formatFrequencyDisplay(safeHz);
  renderCockpitFrequency(safeHz, options);
  if (channelSliderMode === "frequency") {
    renderSelectedFrequency(safeHz);
  } else {
    const channel = findChannelForHz(profile, safeHz);
    selectedChannelNumber = channel?.number ?? selectedChannelNumber;
    syncChannelButtons();
  }
}

function renderCockpitFrequency(hz, options = {}) {
  const profile = bandProfiles[activeBandId];
  if (!profile?.scanRange) {
    cockpitFrequencyLabel.textContent = "Frequency";
    cockpitFrequencyDisplay.textContent = "--.---.---";
    return;
  }

  if (isCockpitChannelMode(profile)) {
    renderCockpitChannelFrequency(hz, options);
    return;
  }

  const safeHz = snapFrequencyToSliderStep(Number.isInteger(hz) ? hz : profile.centerHz, profile);
  cockpitFrequencyLabel.textContent = "Frequency";
  cockpitFrequencyDisplay.textContent = formatFrequencyDisplay(safeHz);
  if (!isCockpitFrequencySliderEditing() && options.updateSlider !== false) {
    cockpitFrequencySlider.value = String(safeHz);
  }
}

function renderCockpitChannelFrequency(hz, options = {}) {
  const profile = bandProfiles[activeBandId];
  const channels = profile?.channels ?? [];
  const safeHz = Number.isInteger(hz) ? hz : profile?.centerHz;
  const exactChannel = findChannelForHz(profile, safeHz);
  const displayChannel = exactChannel
    ?? findNearestChannel(profile, safeHz)
    ?? findChannel(profile, profile?.defaultChannel)
    ?? channels[0]
    ?? null;

  cockpitFrequencyLabel.textContent = "Channel";
  cockpitFrequencyDisplay.textContent = exactChannel
    ? `${exactChannel.label} ${exactChannel.display}`
    : Number.isInteger(safeHz)
    ? `Manual ${formatFrequencyDisplay(safeHz)}`
    : "--";

  if (displayChannel && !isCockpitFrequencySliderEditing() && options.updateSlider !== false) {
    cockpitFrequencySlider.value = String(displayChannel.number);
  }
}

function isCockpitFrequencySliderEditing() {
  return Date.now() < cockpitFrequencyUserEditingUntil;
}

function isChannelSliderEditing() {
  return Date.now() < channelSliderUserEditingUntil;
}

function configureCockpitFrequencySlider(profile, hz = lastKnownHz) {
  if (!profile?.scanRange) {
    cockpitFrequencySlider.disabled = true;
    cockpitFrequencyLabel.textContent = "Frequency";
    cockpitFrequencyDisplay.textContent = "--.---.---";
    return;
  }

  if (isCockpitChannelMode(profile)) {
    const channels = profile.channels ?? [];
    cockpitFrequencyLabel.textContent = "Channel";
    cockpitFrequencySlider.min = String(channels[0]?.number ?? 1);
    cockpitFrequencySlider.max = String(channels[channels.length - 1]?.number ?? 40);
    cockpitFrequencySlider.step = "1";
    renderCockpitFrequency(Number.isInteger(hz) ? hz : profile.centerHz);
    renderCockpitClarifier();
    return;
  }

  cockpitFrequencySlider.min = String(profile.scanRange.startHz);
  cockpitFrequencySlider.max = String(profile.scanRange.endHz);
  cockpitFrequencySlider.step = String(FREQUENCY_SLIDER_STEP_HZ);
  renderCockpitFrequency(Number.isInteger(hz) ? hz : profile.centerHz);
  renderCockpitClarifier();
}

function renderCockpitClarifier() {
  const sign = cockpitClarifierOffsetHz > 0 ? "+" : "";
  cockpitClarifierDisplay.textContent = `${sign}${cockpitClarifierOffsetHz} Hz`;
  syncCockpitTuningControls();
}

function cockpitClarifierTargetHz() {
  const profile = bandProfiles[activeBandId];
  if (!profile?.scanRange || !Number.isInteger(cockpitClarifierBaseHz)) {
    return null;
  }

  return Math.min(
    profile.scanRange.endHz,
    Math.max(profile.scanRange.startHz, cockpitClarifierBaseHz + cockpitClarifierOffsetHz)
  );
}

function scheduleCockpitClarifierTune(hz) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected || scanActive) {
    return;
  }

  pendingCockpitClarifierHz = hz;
  const waitMs = CHANNEL_TUNE_THROTTLE_MS - (Date.now() - lastCockpitClarifierSentAt);
  if (waitMs <= 0) {
    sendCockpitClarifierTune(pendingCockpitClarifierHz);
    return;
  }

  if (!cockpitClarifierTuneTimer) {
    cockpitClarifierTuneTimer = setTimeout(() => {
      cockpitClarifierTuneTimer = null;
      if (pendingCockpitClarifierHz !== null) {
        sendCockpitClarifierTune(pendingCockpitClarifierHz);
      }
    }, waitMs);
  }
}

function sendCockpitClarifierTune(hz, options = {}) {
  if (options.flush && cockpitClarifierTuneTimer) {
    clearTimeout(cockpitClarifierTuneTimer);
    cockpitClarifierTuneTimer = null;
  }

  pendingCockpitClarifierHz = null;
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
    if (options.showDisconnectedStatus) {
      setStatus("Connect CAT before using clarifier", false);
    }
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before using clarifier", false);
    return;
  }

  const profile = bandProfiles[activeBandId];
  if (!profile?.scanRange) {
    return;
  }

  const targetHz = Math.round(Math.min(profile.scanRange.endHz, Math.max(profile.scanRange.startHz, Number(hz))));
  if (!Number.isInteger(targetHz) || (!options.force && targetHz === lastCockpitClarifierSentHz)) {
    return;
  }

  lastCockpitClarifierSentAt = Date.now();
  lastCockpitClarifierSentHz = targetHz;
  lastFrequencySliderSentHz = targetHz;
  socket.send(JSON.stringify({
    type: "setFrequency",
    bandId: activeBandId,
    hz: targetHz
  }));
}

function handleChannelClick(event) {
  const edit = event.target.closest("[data-favorite-edit-number]");
  if (edit) {
    event.preventDefault();
    event.stopPropagation();
    editFavoriteChannel(Number(edit.dataset.favoriteEditNumber));
    return;
  }

  const button = event.target.closest("[data-channel-number]");
  if (!button) {
    return;
  }

  setChannelSliderMode("presets");
  const channelNumber = Number(button.dataset.channelNumber);
  const channel = findChannel(bandProfiles[activeBandId], channelNumber);
  if (!channel) {
    return;
  }

  previewChannel(channel);
  sendChannelTune(channelNumber, { flush: true, force: true, showDisconnectedStatus: true });
}

function editFavoriteChannel(channelNumber) {
  const profile = bandProfiles[activeBandId];
  if (!isEditableFavoritesBand(profile)) {
    return;
  }

  const channel = findChannel(profile, channelNumber);
  if (!channel) {
    return;
  }

  const favoriteName = prompt("Favorite name", channel.nickname ?? "");
  if (favoriteName === null) {
    return;
  }

  const frequencyText = prompt("Favorite frequency in MHz", hzToMhz(channel.hz));
  if (frequencyText === null) {
    return;
  }

  const hz = Math.round(Number(frequencyText) * 1_000_000);
  if (!Number.isInteger(hz) || hz < profile.scanRange.startHz || hz > profile.scanRange.endHz) {
    setStatus(`Favorite must stay inside ${profile.scanLabel}`, connected);
    return;
  }

  const overrides = loadFavoriteOverrides();
  const current = favoriteChannelsForProfile(profile);
  overrides[activeBandId] = current.map((candidate) => {
    if (candidate.number !== channelNumber) {
      return candidate;
    }

    return {
      number: channelNumber,
      hz,
      nickname: favoriteName.trim()
    };
  });
  saveFavoriteOverrides(overrides);
  bandProfiles = applyFavoriteOverrides(baseBandProfiles);
  const nextProfile = bandProfiles[activeBandId];
  renderChannelPanel(nextProfile, channelNumber);
  configureCockpitFrequencySlider(nextProfile, hz);
  syncScanSourceOptions();
  setStatus(`${nextProfile.name} favorite ${String(channelNumber).padStart(2, "0")} saved`, connected);
}

function handleChannelSliderInput() {
  channelSliderUserEditingUntil = Date.now() + 500;
  if (channelSliderMode === "frequency") {
    const hz = getFrequencySliderHz();
    previewFrequencySlider(hz);
    scheduleFrequencyTune(hz);
    return;
  }

  const channel = findChannel(bandProfiles[activeBandId], Number(channelSlider.value));
  if (!channel) {
    return;
  }

  previewChannel(channel);
  scheduleChannelTune(channel.number);
}

function handleChannelSliderChange() {
  channelSliderUserEditingUntil = Date.now() + 250;
  if (channelSliderMode === "frequency") {
    const hz = getFrequencySliderHz();
    previewFrequencySlider(hz);
    sendFrequencyTune(hz, { flush: true, force: true, showDisconnectedStatus: true });
    return;
  }

  const channel = findChannel(bandProfiles[activeBandId], Number(channelSlider.value));
  if (!channel) {
    return;
  }

  previewChannel(channel);
  sendChannelTune(channel.number, { flush: true, force: true, showDisconnectedStatus: true });
}

function previewChannel(channel) {
  lastKnownHz = channel.hz;
  cockpitClarifierBaseHz = channel.hz - cockpitClarifierOffsetHz;
  renderSelectedChannel(channel);
  renderCockpitFrequency(channel.hz);
  frequencyDisplay.textContent = channel.display;
}

function setChannelSliderMode(mode, options = {}) {
  const profile = bandProfiles[activeBandId];
  const nextMode = mode === "frequency" ? "frequency" : "presets";
  channelSliderMode = isChannelSliderModeAvailable(profile) ? nextMode : "frequency";
  renderSliderModeButtons();

  if (options.render === false || !profile) {
    return;
  }

  configureChannelSlider(profile);
  configureCockpitFrequencySlider(profile, lastKnownHz);
  syncChannelButtons();
}

function renderSliderModeButtons() {
  const profile = bandProfiles[activeBandId];
  const modeAvailable = isChannelSliderModeAvailable(profile);
  const groups = new Set(Array.from(channelSliderModeButtons).map((button) => button.closest(".slider-mode-buttons")));
  groups.forEach((group) => {
    if (group) {
      group.hidden = !modeAvailable;
    }
  });

  channelSliderModeButtons.forEach((button) => {
    const mode = button.dataset.sliderMode;
    button.classList.toggle("active", mode === channelSliderMode);
    button.disabled = !radioPowered || scanActive || !modeAvailable;
  });
}

function scheduleChannelTune(channelNumber) {
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected || scanActive) {
    return;
  }

  pendingChannelNumber = channelNumber;
  const waitMs = CHANNEL_TUNE_THROTTLE_MS - (Date.now() - lastChannelSentAt);
  if (waitMs <= 0) {
    sendChannelTune(pendingChannelNumber);
    return;
  }

  if (!channelTuneTimer) {
    channelTuneTimer = setTimeout(() => {
      channelTuneTimer = null;
      if (pendingChannelNumber !== null) {
        sendChannelTune(pendingChannelNumber);
      }
    }, waitMs);
  }
}

function sendChannelTune(channelNumber, options = {}) {
  if (options.flush && channelTuneTimer) {
    clearTimeout(channelTuneTimer);
    channelTuneTimer = null;
  }

  pendingChannelNumber = null;
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    if (options.showDisconnectedStatus) {
      setStatus("Connect CAT before tuning a channel", false);
    }
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before moving channels manually", false);
    return;
  }

  if (!Number.isFinite(channelNumber) || (!options.force && channelNumber === lastChannelSentNumber)) {
    return;
  }

  const channel = findChannel(bandProfiles[activeBandId], channelNumber);
  if (isEditableFavoritesBand(bandProfiles[activeBandId]) && channel) {
    sendFrequencyTune(channel.hz, { flush: true, force: true, showDisconnectedStatus: options.showDisconnectedStatus });
    lastChannelSentAt = Date.now();
    lastChannelSentNumber = channelNumber;
    return;
  }

  lastChannelSentAt = Date.now();
  lastChannelSentNumber = channelNumber;
  socket.send(JSON.stringify({
    type: "setChannel",
    bandId: activeBandId,
    channelNumber
  }));
}

function getFrequencySliderHz() {
  const profile = bandProfiles[activeBandId];
  return snapFrequencyToSliderStep(Number(channelSlider.value), profile);
}

function previewFrequencySlider(hz) {
  const profile = bandProfiles[activeBandId];
  const safeHz = snapFrequencyToSliderStep(hz, profile);
  lastKnownHz = safeHz;
  cockpitClarifierBaseHz = safeHz - cockpitClarifierOffsetHz;
  frequencyDisplay.textContent = formatFrequencyDisplay(safeHz);
  renderCockpitFrequency(safeHz);
  channelPresetDisplay.textContent = formatFrequencyDisplay(safeHz);
  channelSliderDisplay.textContent = formatFrequencyDisplay(safeHz);
  channelModeDisplay.textContent = "10 Hz";
  selectedChannelNumber = findChannelForHz(profile, safeHz)?.number ?? null;
  if (document.activeElement !== channelSlider) {
    channelSlider.value = String(safeHz);
  }
  syncChannelButtons();
}

function scheduleFrequencyTune(hz) {
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected || scanActive) {
    return;
  }

  pendingFrequencySliderHz = hz;
  const waitMs = CHANNEL_TUNE_THROTTLE_MS - (Date.now() - lastFrequencySliderSentAt);
  if (waitMs <= 0) {
    sendFrequencyTune(pendingFrequencySliderHz);
    return;
  }

  if (!frequencySliderTimer) {
    frequencySliderTimer = setTimeout(() => {
      frequencySliderTimer = null;
      if (pendingFrequencySliderHz !== null) {
        sendFrequencyTune(pendingFrequencySliderHz);
      }
    }, waitMs);
  }
}

function sendFrequencyTune(hz, options = {}) {
  if (options.flush && frequencySliderTimer) {
    clearTimeout(frequencySliderTimer);
    frequencySliderTimer = null;
  }

  pendingFrequencySliderHz = null;
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    if (options.showDisconnectedStatus) {
      setStatus("Connect CAT before tuning a frequency", false);
    }
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before moving frequency manually", false);
    return;
  }

  const safeHz = snapFrequencyToSliderStep(hz, bandProfiles[activeBandId]);
  if (!Number.isFinite(safeHz) || (!options.force && safeHz === lastFrequencySliderSentHz)) {
    return;
  }

  lastFrequencySliderSentAt = Date.now();
  lastFrequencySliderSentHz = safeHz;
  socket.send(JSON.stringify({
    type: "setFrequency",
    bandId: activeBandId,
    hz: safeHz
  }));
}

function handleKeyDown(event) {
  if (isPttKey(event)) {
    event.preventDefault();
    event.stopPropagation();
    handlePttKeyDown(event);
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

function isPttKey(event) {
  return event.code === "Backquote" || event.key === "`";
}

function handlePttKeyDown(event) {
  if (event.repeat || pttKeyDown) {
    return;
  }

  if (!radioPowered) {
    setStatus("Radio deck is powered down", false);
    return;
  }

  if (!pttArmToggle.checked) {
    setStatus("PTT is disarmed", connected);
    return;
  }

  if (!connected || !socket || socket.readyState !== WebSocket.OPEN) {
    showView("diagnostics");
    setStatus("Connect CAT before PTT", false);
    return;
  }

  if (scanActive) {
    setStatus("Stop scan before PTT", connected);
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

function handlePttArmChange() {
  if (!pttArmToggle.checked) {
    releasePtt("disarmed");
  }
  renderPtt({ active: pttActive, timeoutMs: PTT_TIMEOUT_MS });
}

function armLocalPttTimeout() {
  clearPttTimeout();
  pttTimeoutTimer = setTimeout(() => {
    pttTimeoutTimer = null;
    releasePtt("timeout");
    setStatus("PTT timeout released after 2 minutes", connected);
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
  if (!pttActive && reason !== "unload" && reason !== "disconnect" && reason !== "scan") {
    renderPtt({ active: false, timeoutMs: PTT_TIMEOUT_MS, reason });
    return;
  }

  sendPtt(false, reason);
}

function sendPtt(transmitting, reason = "") {
  const active = transmitting === true;
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    renderPtt({ active: false, timeoutMs: PTT_TIMEOUT_MS, reason });
    return;
  }

  socket.send(JSON.stringify({
    type: "setPtt",
    transmitting: active
  }));
  renderPtt({ active, timeoutMs: PTT_TIMEOUT_MS, reason });
}

function renderPtt(ptt = {}) {
  pttActive = Boolean(ptt?.active);
  const statusNode = pttStatusDisplay.closest(".ptt-status");
  const disarmed = !pttArmToggle.checked;
  pttStatusDisplay.textContent = pttActive ? "TX" : disarmed ? "Disarmed" : "Ready";
  statusNode?.classList.toggle("transmitting", pttActive);
  document.body.classList.toggle("ptt-transmitting", pttActive);
}

function handleTuneKeyDown(event) {
  if (!radioPowered || !connected || scanActive || !tuneKeysToggle.checked || isFormField(document.activeElement)) {
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

function isFormField(element) {
  return ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element?.tagName);
}

function handleTabClick(button) {
  if (button.dataset.view === "logger" && !button.dataset.band) {
    openContactLoggerTab();
    return;
  }

  if (button.dataset.band) {
    selectRunBand(button.dataset.band);
    return;
  }

  if (button.dataset.view === "pota") {
    syncPotaFrameContext();
  }

  showView(button.dataset.view);
}

function renderPhoneBandOptions() {
  const profiles = Object.values(bandProfiles)
    .filter((profile) => profile.id !== "cb")
    .sort((a, b) => a.scanRange.startHz - b.scanRange.startHz);
  const options = profiles.map((profile) => new Option(
    profile.id === "10m" ? "10 Meter (Technician)" : profile.name,
    profile.id
  ));
  const memoryOnly = new Option("60 Meter (rig memories)", "");
  memoryOnly.disabled = true;
  if (profiles.some((profile) => profile.id === "40m")) {
    options.splice(profiles.findIndex((profile) => profile.id === "40m"), 0, memoryOnly);
  }
  phoneBandSelect.replaceChildren(...options);
  phoneBandSelect.disabled = options.length === 0;
}

function selectRunBand(bandId) {
  const profile = bandProfiles[bandId];
  if (!profile) return;
  if (bandId !== activeBandId) {
    if (pttActive || benchmarkRunning) {
      phoneBandSelect.value = activeBandId;
      setStatus(pttActive ? "Release PTT before changing bands" : "Wait for the speed test to finish", connected);
      return;
    }
    clearTimeout(channelTuneTimer);
    clearTimeout(frequencySliderTimer);
    clearTimeout(cockpitClarifierTuneTimer);
    channelTuneTimer = frequencySliderTimer = cockpitClarifierTuneTimer = null;
    pendingChannelNumber = pendingFrequencySliderHz = pendingCockpitClarifierHz = null;
    lastChannelSentNumber = lastFrequencySliderSentHz = lastCockpitClarifierSentHz = null;
    clearAtuTuneArm();
    setActiveBand(bandId);
    if (radioPowered && connected) {
      setStatus(`Applying ${profile.name} preset and auto ATU`, true);
      void ensureDefaultAudioMonitor();
      sendBandPreset(bandId, { autoTune: true });
    }
  }
  showView("run");
}

function setActiveBand(bandId, options = {}) {
  const profile = bandProfiles[bandId];
  if (!profile) {
    return;
  }

  activeBandId = bandId;
  const isCb = bandId === "cb";
  if (bandId !== "6m" && !isCb) hfBandTab.dataset.band = bandId;
  phoneBandControl.hidden = isCb;
  bandNameDisplay.hidden = !isCb;
  phoneBandRange.hidden = isCb;
  if (!isCb) {
    phoneBandSelect.value = bandId;
    phoneBandRange.textContent = formatPhoneRange(profile.scanRange);
  }
  renderPotaBandStatus(contactContextFromState());
  if (potaFrame?.dataset.loaded === "1") {
    syncPotaFrameContext(stagePotaContext());
  }
  bandNameDisplay.textContent = profile.name;
  bandPresetDisplay.textContent = formatPresetSummary(profile);
  scanRangeDisplay.textContent = formatScanRangeSummary(profile);
  applyPresetButton.textContent = formatApplyLabel(profile);
  if (!options.preserveLiveReadout) {
    lastKnownHz = profile.centerHz;
    selectedChannelNumber = profile.defaultChannel ?? null;
    channelSliderMode = isChannelSliderModeAvailable(profile) && profile.defaultScanSource === "presets"
      ? "presets"
      : "frequency";
    cockpitClarifierOffsetHz = 0;
    cockpitClarifierSlider.value = "0";
    cockpitClarifierBaseHz = profile.centerHz;
  }
  renderChannelPanel(profile, selectedChannelNumber);
  configureCockpitFrequencySlider(profile, lastKnownHz);
  scanStepSelect.disabled = profile.scanMode === "channels";
  readableScanToggle.disabled = profile.scanMode !== "channels";
  busyAssistToggle.disabled = profile.scanMode !== "channels" || !readableScanToggle.checked;
  regularScanSourceSelect.value = profile.defaultScanSource ?? "frequency";
  renderScanDwell(Number(scanDwellSlider.value));
  renderRegularScanDwell(Number(regularScanDwellSlider.value));
  renderBandIdleScan(profile);

  if (!options.preserveLiveReadout) {
    frequencyDisplay.textContent = profile.centerDisplay;
    modeDisplay.textContent = profile.defaultMode ?? "--";
    renderModeButtons(profile.defaultMode);
    rfGainDisplay.textContent = `${profile.defaultRfGainPercent}%`;
    rfGainSlider.value = String(profile.defaultRfGain);
    if (channelSliderMode === "frequency") {
      renderSelectedFrequency(lastKnownHz);
    } else {
      renderSelectedChannel(findChannel(profile, selectedChannelNumber));
    }
  }

  syncChannelButtons();
  syncScanSourceOptions();
  syncScanControls();
  syncTabs();
  renderBandLogbook();
  void loadBandPotaSpots({ force: true, showLoading: true });
}

function renderBandIdleScan(profile) {
  renderScan({
    active: false,
    bandId: profile.id,
    status: "idle",
    range: profile.scanRange,
    scanMode: profile.scanMode,
    channels: profile.channels ?? [],
    skippedChannelNumbers: [],
    scanSource: profile.defaultScanSource ?? "frequency",
    smartList: smartListToggle.checked,
    direction: 1,
    dwellMs: Number(scanDwellSlider.value),
    ratePerSecond: 0,
    metrics: {},
    hits: []
  });
}

function renderDiagnosticsSnapshot(options = {}) {
  if (!options.force && diagnosticsFreezeToggle.checked) {
    return;
  }

  const now = Date.now();
  if (!options.force && now - lastDiagnosticsRenderAt < DIAGNOSTICS_REFRESH_MS) {
    return;
  }
  lastDiagnosticsRenderAt = now;

  const snapshot = buildDiagnosticsSnapshot(now);
  diagnosticsConnectionSummary.textContent = `${snapshot.connection.catStatus} / ${snapshot.connection.socket}`;
  diagnosticsFrequencySummary.textContent = snapshot.radio.frequency;
  diagnosticsScanSummary.textContent = snapshot.scan.summary;
  diagnosticsAudioSummary.textContent = snapshot.audio.summary;
  diagnosticsSnapshotTime.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(now));

  renderKeyValueGrid(diagnosticsLinkGrid, [
    ["Socket", snapshot.connection.socket],
    ["CAT status", snapshot.connection.catStatus],
    ["Port", snapshot.connection.port],
    ["Baud", snapshot.connection.baud],
    ["Poll target", snapshot.connection.poll],
    ["RTS / stop", `${snapshot.connection.rts} / ${snapshot.connection.stopBits}`]
  ]);

  renderKeyValueGrid(diagnosticsRadioGrid, [
    ["Model", snapshot.radio.model],
    ["Band page", snapshot.radio.band],
    ["VFO-A", snapshot.radio.frequency],
    ["Raw Hz", snapshot.radio.hz],
    ["Mode", snapshot.radio.mode],
    ["RF Gain", snapshot.radio.rfGain],
    ["Radio MONI", snapshot.radio.radioMonitor],
    ["MIC gain", snapshot.radio.micGain],
    ["Processor", snapshot.radio.processor],
    ["Parametric EQ", snapshot.radio.parametricEq],
    ["PTT", snapshot.radio.ptt],
    ["Last command", snapshot.radio.lastCommand],
    ["Last RX frame", snapshot.radio.raw],
    ["RX frames", snapshot.radio.rxCount],
    ["Radio age", snapshot.radio.age]
  ]);

  renderKeyValueGrid(diagnosticsScanGrid, [
    ["Status", snapshot.scan.summary],
    ["Intent", snapshot.scan.intent],
    ["Source", snapshot.scan.source],
    ["Mode", snapshot.scan.mode],
    ["Step", snapshot.scan.step],
    ["Dwell", snapshot.scan.dwell],
    ["Rate", snapshot.scan.rate],
    ["Current", snapshot.scan.current],
    ["Samples", snapshot.scan.samples],
    ["Voice samples", snapshot.scan.voice],
    ["Missed/late", snapshot.scan.missedLate],
    ["Top hits", snapshot.scan.hits]
  ]);

  renderKeyValueGrid(diagnosticsAudioGrid, [
    ["Status", snapshot.audio.status],
    ["Input", snapshot.audio.input],
    ["Browser listen", snapshot.audio.browserListen],
    ["Level", snapshot.audio.level],
    ["dBFS", snapshot.audio.dbfs],
    ["Clip", snapshot.audio.clip],
    ["Voice score", snapshot.audio.voiceScore],
    ["Modulation", snapshot.audio.modulation],
    ["Peak / centroid", snapshot.audio.peakCentroid],
    ["Age", snapshot.audio.age]
  ]);

  renderKeyValueGrid(diagnosticsSafetyGrid, [
    ["Tune keys", snapshot.safety.tuneKeys],
    ["PTT armed", snapshot.safety.pttArmed],
    ["PTT timeout", snapshot.safety.pttTimeout],
    ["ATU band", snapshot.safety.atuBand],
    ["CB QRZ", snapshot.safety.cbQrz],
    ["QRZ loaded", snapshot.safety.qrzLoaded],
    ["Local CB records", snapshot.safety.cbLocalCount]
  ]);

  renderKeyValueGrid(diagnosticsStorageGrid, [
    ["Active view", snapshot.storage.view],
    ["URL hash", snapshot.storage.hash],
    ["Audio inputs", snapshot.storage.audioInputs],
    ["POTA context", snapshot.storage.potaContext],
    ["Logger draft", snapshot.storage.loggerDraft],
    ["QRZ all records", snapshot.storage.qrzAll],
    ["QRZ filtered", snapshot.storage.qrzFiltered],
    ["CB local bytes", snapshot.storage.cbBytes]
  ]);

  diagnosticsHunterDump.textContent = snapshot.hunter
    ? JSON.stringify(snapshot.hunter, null, 2)
    : "No hunter state yet.";
}

function buildDiagnosticsSnapshot(now = Date.now()) {
  const state = latestCatState ?? {};
  const scan = state.scan ?? lastScanState ?? {};
  const metrics = scan.metrics ?? {};
  const audio = latestAudioSnapshot;
  const rawHunter = scan.hunter ?? null;
  const hunter = compactHunterDiagnostics(rawHunter, now);
  const txAudio = state.txAudio ?? {};
  const catUpdatedAt = state.updatedAt ? new Date(state.updatedAt).getTime() : null;
  const audioUpdatedAt = audio?.updatedAt ?? null;
  const scanCurrentHz = scan.currentHz ?? rawHunter?.currentHz ?? rawHunter?.bestHz ?? null;
  const activeProfile = bandProfiles[activeBandId] ?? {};

  return {
    connection: {
      socket: websocketStateLabel(),
      catStatus: state.status ?? statusText.textContent ?? "disconnected",
      port: state.path ?? portSelect.value ?? "--",
      baud: `${state.baudRate ?? baudSelect.value ?? "--"} bps`,
      poll: `${state.pollMs ?? pollSelect.value ?? "--"} ms`,
      rts: state.rtsHigh === false ? "low" : rtsSelect.value,
      stopBits: `${state.stopBits ?? stopBitsSelect.value ?? "--"} bit${String(state.stopBits ?? stopBitsSelect.value) === "1" ? "" : "s"}`
    },
    radio: {
      model: state.modelId === "0462" ? "FTdx3000" : state.modelId ?? "--",
      band: activeProfile.name ?? activeBandId,
      frequency: state.frequency ?? (Number.isInteger(lastKnownHz) ? formatFrequencyDisplay(lastKnownHz) : "--"),
      hz: Number.isInteger(state.hz) ? `${state.hz} Hz` : "--",
      mode: state.mode ?? "--",
      rfGain: state.rfGain ? `${state.rfGain.percent}% (${state.rfGain.value}/255)` : "--",
      radioMonitor: formatRadioMonitor(txAudio.monitor),
      micGain: Number.isFinite(txAudio.micGain?.value) ? `${txAudio.micGain.value}%` : "--",
      processor: formatProcessor(txAudio.processor),
      parametricEq: typeof txAudio.parametricEq?.enabled === "boolean" ? (txAudio.parametricEq.enabled ? "on" : "off") : "--",
      ptt: state.ptt?.active ? "TX" : "RX",
      lastCommand: state.lastCommand ?? "--",
      raw: state.raw ?? "--",
      rxCount: String(state.rxCount ?? 0),
      age: catUpdatedAt ? formatAge(now - catUpdatedAt) : "--"
    },
    scan: {
      summary: scan.active ? scan.status ?? "active" : scan.status ?? "idle",
      intent: scan.intent ?? "--",
      source: scan.scanSource ?? "--",
      mode: scan.scanMode ?? "--",
      step: Number.isFinite(scan.stepHz) ? `${scan.stepHz} Hz` : "--",
      dwell: Number.isFinite(scan.dwellMs) ? `${scan.dwellMs} ms` : "--",
      rate: Number.isFinite(scan.ratePerSecond) ? `${scan.ratePerSecond.toFixed(1)}/s` : "--",
      current: Number.isInteger(scanCurrentHz) ? formatFrequencyDisplay(scanCurrentHz) : "--",
      samples: `${metrics.validSampleCount ?? 0}/${metrics.meterRequestCount ?? 0} CAT`,
      voice: `${metrics.voiceSampleCount ?? 0}/${metrics.audioSampleCount ?? 0}`,
      missedLate: `${metrics.missedSampleCount ?? 0}/${metrics.lateSampleCount ?? 0}`,
      hits: String((scan.hits ?? []).length),
      hunter
    },
    audio: {
      summary: audioStream ? `${Math.round(audio?.audioMetrics?.percent ?? 0)}% RX` : "Idle",
      status: audioStatusText.textContent ?? "Idle",
      input: audio?.input ?? audioInputSelect.selectedOptions[0]?.textContent ?? "--",
      browserListen: `${audioMonitorToggle.checked ? "on" : "off"} @ ${audioMonitorVolumeSlider.value}%`,
      level: audio ? `${Math.round(audio.audioMetrics.percent)}%` : "--",
      dbfs: audio ? formatDbfs(audio.audioMetrics.dbfs) : "--",
      clip: audio ? `${audio.audioMetrics.clipPercent}%` : "--",
      voiceScore: audio ? String(audio.voiceMetrics.voiceScore) : "--",
      modulation: audio ? `${audio.voiceMetrics.levelSpan} span / ${audio.voiceMetrics.averageLevelDelta} avg` : "--",
      peakCentroid: audio ? `${formatAudioFrequency(audio.spectrumStats.peakHz)} / ${formatAudioFrequency(audio.spectrumStats.centroidHz)}` : "--",
      age: audioUpdatedAt ? formatAge(now - audioUpdatedAt) : "--"
    },
    safety: {
      tuneKeys: tuneKeysToggle.checked ? "on" : "off",
      pttArmed: pttArmToggle.checked ? "armed" : "disarmed",
      pttTimeout: `${PTT_TIMEOUT_MS / 1000}s`,
      atuBand: isAtuBand(activeBandId) ? "yes" : "no",
      cbQrz: "blocked; local-only",
      qrzLoaded: qrzLoadedOnce ? "yes" : "no",
      cbLocalCount: String(cbLocalRecords.length)
    },
    storage: {
      view: currentViewName(),
      hash: location.hash || "#run",
      audioInputs: String(macAudioInputs.length),
      potaContext: localStorage.getItem("yeasuCatPotaContext") ? "stored" : "empty",
      loggerDraft: localStorage.getItem("yeasuCatContactDraft") ? "stored" : "empty",
      qrzAll: String(qrzAllRecords.length),
      qrzFiltered: String(qrzRecords.length),
      cbBytes: String((localStorage.getItem(CB_LOCAL_LOG_STORAGE_KEY) ?? "").length)
    },
    hunter
  };
}

function compactHunterDiagnostics(hunter, now = Date.now()) {
  if (!hunter) {
    return null;
  }

  const sweep = hunter.sweep ?? {};
  const points = Array.isArray(sweep.points) ? sweep.points : [];
  const strongestPoint = points.reduce((best, point) => (
    hunterDiagnosticPointWeight(point) > hunterDiagnosticPointWeight(best) ? point : best
  ), null);
  const fastCandidates = Array.isArray(hunter.fastCandidates) ? hunter.fastCandidates : [];

  return {
    phase: hunter.phase ?? "--",
    decision: hunter.decision ?? hunter.reason ?? "--",
    current: formatDiagnosticHz(hunter.currentHz),
    best: formatDiagnosticHz(hunter.bestHz),
    stepHz: hunter.stepHz ?? null,
    dwellMs: hunter.dwellMs ?? null,
    passId: hunter.passId ?? null,
    direction: hunter.direction ?? null,
    scores: {
      current: roundDiagnosticNumber(hunter.currentScore),
      best: roundDiagnosticNumber(hunter.bestScore),
      audioStrength: roundDiagnosticNumber(hunter.audioStrength),
      signalLift: roundDiagnosticNumber(hunter.signalLiftPercent),
      modulation: roundDiagnosticNumber(hunter.modulationScore),
      voiceLike: roundDiagnosticNumber(hunter.voiceLikeScore),
      spectralVoice: roundDiagnosticNumber(hunter.spectralVoiceScore),
      texture: roundDiagnosticNumber(hunter.voiceTextureScore)
    },
    gates: {
      rxLift: roundDiagnosticNumber(hunter.audioLiftGatePercent),
      rxThreshold: roundDiagnosticNumber(hunter.audioThresholdPercent),
      autoRf: hunter.autoRfGainEnabled === true ? "on" : "off",
      autoRfTargetLift: roundDiagnosticNumber(hunter.rfGainTargetLiftPercent),
      toneRejected: hunter.toneRejected === true,
      broadbandRejected: hunter.broadbandRejected === true
    },
    timing: {
      lockHold: Number.isInteger(hunter.lockUntil) ? formatAge(hunter.lockUntil - now) : "--",
      lastHeardAge: Number.isInteger(hunter.lastHeardAt) ? formatAge(now - hunter.lastHeardAt) : "--",
      sampleCount: hunter.sampleCount ?? 0
    },
    sweep: {
      points: points.length,
      compacted: sweep.compacted === true,
      rawPointCount: sweep.rawPointCount ?? points.length,
      broadcastMaxPoints: sweep.broadcastMaxPoints ?? null,
      rollingPasses: sweep.rollingPasses ?? null,
      oldestPassId: sweep.oldestPassId ?? null,
      newestPassId: sweep.newestPassId ?? null,
      maxLevel: roundDiagnosticNumber(sweep.maxLevelPercent),
      strongest: compactHunterPoint(strongestPoint),
      passAge: Number.isInteger(sweep.passStartedAt) ? formatAge(now - sweep.passStartedAt) : "--"
    },
    envelope: compactHunterEnvelope(hunter.envelope),
    fastCandidates: {
      count: fastCandidates.length,
      top: fastCandidates
        .slice()
        .sort((a, b) => hunterDiagnosticPointWeight(b) - hunterDiagnosticPointWeight(a))
        .slice(0, 6)
        .map((candidate) => ({
          bucket: formatDiagnosticHz(candidate.bucketHz),
          best: formatDiagnosticHz(candidate.bestHz),
          passes: Array.isArray(candidate.passIds) ? candidate.passIds.length : 0,
          score: roundDiagnosticNumber(candidate.bestScore ?? candidate.score),
          lastSeenPass: candidate.lastSeenPass ?? null
        }))
    },
    skipped: (hunter.skippedHz ?? []).slice(-12).map(formatDiagnosticHz)
  };
}

function compactHunterEnvelope(envelope) {
  if (!envelope) {
    return null;
  }

  return {
    stage: envelope.stage ?? "--",
    suspect: formatDiagnosticHz(envelope.suspectHz),
    firstHeard: formatDiagnosticHz(envelope.firstHeardHz ?? envelope.lowEdgeHz),
    lastHeard: formatDiagnosticHz(envelope.lastHeardHz ?? envelope.highEdgeHz),
    peak: formatDiagnosticHz(envelope.bestHz),
    next: formatDiagnosticHz(envelope.nextHz),
    range: Number.isInteger(envelope.surveyStartHz) && Number.isInteger(envelope.surveyEndHz)
      ? `${formatDiagnosticHz(envelope.surveyStartHz)} - ${formatDiagnosticHz(envelope.surveyEndHz)}`
      : "--",
    stepHz: envelope.stepHz ?? null,
    heardPoints: envelope.heardPoints ?? 0,
    missesAfterHeard: envelope.missesAfterHeard ?? 0
  };
}

function compactHunterPoint(point) {
  if (!point) {
    return null;
  }

  return {
    frequency: formatDiagnosticHz(point.hz ?? point.bestHz ?? point.bucketHz),
    passId: point.passId ?? point.lastSeenPass ?? null,
    level: roundDiagnosticNumber(point.levelPercent ?? point.signalLiftPercent),
    lift: roundDiagnosticNumber(point.signalLiftPercent),
    score: roundDiagnosticNumber(point.score ?? point.bestScore),
    voiceLike: roundDiagnosticNumber(point.voiceLikeScore),
    spectralVoice: roundDiagnosticNumber(point.spectralVoiceScore),
    texture: roundDiagnosticNumber(point.voiceTextureScore),
    modulation: roundDiagnosticNumber(point.modulationScore),
    accepted: point.accepted === true,
    fastCandidate: point.fastCandidate === true,
    rejected: point.toneRejected === true || point.broadbandRejected === true
  };
}

function hunterDiagnosticPointWeight(point) {
  if (!point) {
    return -Infinity;
  }

  const level = Number(point.levelPercent ?? point.signalLiftPercent ?? 0);
  const score = Number(point.score ?? point.bestScore ?? 0);
  const quality = Math.max(
    Number(point.voiceLikeScore ?? 0),
    Number(point.spectralVoiceScore ?? 0),
    Number(point.voiceTextureScore ?? 0),
    Number(point.modulationScore ?? 0)
  );
  const acceptedBonus = point.accepted ? 100 : 0;
  const candidateBonus = point.fastCandidate ? 45 : 0;
  const rejectPenalty = point.toneRejected || point.broadbandRejected ? 60 : 0;
  return level + score + quality + acceptedBonus + candidateBonus - rejectPenalty;
}

function formatDiagnosticHz(hz) {
  return Number.isInteger(hz) ? formatFrequencyDisplay(hz) : "--";
}

function roundDiagnosticNumber(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 10) / 10 : null;
}

function renderKeyValueGrid(container, rows) {
  if (!container) {
    return;
  }

  container.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = "nerd-kv";
    const key = document.createElement("span");
    key.textContent = label;
    const val = document.createElement("strong");
    val.textContent = value ?? "--";
    row.append(key, val);
    return row;
  }));
}

async function copyDiagnosticsSnapshot() {
  const snapshot = buildDiagnosticsSnapshot();
  try {
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    logMessage("Diagnostics snapshot copied");
  } catch (error) {
    logMessage(`Diagnostics copy failed: ${error.message}`);
  }
}

function websocketStateLabel() {
  if (!socket) {
    return "not opened";
  }
  if (socket.readyState === WebSocket.CONNECTING) return "connecting";
  if (socket.readyState === WebSocket.OPEN) return "open";
  if (socket.readyState === WebSocket.CLOSING) return "closing";
  return "closed";
}

function formatAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return "--";
  }
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  if (ms < 60_000) {
    return `${Math.round(ms / 1000)} sec`;
  }
  return `${Math.round(ms / 60_000)} min`;
}

function renderState(state) {
  latestCatState = state;
  const isInitialCatState = !receivedInitialCatState;
  receivedInitialCatState = true;
  const wasConnected = connected;
  connected = state.status === "connected";
  if (!connected) {
    lastChannelSentNumber = null;
    lastFrequencySliderSentHz = null;
    lastCockpitClarifierSentHz = null;
  }
  setStatus(state.status, connected);
  tuneKeysToggle.checked = true;
  renderPtt(state.ptt);

  if (connected && !wasConnected && !isInitialCatState) {
    void ensureDefaultAudioMonitor();
  }

  if (state.frequency) {
    frequencyDisplay.textContent = state.frequency;
  }
  if (Number.isInteger(state.hz)) {
    lastKnownHz = state.hz;
    if (cockpitClarifierOffsetHz === 0 || document.activeElement !== cockpitClarifierSlider) {
      cockpitClarifierBaseHz = state.hz - cockpitClarifierOffsetHz;
    }
    renderCockpitFrequency(state.hz);
  }

  modeDisplay.textContent = state.mode ?? "--";
  renderModeButtons(state.mode);
  modelDisplay.textContent = state.modelId === "0462" ? "FTdx3000" : state.modelId ?? "--";
  lastCommandDisplay.textContent = state.lastCommand ?? "--";
  if (typeof state.radioPowerSwitch?.on === "boolean") {
    lastRigPowerOn = state.radioPowerSwitch.on;
  }
  syncRigPowerButton(state.radioPowerSwitch);
  renderMeter(state.meter);
  renderAuxMeter(state.powerMeter, {
    rawDisplay: powerMeterRawDisplay,
    percentDisplay: powerMeterPercentDisplay,
    fill: powerMeterFill,
    needle: powerMeterNeedle,
    label: "PO"
  });
  renderAuxMeter(state.swrMeter, {
    rawDisplay: swrMeterRawDisplay,
    percentDisplay: swrMeterPercentDisplay,
    fill: swrMeterFill,
    needle: swrMeterNeedle,
    label: "SWR"
  });
  renderRfGain(state.rfGain);
  syncTxAudioControls(state.txAudio);
  if (channelSliderMode === "frequency") {
    renderSelectedFrequency(state.hz);
  } else {
    renderSelectedChannel(state.channel);
  }
  renderScan(state.scan);

  if (state.raw && state.rxCount !== lastLoggedRxCount) {
    lastLoggedRxCount = state.rxCount;
    logMessage(`RX ${state.raw}`);
  }

  if (state.updatedAt) {
    updatedText.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(state.updatedAt));
  }
}

function renderChannelPanel(profile, selectedNumber) {
  const channels = profile.channels ?? [];
  const editableFavorites = isEditableFavoritesBand(profile);
  channelPanel.hidden = channels.length === 0 && !profile.scanRange;
  channelGrid.replaceChildren();

  if (channels.length === 0 && !profile.scanRange) {
    selectedChannelNumber = null;
    channelPresetDisplay.textContent = "--";
    channelModeDisplay.textContent = "";
    channelSlider.disabled = true;
    channelSliderDisplay.textContent = "--";
    return;
  }

  for (const channel of channels) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "channel-button";
    button.dataset.channelNumber = String(channel.number);
    const label = document.createElement("span");
    label.textContent = channel.label;
    const frequency = document.createElement("strong");
    frequency.textContent = channel.display;
    button.append(label, frequency);
    if (channel.nickname) {
      const nickname = document.createElement("small");
      nickname.textContent = channel.nickname;
      button.append(nickname);
    }
    if (editableFavorites) {
      const edit = document.createElement("span");
      edit.className = "favorite-edit-chip";
      edit.dataset.favoriteEditNumber = String(channel.number);
      edit.textContent = "Edit";
      button.append(edit);
    }
    channelGrid.append(button);
  }

  if (channels.length === 0 && channelSliderMode === "presets") {
    channelSliderMode = "frequency";
  }
  renderSliderModeButtons();
  configureChannelSlider(profile, selectedNumber);
}

function configureChannelSlider(profile, selectedNumber = selectedChannelNumber) {
  if (channelSliderMode === "frequency") {
    const hz = snapFrequencyToSliderStep(
      Number.isInteger(lastKnownHz) ? lastKnownHz : profile.centerHz,
      profile
    );
    channelSliderLabel.textContent = "Frequency";
    channelSlider.min = String(profile.scanRange.startHz);
    channelSlider.max = String(profile.scanRange.endHz);
    channelSlider.step = String(FREQUENCY_SLIDER_STEP_HZ);
    renderSelectedFrequency(hz);
    return;
  }

  const channels = profile.channels ?? [];
  channelSliderLabel.textContent = "Channel";
  channelModeDisplay.textContent = profile.defaultMode ?? "Preset";
  if (channels.length === 0) {
    channelSlider.min = "0";
    channelSlider.max = "0";
    channelSlider.step = "1";
    selectedChannelNumber = null;
    channelPresetDisplay.textContent = "--";
    channelSliderDisplay.textContent = "--";
    return;
  }

  channelSlider.min = String(channels[0].number);
  channelSlider.max = String(channels[channels.length - 1].number);
  channelSlider.step = "1";
  renderSelectedChannel(findChannel(profile, selectedNumber) ?? findChannel(profile, profile.defaultChannel));
}

function renderSelectedChannel(channel) {
  if (!channelPanel || channelPanel.hidden) {
    return;
  }

  if (!channel) {
    selectedChannelNumber = null;
    channelPresetDisplay.textContent = "--";
    syncChannelButtons();
    return;
  }

  selectedChannelNumber = channel.number;
  channelPresetDisplay.textContent = [channel.label, channel.display, channel.nickname].filter(Boolean).join(" ");
  channelSliderDisplay.textContent = channel.label;
  if (!isChannelSliderEditing()) {
    channelSlider.value = String(channel.number);
  }
  syncChannelButtons();
}

function renderSelectedFrequency(hz) {
  if (!channelPanel || channelPanel.hidden || channelSliderMode !== "frequency") {
    return;
  }

  const profile = bandProfiles[activeBandId];
  const safeHz = snapFrequencyToSliderStep(Number.isInteger(hz) ? hz : profile.centerHz, profile);
  const matchingChannel = findChannelForHz(profile, safeHz);
  selectedChannelNumber = matchingChannel?.number ?? null;
  channelPresetDisplay.textContent = matchingChannel
    ? [matchingChannel.label, matchingChannel.display, matchingChannel.nickname].filter(Boolean).join(" ")
    : formatFrequencyDisplay(safeHz);
  channelSliderDisplay.textContent = formatFrequencyDisplay(safeHz);
  channelModeDisplay.textContent = "10 Hz";
  if (!isChannelSliderEditing()) {
    channelSlider.value = String(safeHz);
  }
  syncChannelButtons();
}

function renderMeter(meter) {
  if (!meterRawDisplay || !meterPercentDisplay || !meterFill || !meterNeedle) {
    return;
  }

  const percent = meter?.percent ?? 0;
  const clamped = Math.min(Math.max(percent, 0), 100);

  meterRawDisplay.textContent = `${percent}%`;
  meterPercentDisplay.textContent = `${meter?.source ?? "CAT"} receive meter`;
  meterFill.style.width = `${clamped}%`;
  meterNeedle.style.left = `${clamped}%`;
}

function syncTxAudioControls(txAudio = latestCatState?.txAudio) {
  const effectiveConnected = canSendRadioCommand();
  const monitor = txAudio?.monitor ?? {};
  const micGain = txAudio?.micGain ?? null;
  const processor = txAudio?.processor ?? {};
  const parametricEq = txAudio?.parametricEq ?? {};

  if (document.activeElement !== radioMonitorToggle && document.activeElement !== diagnosticsRadioMonitorToggle) {
    const monitorEnabled = monitor.enabled === true;
    radioMonitorToggle.checked = monitorEnabled;
    diagnosticsRadioMonitorToggle.checked = monitorEnabled;
  }

  if (Number.isFinite(monitor.level) && !isElementOneOf(document.activeElement, [radioMonitorLevelSlider, diagnosticsRadioMonitorLevelSlider])) {
    renderRadioMonitorLevel(monitor.level);
  } else if (!Number.isFinite(monitor.level)) {
    radioMonitorLevelDisplay.textContent = "--";
    diagnosticsRadioMonitorLevelDisplay.textContent = "--";
  }

  if (Number.isFinite(micGain?.value) && document.activeElement !== micGainSlider) {
    renderMicGain(micGain.value);
  } else if (!Number.isFinite(micGain?.value)) {
    micGainDisplay.textContent = "--";
  }

  if (Number.isFinite(processor.level) && document.activeElement !== processorLevelSlider) {
    renderProcessorLevel(processor.level);
  } else if (!Number.isFinite(processor.level)) {
    processorLevelDisplay.textContent = "--";
  }

  if (document.activeElement !== processorToggle && typeof processor.enabled === "boolean") {
    processorToggle.checked = processor.enabled;
  }
  if (document.activeElement !== parametricEqToggle && typeof parametricEq.enabled === "boolean") {
    parametricEqToggle.checked = parametricEq.enabled;
  }

  radioMonitorToggle.disabled = !effectiveConnected;
  diagnosticsRadioMonitorToggle.disabled = !effectiveConnected;
  radioMonitorLevelSlider.disabled = !effectiveConnected;
  diagnosticsRadioMonitorLevelSlider.disabled = !effectiveConnected;
  micGainSlider.disabled = !effectiveConnected;
  processorLevelSlider.disabled = !effectiveConnected;
  processorToggle.disabled = !effectiveConnected;
  parametricEqToggle.disabled = !effectiveConnected;
  autoMicPeakButton.disabled = !navigator.mediaDevices?.getUserMedia || Boolean(autoMicPeakRun);
  applyMicPeakButton.disabled = !effectiveConnected || !Number.isFinite(suggestedMicGainValue) || Boolean(autoMicPeakRun);

  const moniText = typeof monitor.enabled === "boolean"
    ? `MONI ${monitor.enabled ? "on" : "off"}`
    : "MONI --";
  const levelText = Number.isFinite(monitor.level) ? `level ${monitor.level}%` : "level --";
  const micText = Number.isFinite(micGain?.value) ? `MIC ${micGain.value}%` : "MIC --";
  txAudioStatusText.textContent = effectiveConnected
    ? `${moniText} / ${levelText} / ${micText}`
    : "Connect CAT to read radio audio controls.";
}

function renderRadioMonitorLevel(value) {
  const safeValue = Math.min(100, Math.max(1, Math.round(Number(value) || 1)));
  radioMonitorLevelSlider.value = String(safeValue);
  diagnosticsRadioMonitorLevelSlider.value = String(safeValue);
  radioMonitorLevelDisplay.textContent = `${safeValue}%`;
  diagnosticsRadioMonitorLevelDisplay.textContent = `${safeValue}%`;
}

function renderMicGain(value) {
  const safeValue = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  micGainSlider.value = String(safeValue);
  micGainDisplay.textContent = `${safeValue}%`;
}

function renderProcessorLevel(value) {
  const safeValue = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  processorLevelSlider.value = String(safeValue);
  processorLevelDisplay.textContent = `${safeValue}%`;
}

function isElementOneOf(element, candidates) {
  return candidates.some((candidate) => element === candidate);
}

function renderAuxMeter(meter, elements) {
  const percent = meter?.percent ?? 0;
  const clamped = Math.min(Math.max(percent, 0), 100);

  elements.rawDisplay.textContent = `${percent}%`;
  elements.percentDisplay.textContent = `${elements.label} ${percent}%`;
  elements.fill.style.width = `${clamped}%`;
  elements.needle.style.left = `${clamped}%`;
}

function renderScanDwell(dwellMs, scan = null) {
  const safeDwellMs = Number.isFinite(dwellMs) ? dwellMs : 100;
  const activeDwellMs = Number.isFinite(scan?.dwellMs) && scan?.active ? scan.dwellMs : safeDwellMs;
  const scanMode = scan?.scanMode ?? bandProfiles[activeBandId]?.scanMode;
  const unit = scanMode === "range" ? "steps/s" : "ch/s";
  const targetRate = activeDwellMs > 0 ? 1000 / activeDwellMs : 0;
  const actualRate = Number.isFinite(scan?.ratePerSecond) && scan?.active ? scan.ratePerSecond : null;
  const requests = scan?.metrics?.meterRequestCount ?? 0;
  const valid = scan?.metrics?.validSampleCount ?? 0;
  const audioSamples = scan?.metrics?.audioSampleCount ?? 0;
  const voiceSamples = scan?.metrics?.voiceSampleCount ?? 0;
  const validPercent = requests > 0 ? Math.round((valid / requests) * 100) : null;

  scanDwellDisplay.textContent = `${safeDwellMs} ms`;
  if (actualRate === null) {
    scanRateDisplay.textContent = `${targetRate.toFixed(1)} ${unit} target`;
  } else if (scan?.audioAssist) {
    scanRateDisplay.textContent = `${actualRate.toFixed(1)} ${unit} actual | voice ${voiceSamples}/${audioSamples}`;
  } else {
    const quality = validPercent === null ? "" : ` | ${validPercent}% valid`;
    scanRateDisplay.textContent = `${actualRate.toFixed(1)} ${unit} actual${quality}`;
  }
}

function renderRegularScanDwell(dwellMs) {
  const safeDwellMs = Number.isFinite(dwellMs) ? dwellMs : 100;
  regularScanDwellDisplay.textContent = `${safeDwellMs} ms`;
}

function renderScan(scan) {
  lastScanState = scan ?? lastScanState;
  scanActive = Boolean(scan?.active);
  const status = scan?.status ?? "idle";
  const direction = scan?.direction === -1 ? "reverse" : "forward";
  const smartListEnabled = scan?.smartList !== false;

  if (document.activeElement !== smartListToggle) {
    smartListToggle.checked = smartListEnabled;
  }
  if (scan?.scanSource && document.activeElement !== regularScanSourceSelect) {
    regularScanSourceSelect.value = scan.scanSource;
  }
  if (Number.isFinite(scan?.stepHz) && document.activeElement !== regularScanStepSelect) {
    const stepOption = regularScanStepSelect.querySelector(`option[value="${scan.stepHz}"]`);
    if (stepOption) {
      regularScanStepSelect.value = String(scan.stepHz);
    }
  }

  if (scan?.verify?.active) {
    scanStatus.textContent = `Smart verify ${scan.verify.channel?.label ?? ""}`.trim();
  } else if (scan?.audioHold?.active) {
    const label = scan.audioHold.channel?.label ?? formatMHz(scan.audioHold.hz);
    const remaining = Number.isFinite(scan.audioHold.holdUntil)
      ? ` ${Math.max(0, Math.ceil((scan.audioHold.holdUntil - Date.now()) / 1000))}s`
      : "";
    const level = Number.isFinite(scan.audioHold.triggerLevelPercent)
      ? ` ${scan.audioHold.triggerLevelPercent}%`
      : "";
    scanStatus.textContent = `Audio hold ${label}${level}${remaining}`;
  } else if (scan?.busyHold?.active) {
    const label = scan.busyHold.channel?.label ?? formatMHz(scan.busyHold.hz);
    scanStatus.textContent = `Hold ${label}`;
  } else if (scanActive && scan.intent === "busy") {
    scanStatus.textContent = "BUSY scan";
  } else if (scanActive && scan.intent === "ssbHunter") {
    const hunter = scan.hunter ?? {};
    const phase = hunter.phase ?? "seeking";
    const score = Number.isFinite(hunter.bestScore) ? ` ${Math.round(hunter.bestScore)}` : "";
    scanStatus.textContent = `SSB ${phase}${score}`;
  } else if (scanActive) {
    const remaining = Number.isFinite(scan?.endsAt)
      ? ` ${Math.max(0, Math.ceil((scan.endsAt - Date.now()) / 1000))}s`
      : "";
    scanStatus.textContent = scan.audioAssist
      ? `Audio smart${remaining}`
      : `Smart scan${remaining} ${direction}`;
  } else {
    scanStatus.textContent = status;
  }
  scanStatus.classList.toggle("active", scanActive);
  syncScanSourceOptions(scan);
  syncScanControls();
  syncChannelButtons();
  if (Number.isFinite(scan?.dwellMs) && scan?.intent === "regular" && document.activeElement !== regularScanDwellSlider) {
    regularScanDwellSlider.value = String(scan.dwellMs);
  } else if (Number.isFinite(scan?.dwellMs) && scan?.intent !== "regular" && document.activeElement !== scanDwellSlider) {
    scanDwellSlider.value = String(scan.dwellMs);
  }
  renderRegularScanDwell(Number(regularScanDwellSlider.value));
  renderScanDwell(Number(scanDwellSlider.value), scan);

  if (scanActive) {
    tuneKeysToggle.checked = true;
  }

  const hits = scan?.hits ?? [];
  const skippedCount = scan?.skippedChannelNumbers?.length ?? 0;
  clearSkipsButton.hidden = skippedCount === 0;
  clearSkipsButton.disabled = !connected || !smartListEnabled;
  clearSkipsButton.textContent = skippedCount > 0 ? `Clear skipped (${skippedCount})` : "Clear skipped";
  scanHits.replaceChildren();

  if (!smartListEnabled) {
    const empty = document.createElement("div");
    empty.className = "empty-hit";
    empty.textContent = "Smart top 5 off.";
    scanHits.append(empty);
    return;
  }

  if (hits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-hit";
    empty.textContent = "No signals logged yet.";
    scanHits.append(empty);
    return;
  }

  for (const hit of hits) {
    const row = document.createElement("div");
    row.className = "hit-row";
    row.dataset.hitId = hit.id;
    const frequencyLabel = hit.channelLabel
      ? `${hit.channelLabel} ${hit.peakDisplay}`
      : hit.peakDisplay;
    const qualityLabel = Number.isFinite(hit.audioScore)
      ? `voice ${Math.round(hit.audioScore)}`
      : `score ${hit.score ?? "--"}`;
    const sampleCount = hit.sampleCount ?? hit.seenCount ?? 0;
    const busyCount = hit.busyCount ?? 0;
    const busySampleCount = hit.busySampleCount ?? Math.max(sampleCount, busyCount);
    const audioSampleCount = hit.audioSampleCount ?? 0;
    const voiceCount = hit.voiceCount ?? 0;
    const trafficPercent = busySampleCount > 0
      ? Math.min(100, Math.round((busyCount / busySampleCount) * 100))
      : 0;
    const voicePercent = audioSampleCount > 0
      ? Math.min(100, Math.round((voiceCount / audioSampleCount) * 100))
      : 0;
    const trafficLabel = audioSampleCount > 0
      ? `voice ${voicePercent}% (${voiceCount}/${audioSampleCount})`
      : busySampleCount > 0
      ? `${trafficPercent}% (${busyCount}/${busySampleCount})`
      : "0% (0/0)";
    const skipControl = Number.isInteger(hit.channelNumber)
      ? `<button type="button" class="hit-skip" data-skip-hit-id="${hit.id}">Skip</button>`
      : `<span></span>`;
    row.innerHTML = `
      <span class="hit-frequency">${frequencyLabel}</span>
      <span>${qualityLabel}</span>
      <span>${hit.audioLevelPercent ?? hit.peakPercent ?? Math.round((hit.peakRaw / 255) * 100)}%</span>
      <span>${trafficLabel}</span>
      <div class="hit-actions">
        <button type="button" class="hit-tune" data-hit-id="${hit.id}">Tune</button>
        ${skipControl}
      </div>
    `;
    scanHits.append(row);
  }
}

function renderRfGain(rfGain) {
  if (!rfGain) {
    rfGainDisplay.textContent = "--";
    return;
  }

  if (!canSyncRangeReadback(rfGainSlider, lastRfGainSentAt)) return;
  rfGainDisplay.textContent = `${rfGain.percent}%`;
  rfGainSlider.value = String(rfGain.value);
  if (lastRfGainSentValue !== rfGain.value) lastRfGainSentValue = null;
}

function renderPendingRfGain() {
  const value = Number(rfGainSlider.value);
  rfGainDisplay.textContent = `${Math.round((value / 255) * 100)}%`;
}

function handleRfGainInput() {
  renderPendingRfGain();
  scheduleRfGainSend();
}

function scheduleRfGainSend() {
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  pendingRfGainValue = Number(rfGainSlider.value);
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
  renderPendingRfGain();
  sendRfGainValue(Number(rfGainSlider.value), { flush: true });
}

function sendRfGainValue(value, options = {}) {
  if (!radioPowered || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
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

function setStatus(text, isConnected) {
  const effectiveConnected = Boolean(isConnected && radioPowered);
  statusText.textContent = radioPowered ? text : "Powered down - visual/logbook mode";
  connectionLight.classList.toggle("connected", effectiveConnected);
  connectButton.disabled = isConnected || !radioPowered;
  disconnectButton.disabled = !isConnected || !radioPowered;
  runConnectButton.disabled = isConnected || !radioPowered;
  runDisconnectButton.disabled = !isConnected || !radioPowered;
  hunterConnectButton.disabled = isConnected || !radioPowered;
  hunterDisconnectButton.disabled = !isConnected || !radioPowered;
  syncRigPowerButton();
  applyPresetButton.disabled = !effectiveConnected;
  pttArmToggle.disabled = !effectiveConnected;
  syncAtuTuneButton();
  rfGainSlider.disabled = !effectiveConnected;
  clearSkipsButton.disabled = !effectiveConnected;
  syncTxAudioControls(latestCatState?.txAudio);
  modeButtons.forEach((button) => {
    button.disabled = !effectiveConnected;
  });
  syncScanControls();
  syncChannelButtons();
  syncCockpitTuningControls();
}

function syncAtuTuneButton() {
  const enabled = radioPowered && connected && !scanActive && isAtuBand(activeBandId);
  atuTuneButton.disabled = !enabled;
  atuTuneButton.hidden = !isAtuBand(activeBandId);
  if (!enabled) {
    clearAtuTuneArm();
  }
}

function renderModeButtons(mode) {
  const activeMode = String(mode ?? "").toUpperCase();
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === activeMode);
  });
}

function syncChannelButtons() {
  const profile = bandProfiles[activeBandId];
  const hasChannels = (profile?.channels?.length ?? 0) > 0;
  const hasFrequencyRange = Boolean(profile?.scanRange);
  const sliderAvailable = channelSliderMode === "frequency" ? hasFrequencyRange : hasChannels;
  channelSlider.disabled = !radioPowered || !connected || scanActive || !sliderAvailable;
  renderSliderModeButtons();
  channelGrid.querySelectorAll("[data-channel-number]").forEach((button) => {
    const number = Number(button.dataset.channelNumber);
    button.disabled = !radioPowered || !connected || scanActive || !hasChannels;
    button.classList.toggle("active", number === selectedChannelNumber);
  });
}

function syncCockpitTuningControls() {
  const profile = bandProfiles[activeBandId];
  const enabled = radioPowered && connected && !scanActive && !benchmarkRunning && Boolean(profile?.scanRange);
  cockpitFrequencySlider.disabled = !enabled;
  cockpitClarifierSlider.disabled = !enabled;
  cockpitClarifierCenterButton.disabled = !enabled || cockpitClarifierOffsetHz === 0;
}

function syncScanSourceOptions(scan = lastScanState) {
  const profile = bandProfiles[activeBandId];
  const hasPresets = (profile?.channels?.length ?? 0) > 0;
  const hasTopHits = (scan?.hits?.length ?? 0) > 0;
  regularScanSourceSelect.querySelector('option[value="presets"]').disabled = !hasPresets;
  regularScanSourceSelect.querySelector('option[value="top5"]').disabled = !hasTopHits;

  if (regularScanSourceSelect.value === "presets" && !hasPresets) {
    regularScanSourceSelect.value = "frequency";
  }
  if (regularScanSourceSelect.value === "top5" && !hasTopHits) {
    regularScanSourceSelect.value = profile?.defaultScanSource ?? "frequency";
  }
}

function syncScanControls() {
  const profile = bandProfiles[activeBandId];
  const hasChannels = (profile?.channels?.length ?? 0) > 0;
  smartListToggle.disabled = benchmarkRunning;
  startScanButton.disabled = !radioPowered || !connected || scanActive || benchmarkRunning || !smartListToggle.checked;
  busyScanButton.disabled = !radioPowered || !connected || scanActive || benchmarkRunning;
  ssbHunterButton.disabled = !radioPowered || benchmarkRunning;
  stopScanButton.disabled = !radioPowered || !connected || !scanActive || benchmarkRunning;
  benchmarkScanButton.disabled = !radioPowered || !connected || scanActive || benchmarkRunning || !hasChannels;
  tuneKeysToggle.disabled = !radioPowered || !connected || scanActive || benchmarkRunning;
  regularScanSourceSelect.disabled = benchmarkRunning;
  regularScanStepSelect.disabled = benchmarkRunning || regularScanSourceSelect.value !== "frequency";
  scanDwellSlider.disabled = !radioPowered || benchmarkRunning;
  regularScanDwellSlider.disabled = !radioPowered || benchmarkRunning;
  readableScanToggle.disabled = !radioPowered || scanActive || benchmarkRunning || !hasChannels;
  busyAssistToggle.disabled = !radioPowered || scanActive || benchmarkRunning || !hasChannels || !readableScanToggle.checked;
  if (!readableScanToggle.checked) {
    busyAssistToggle.checked = false;
  }
  syncAtuTuneButton();
  syncCockpitTuningControls();
}

function logMessage(text) {
  diagnosticsLogEntries.unshift(`${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date())}  ${text}`);
  diagnosticsLogEntries = diagnosticsLogEntries.slice(0, 40);

  if (diagnosticsLogRenderTimer) {
    return;
  }

  diagnosticsLogRenderTimer = setTimeout(renderDiagnosticsLog, 900);
}

function renderDiagnosticsLog() {
  diagnosticsLogRenderTimer = null;
  messageLog.replaceChildren(...diagnosticsLogEntries.slice(0, 12).map((entry) => {
    const line = document.createElement("div");
    line.textContent = entry;
    return line;
  }));

  if (diagnosticsLogEntries.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No CAT events yet.";
    messageLog.append(empty);
  }
}

function showView(name) {
  for (const [viewName, view] of Object.entries(views)) {
    const active = viewName === name;
    view.hidden = !active;
    view.classList.toggle("active", active);
  }

  syncTabs(name);
  syncHunterFrameVisibility(name);
  if (name === "logbook" && !qrzLoadedOnce) {
    void loadQrzLogbook();
  }
}

function syncTabs(viewName = currentViewName()) {
  tabButtons.forEach((button) => {
    const active = button.dataset.view === viewName && (!button.dataset.band || button.dataset.band === activeBandId);
    button.classList.toggle("active", active);
  });
}

function currentViewName() {
  const activeId = document.querySelector(".view.active")?.id;
  if (activeId === "diagnosticsView") {
    return "diagnostics";
  }
  if (activeId === "logbookView") {
    return "logbook";
  }
  if (activeId === "potaView") {
    return "pota";
  }
  if (activeId === "hunterView") {
    return "hunter";
  }
  if (activeId === "audioTestView") {
    return "audioTest";
  }
  if (activeId === "loggerView") {
    return "logger";
  }
  return "run";
}

function renderPotaBandStatus(state = contactContextFromState()) {
  if (!potaBandStatus) {
    return;
  }

  const profile = bandProfiles[state.bandId] ?? bandProfiles[activeBandId] ?? {};
  const range = profile.scanRange ?? state.scanRange;
  const rangeText = range && Number.isInteger(range.startHz) && Number.isInteger(range.endHz)
    ? ` ${formatFrequencyDisplay(range.startHz)}-${formatFrequencyDisplay(range.endHz)}`
    : "";
  potaBandStatus.textContent = `${profile.name ?? state.bandName ?? "Current band"}${rangeText}`;
}

function buildScanOptions(scanConfig) {
  scanThresholdSelect.replaceChildren();
  scanStepSelect.replaceChildren();
  regularScanStepSelect.replaceChildren();

  for (const sUnit of scanConfig?.sUnits ?? []) {
    scanThresholdSelect.append(new Option(`S${sUnit}`, String(sUnit)));
  }

  for (const stepHz of scanConfig?.stepsHz ?? []) {
    scanStepSelect.append(new Option(formatHz(stepHz), String(stepHz)));
  }

  for (const stepHz of scanConfig?.regularStepsHz ?? scanConfig?.stepsHz ?? []) {
    regularScanStepSelect.append(new Option(formatHz(stepHz), String(stepHz)));
  }

  scanThresholdSelect.value = String(scanConfig?.defaultThresholdS ?? 3);
  scanStepSelect.value = String(scanConfig?.defaultStepHz ?? 1000);
  regularScanStepSelect.value = String(scanConfig?.defaultRegularStepHz ?? scanConfig?.defaultStepHz ?? 1000);
  scanDwellSlider.min = String(scanConfig?.dwellRange?.min ?? 20);
  scanDwellSlider.max = String(scanConfig?.dwellRange?.max ?? 1000);
  scanDwellSlider.step = String(scanConfig?.dwellRange?.step ?? 10);
  scanDwellSlider.value = String(scanConfig?.defaultDwellMs ?? 100);
  regularScanDwellSlider.min = String(scanConfig?.regularDwellRange?.min ?? scanConfig?.dwellRange?.min ?? 20);
  regularScanDwellSlider.max = String(scanConfig?.regularDwellRange?.max ?? scanConfig?.dwellRange?.max ?? 1000);
  regularScanDwellSlider.step = String(scanConfig?.regularDwellRange?.step ?? scanConfig?.dwellRange?.step ?? 10);
  regularScanDwellSlider.value = String(scanConfig?.defaultRegularDwellMs ?? scanConfig?.defaultDwellMs ?? 100);
  renderRegularScanDwell(Number(regularScanDwellSlider.value));
  renderScanDwell(Number(scanDwellSlider.value));
}

function formatPresetSummary(profile) {
  const channel = findChannel(profile, profile.defaultChannel);
  if (channel) {
    const mode = profile.defaultMode ? ` - ${profile.defaultMode}` : "";
    return `${channel.label} ${channel.display}${mode} - RF ${profile.defaultRfGainPercent}%`;
  }

  return `Center ${profile.centerDisplay} - RF ${profile.defaultRfGainPercent}%`;
}

function formatApplyLabel(profile) {
  const channel = findChannel(profile, profile.defaultChannel);
  if (channel) {
    return `Apply ${profile.name} preset`;
  }

  return `Apply ${profile.id} preset`;
}

function formatScanRangeSummary(profile) {
  const channels = profile.channels ?? [];
  if (profile.id === "cb" && channels.length > 0) {
    const first = channels[0];
    const last = channels[channels.length - 1];
    return `${profile.scanLabel} ${first.label}-${last.label} ${formatMHz(profile.scanRange.startHz)}-${formatMHz(profile.scanRange.endHz)}`;
  }

  return `${profile.scanLabel} ${formatPhoneRange(profile.scanRange)}`;
}

function formatPhoneRange({ startHz, endHz }) {
  return `${formatMHz(startHz)} - ${formatMHz(endHz)} MHz`;
}

function findChannel(profile, channelNumber) {
  return (profile?.channels ?? []).find((channel) => channel.number === Number(channelNumber)) ?? null;
}

function findChannelForHz(profile, hz) {
  return (profile?.channels ?? []).find((channel) => channel.hz === hz) ?? null;
}

function findNearestChannel(profile, hz) {
  const channels = profile?.channels ?? [];
  if (!Number.isInteger(hz) || channels.length === 0) {
    return null;
  }

  return channels.reduce((nearest, channel) => (
    !nearest || Math.abs(channel.hz - hz) < Math.abs(nearest.hz - hz)
      ? channel
      : nearest
  ), null);
}

function isChannelSliderModeAvailable(profile = bandProfiles[activeBandId]) {
  return profile?.id === "cb" && (profile?.channels?.length ?? 0) > 0;
}

function isCockpitChannelMode(profile = bandProfiles[activeBandId]) {
  return isChannelSliderModeAvailable(profile) && channelSliderMode === "presets";
}

function isEditableFavoritesBand(profile = bandProfiles[activeBandId]) {
  return profile?.id !== "cb" && (profile?.channels?.length ?? 0) > 0;
}

function loadFavoriteOverrides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BAND_FAVORITES_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveFavoriteOverrides(overrides) {
  localStorage.setItem(BAND_FAVORITES_STORAGE_KEY, JSON.stringify(overrides));
}

function applyFavoriteOverrides(profiles) {
  const overrides = loadFavoriteOverrides();
  return Object.fromEntries(Object.entries(profiles ?? {}).map(([bandId, profile]) => {
    if (!isEditableFavoritesBand(profile)) {
      return [bandId, profile];
    }

    const channels = normalizeFavoriteChannels(overrides[bandId], profile);
    return [bandId, {
      ...profile,
      channels: channels.length > 0 ? channels : profile.channels
    }];
  }));
}

function favoriteChannelsForProfile(profile) {
  return (profile?.channels ?? []).map((channel) => ({
    number: channel.number,
    hz: channel.hz,
    nickname: channel.nickname ?? ""
  }));
}

function normalizeFavoriteChannels(channels, profile) {
  const range = profile?.scanRange;
  if (!range || !Array.isArray(channels)) {
    return [];
  }

  return channels
    .map((channel, index) => ({
      number: Number.isInteger(Number(channel.number)) ? Number(channel.number) : index + 1,
      hz: Math.round(Number(channel.hz)),
      nickname: String(channel.nickname ?? "").trim().slice(0, 24)
    }))
    .filter((channel) => Number.isInteger(channel.hz) && channel.hz >= range.startHz && channel.hz <= range.endHz)
    .sort((left, right) => left.number - right.number)
    .slice(0, 12)
    .map((channel, index) => ({
      ...channel,
      number: index + 1,
      display: formatFrequencyDisplay(channel.hz),
      label: `FAV ${String(index + 1).padStart(2, "0")}`
    }));
}

function customChannelsForMessage(bandId = activeBandId) {
  const profile = bandProfiles[bandId];
  if (!isEditableFavoritesBand(profile)) {
    return null;
  }

  return favoriteChannelsForProfile(profile);
}

function isAtuBand(bandId) {
  return Object.hasOwn(bandProfiles, bandId);
}

function snapFrequencyToSliderStep(hz, profile) {
  const range = profile?.scanRange;
  if (!range || !Number.isFinite(hz)) {
    return profile?.centerHz ?? 0;
  }

  const offset = Math.round((hz - range.startHz) / FREQUENCY_SLIDER_STEP_HZ) * FREQUENCY_SLIDER_STEP_HZ;
  return Math.min(range.endHz, Math.max(range.startHz, range.startHz + offset));
}

function formatFrequencyDisplay(hz) {
  if (!Number.isFinite(hz)) {
    return "--";
  }

  const padded = String(Math.round(hz)).padStart(8, "0");
  const mhz = Number(padded.slice(0, -6));
  return `${mhz}.${padded.slice(-6, -3)}.${padded.slice(-3)}`;
}

function hzToMhz(hz) {
  return Number.isFinite(hz) ? (hz / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function formatAdifDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length !== 8) {
    return "--";
  }
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

function qrzRecordLocalDate(record = {}) {
  const cleanDate = String(record.qso_date ?? "").replace(/\D/g, "");
  if (cleanDate.length !== 8) {
    return null;
  }

  const cleanTime = String(record.time_on ?? "").replace(/\D/g, "").padEnd(4, "0");
  const date = new Date(Date.UTC(
    Number(cleanDate.slice(0, 4)),
    Number(cleanDate.slice(4, 6)) - 1,
    Number(cleanDate.slice(6, 8)),
    Number(cleanTime.slice(0, 2)),
    Number(cleanTime.slice(2, 4))
  ));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatAdifTime(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length < 4) {
    return "--";
  }
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}Z`;
}

function formatHz(hz) {
  if (hz >= 1000) {
    return `${hz / 1000} kHz`;
  }

  return `${hz} Hz`;
}

function formatMHz(hz) {
  return (hz / 1_000_000).toFixed(3);
}
