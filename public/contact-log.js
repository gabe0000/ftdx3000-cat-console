import { bandIdToAdifBand } from "./band-plan.js";
import { canSyncRangeReadback } from "./range-readback.js";
import { stationCallsign, cbStationId as defaultCbStationId } from "./station.js";

const statusText = document.querySelector("#statusText");
const embeddedLogger = new URLSearchParams(location.search).get("embedded") === "1";
document.body.classList.toggle("embedded", embeddedLogger);
const frequencyPreviewLabel = document.querySelector("#frequencyPreviewLabel");
const frequencyPreview = document.querySelector("#frequencyPreview");
const refreshFromRadioButton = document.querySelector("#refreshFromRadioButton");
const pttStatusDisplay = document.querySelector("#pttStatusDisplay");
const pttButton = document.querySelector("#pttButton");
const rfGainDisplay = document.querySelector("#rfGainDisplay");
const rfGainSlider = document.querySelector("#rfGainSlider");
const clarifierDisplay = document.querySelector("#clarifierDisplay");
const clarifierSlider = document.querySelector("#clarifierSlider");
const clarifierCenterButton = document.querySelector("#clarifierCenterButton");
const contactForm = document.querySelector("#contactForm");
const callFieldLabel = document.querySelector("#callFieldLabel");
const callInput = document.querySelector("#callInput");
const cbHandleField = document.querySelector("#cbHandleField");
const cbHandleInput = document.querySelector("#cbHandleInput");
const stationFieldLabel = document.querySelector("#stationFieldLabel");
const stationCallsignInput = document.querySelector("#stationCallsignInput");
const qsoDateInput = document.querySelector("#qsoDateInput");
const qsoMonthInput = document.querySelector("#qsoMonthInput");
const qsoDayInput = document.querySelector("#qsoDayInput");
const qsoYearInput = document.querySelector("#qsoYearInput");
const timeOnInput = document.querySelector("#timeOnInput");
const timeHourInput = document.querySelector("#timeHourInput");
const timeMinuteInput = document.querySelector("#timeMinuteInput");
const freqInput = document.querySelector("#freqInput");
const bandInput = document.querySelector("#bandInput");
const modeInput = document.querySelector("#modeInput");
const gridInput = document.querySelector("#gridInput");
const potaLocationInput = document.querySelector("#potaLocationInput");
const rstSentInput = document.querySelector("#rstSentInput");
const rstRcvdInput = document.querySelector("#rstRcvdInput");
const nameFieldLabel = document.querySelector("#nameFieldLabel");
const nameInput = document.querySelector("#nameInput");
const nameField = nameInput.closest("label");
const qthFieldLabel = document.querySelector("#qthFieldLabel");
const qthInput = document.querySelector("#qthInput");
const commentInput = document.querySelector("#commentInput");
const previousQsoPanel = document.querySelector("#previousQsoPanel");
const previousQsoSummary = document.querySelector("#previousQsoSummary");
const duplicateBadge = document.querySelector("#duplicateBadge");
const previousQsoList = document.querySelector("#previousQsoList");
const noticeText = document.querySelector("#noticeText");
const qrzLoginButton = document.querySelector("#qrzLoginButton");
const openQrzButton = document.querySelector("#openQrzButton");
const queueQsoCardButton = document.querySelector("#queueQsoCardButton");
const replaceToggleButton = document.querySelector("#replaceToggleButton");
const submitButton = document.querySelector("#submitButton");
const qrzLoginDialog = document.querySelector("#qrzLoginDialog");
const qrzLoginForm = document.querySelector("#qrzLoginForm");
const qrzXmlUsernameInput = document.querySelector("#qrzXmlUsernameInput");
const qrzXmlPasswordInput = document.querySelector("#qrzXmlPasswordInput");
const qrzLogbookKeyInput = document.querySelector("#qrzLogbookKeyInput");
const qrzLoginNotice = document.querySelector("#qrzLoginNotice");
const qrzLoginCancelButton = document.querySelector("#qrzLoginCancelButton");
const qrzLoginSubmitButton = document.querySelector("#qrzLoginSubmitButton");
const RF_GAIN_LIVE_THROTTLE_MS = 120;
const PTT_TIMEOUT_MS = 120_000;
const CB_LOCAL_LOG_STORAGE_KEY = "yeasuCatCbLocalLog";
const QSO_CARD_QUEUE_STORAGE_KEY = "yeasuCatQsoCardQueue";
const CB_STATION_ID_STORAGE_KEY = "yeasuCatCbStationId";
const CB_MIN_MHZ = 26.965;
const CB_MAX_MHZ = 27.405;

let socket = null;
let latestState = null;
let connected = false;
let context = loadDraftContext();
let editRecord = context.record ?? null;
let replaceMode = Boolean(editRecord && !editRecord.localOnly);
let lastLookupCall = "";
let pttActive = false;
let pttKeyDown = false;
let pttTimeoutTimer = null;
let lastRfGainSentAt = 0;
let lastRfGainSentValue = null;
let pendingRfGainValue = null;
let rfGainSendTimer = null;
let clarifierOffsetHz = 0;
let loggedBaseHz = null;
let frequencyLocked = Boolean(editRecord);
let frequencyLockReason = editRecord ? "Editing QSO" : "";
let qrzLoginResolver = null;
let logbookRecordsCache = null;
let logbookRecordsPromise = null;
let previousQsoCheckTimer = null;
let latestPreviousQsoKey = "";
let queueQsoCardAfterLog = false;

callInput.addEventListener("blur", lookupCallsignOnBlur);
callInput.addEventListener("input", () => {
  callInput.value = callInput.value.toUpperCase();
  clearPreviousQsoPanel();
});
freqInput.addEventListener("input", handleFrequencyInput);
bandInput.addEventListener("input", renderReplaceMode);
for (const input of [qsoMonthInput, qsoDayInput, qsoYearInput, timeHourInput, timeMinuteInput]) {
  input.addEventListener("input", handleSegmentInput);
  input.addEventListener("blur", normalizeSegmentInput);
}
refreshFromRadioButton.addEventListener("click", () => fillFromRadio({ lock: true }));
pttButton.addEventListener("pointerdown", handlePttPointerDown);
pttButton.addEventListener("pointerup", () => releasePtt("button"));
pttButton.addEventListener("pointercancel", () => releasePtt("button cancel"));
pttButton.addEventListener("pointerleave", () => releasePtt("button leave"));
rfGainSlider.addEventListener("input", handleRfGainInput);
rfGainSlider.addEventListener("change", setRfGain);
clarifierSlider.addEventListener("input", handleClarifierInput);
clarifierSlider.addEventListener("change", handleClarifierInput);
clarifierCenterButton.addEventListener("click", centerClarifier);
contactForm.addEventListener("submit", submitContact);
contactForm.addEventListener("input", () => renderQsoCardQueueButton());
openQrzButton.addEventListener("click", openQrzPage);
queueQsoCardButton.addEventListener("click", toggleQsoCardQueue);
qrzLoginButton.addEventListener("click", () => promptForQrzXmlLogin());
replaceToggleButton.addEventListener("click", toggleReplaceMode);
qrzLoginForm.addEventListener("submit", handleQrzLoginSubmit);
qrzLoginCancelButton.addEventListener("click", cancelQrzLogin);
qrzLoginDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelQrzLogin();
});
qrzLoginDialog.addEventListener("close", () => {
  if (qrzLoginResolver) {
    qrzLoginResolver(false);
    qrzLoginResolver = null;
  }
});
document.addEventListener("keydown", handleKeyDown, { capture: true });
document.addEventListener("keyup", handleKeyUp, { capture: true });
document.addEventListener("keypress", handlePttTextKey, { capture: true });
document.addEventListener("beforeinput", handlePttBeforeInput, { capture: true });
document.addEventListener("input", removePttCharacterFromField, { capture: true });
window.addEventListener("blur", () => releasePtt("window blur"));
window.addEventListener("pagehide", () => releasePtt("page hidden"));
window.addEventListener("beforeunload", () => releasePtt("unload"));

initializeForm();
connectWebSocket();

function initializeForm() {
  const now = new Date();
  setSegmentedDate(formatUtcDate(now));
  setSegmentedTime(formatUtcTime(now));
  stationCallsignInput.value = localStorage.getItem("yeasuCatStationCallsign") ?? stationCallsign;
  fillFromContext(context.state ?? {});
  if (!editRecord) {
    applyPotaSpotContext(context.state ?? {});
    applyLastPotaSpotContext(context.state ?? {});
  }
  if (editRecord) {
    fillFromRecord(editRecord);
  } else if (callInput.value.trim()) {
    setFrequencyLocked(true, "Draft QSO");
  } else {
    setFrequencyLocked(false);
  }
  renderClarifier();
  syncCatControls();
  renderReplaceMode();
  renderQsoCardQueueButton();
  setStatus(editRecord?.localOnly ? "Editing local CB record" : editRecord ? "Editing QRZ record" : "Ready");
}

function connectWebSocket() {
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/cat`);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "error") {
      setStatus(message.message);
      return;
    }

    if (message.type === "state") {
      latestState = message;
      connected = message.status === "connected";
      renderPtt(message.ptt);
      renderRfGain(message.rfGain);
      syncCatControls();
      if (shouldFollowRadioFrequency()) {
        fillFromRadio({ lock: false, resetClarifier: false });
      }
    }
  });
  socket.addEventListener("open", () => {
    setStatus("Linked");
    syncCatControls();
  });
  socket.addEventListener("close", () => {
    connected = false;
    renderPtt({ active: false, reason: "disconnect" });
    syncCatControls();
    setStatus("CAT link closed");
    setTimeout(connectWebSocket, 1200);
  });
}

function fillFromRadio(options = {}) {
  const { lock = false, resetClarifier = true } = options;
  const state = latestState ?? {};
  if (resetClarifier) {
    clarifierOffsetHz = 0;
    clarifierSlider.value = "0";
    renderClarifier();
  }
  fillFromContext({
    bandId: state.band?.id ?? context.state?.bandId,
    band: state.band?.id ?? context.state?.band,
    bandName: state.band?.name ?? context.state?.bandName,
    adifBand: bandIdToAdifBand(state.band?.id) || context.state?.adifBand,
    hz: state.hz ?? context.state?.hz,
    frequency: state.frequency ?? context.state?.frequency,
    frequencyMhz: Number.isInteger(state.hz) ? hzToMhz(state.hz) : context.state?.frequencyMhz,
    mode: state.mode ?? context.state?.mode
  });
  if (lock && Number.isInteger(loggedBaseHz)) {
    setFrequencyLocked(true, "Radio captured");
  } else {
    renderFrequencyFollowState();
  }
}

function fillFromContext(state = {}) {
  const stateHz = Number.isInteger(state.hz) ? state.hz : mhzToHz(state.frequencyMhz);
  if (Number.isInteger(stateHz)) {
    loggedBaseHz = stateHz;
    renderLoggedFrequency();
  } else {
    frequencyPreview.textContent = state.frequency ?? "--.---.---";
    freqInput.value = state.frequencyMhz ?? freqInput.value;
  }
  bandInput.value = state.adifBand ?? bandIdToAdifBand(state.bandId ?? state.band) ?? bandInput.value;
  if (state.mode) {
    modeInput.value = ["USB", "LSB", "AM", "SSB"].includes(String(state.mode).toUpperCase())
      ? String(state.mode).toUpperCase()
      : modeInput.value;
  }
  renderReplaceMode();
}

function shouldFollowRadioFrequency() {
  return !editRecord && !frequencyLocked && document.activeElement !== freqInput;
}

function lockFrequencyToCurrentRadio(reason = "Locked QSO freq") {
  if (editRecord) {
    setFrequencyLocked(true, "Editing QSO");
    return;
  }

  fillFromRadio({ lock: false, resetClarifier: false });
  if (Number.isInteger(loggedBaseHz)) {
    setFrequencyLocked(true, reason);
  }
}

function setFrequencyLocked(locked, reason = "") {
  frequencyLocked = Boolean(locked);
  frequencyLockReason = frequencyLocked ? reason : "";
  renderFrequencyFollowState();
}

function renderFrequencyFollowState() {
  frequencyPreviewLabel.textContent = frequencyLocked
    ? frequencyLockReason || "Locked QSO freq"
    : "Following VFO-A";
  refreshFromRadioButton.textContent = frequencyLocked ? "Update From Radio" : "Use Radio";
}

function applyLastPotaSpotContext(state = {}) {
  const spot = loadLastPotaSpot();
  if (!spot || Date.now() - spot.savedAt > 2 * 60 * 60 * 1000) {
    return;
  }

  const currentHz = Number(state.hz);
  const spotHz = Number(spot.hz);
  if (Number.isFinite(currentHz) && Number.isFinite(spotHz) && Math.abs(currentHz - spotHz) > 2_000) {
    return;
  }

  fillEmptyField(callInput, spot.activator);
  const parkLabel = potaParkLabel(spot);
  fillEmptyField(potaLocationInput, parkLabel);
  fillEmptyField(qthInput, parkLabel);
}

function applyPotaSpotContext(state = {}) {
  const spot = state.potaSpot;
  if (!spot) {
    return;
  }

  fillEmptyField(callInput, spot.activator);
  const parkLabel = potaParkLabel(spot);
  fillEmptyField(potaLocationInput, parkLabel);
  fillEmptyField(qthInput, parkLabel);
  if (spot.comments && !commentInput.value.trim()) {
    commentInput.value = spot.comments;
  }
}

function potaParkLabel(spot = {}) {
  return [spot.reference, spot.parkName].filter(Boolean).join(" - ");
}

function fillFromRecord(record) {
  callInput.value = record.call ?? "";
  stationCallsignInput.value = record.station_callsign ?? stationCallsignInput.value;
  setSegmentedDate(record.qso_date ?? qsoDateInput.value);
  setSegmentedTime(record.time_on ?? timeOnInput.value);
  freqInput.value = record.freq ?? freqInput.value;
  bandInput.value = record.band ?? bandInput.value;
  modeInput.value = record.submode || record.mode || modeInput.value;
  gridInput.value = record.gridsquare ?? "";
  potaLocationInput.value = record.app_yeasu_cat_pota_location ?? record.pota_ref ?? "";
  rstSentInput.value = record.rst_sent ?? rstSentInput.value;
  rstRcvdInput.value = record.rst_rcvd ?? rstRcvdInput.value;
  nameInput.value = record.name ?? "";
  cbHandleInput.value = record.name ?? "";
  qthInput.value = record.qth ?? "";
  commentInput.value = record.comment ?? "";
  const recordHz = mhzToHz(record.freq);
  if (Number.isInteger(recordHz)) {
    loggedBaseHz = recordHz;
    renderLoggedFrequency();
  } else {
    frequencyPreview.textContent = record.freq ? `${record.freq} MHz` : frequencyPreview.textContent;
  }
  setFrequencyLocked(true, "Editing QSO");
}

async function submitContact(event) {
  event.preventDefault();
  syncDateTimeFields();
  submitButton.disabled = true;
  const contact = formContact();
  const cbContact = isCbContact(contact);

  if (cbContact) {
    contact.stationCallsign = cbStationId(contact.stationCallsign);
    localStorage.setItem(CB_STATION_ID_STORAGE_KEY, contact.stationCallsign);
    const saved = saveLocalCbContact(contact);
    if (queueQsoCardAfterLog) {
      queueQsoCardForContact(contact, {
        logid: saved.logid,
        localOnly: true,
        status: "queued"
      });
      notifyQsoCardStatusUpdated();
    }
    const loggedCallsign = formatCallsign(contact.call);
    const updated = Boolean(editRecord?.localOnly);
    setStatus(updated ? "CB log updated" : "CB saved locally");
    noticeText.textContent = updated
      ? `QSO with ${loggedCallsign} updated in the local CB log. QRZ sync skipped by design.${queueQsoCardAfterLog ? " QSO card queued." : ""}`
      : `QSO with ${loggedCallsign} saved to the local CB log. QRZ sync skipped by design.${queueQsoCardAfterLog ? " QSO card queued." : ""}`;
    notifyLocalCbLogUpdated(saved);
    resetContactFormAfterSuccessfulLog(contact);
    submitButton.disabled = false;
    return;
  }

  localStorage.setItem("yeasuCatStationCallsign", contact.stationCallsign);
  setStatus("Sending to QRZ...");

  try {
    const response = await fetch("/api/qrz/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact, replace: replaceMode })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "QRZ upload failed");
    }

    const loggedCallsign = formatCallsign(contact.call);
    if (queueQsoCardAfterLog) {
      queueQsoCardForContact(contact, {
        logid: data.logid,
        localOnly: false,
        status: "queued"
      });
      notifyQsoCardStatusUpdated();
    }
    setStatus(data.logid ? `Logged ${data.logid}` : "Logged");
    noticeText.textContent = `QSO with ${loggedCallsign} logged successfully and synced with QRZ.${queueQsoCardAfterLog ? " QSO card queued." : ""}`;
    resetContactFormAfterSuccessfulLog(contact);
  } catch (error) {
    setStatus("QRZ failed");
    noticeText.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

function formContact() {
  return {
    call: callInput.value,
    stationCallsign: stationCallsignInput.value,
    qsoDate: qsoDateInput.value,
    timeOn: timeOnInput.value,
    freq: freqInput.value,
    band: bandInput.value,
    mode: modeInput.value,
    grid: gridInput.value,
    potaLocation: potaLocationInput.value,
    rstSent: rstSentInput.value,
    rstRcvd: rstRcvdInput.value,
    name: isCbFormContext() ? cbHandleInput.value : nameInput.value,
    qth: qthInput.value,
    comment: commentInput.value,
    source: editRecord?.logid ? `YEASU CAT edit ${editRecord.logid}` : "YEASU CAT"
  };
}

function toggleQsoCardQueue() {
  const contact = formContact();
  const existing = qsoCardStatusForContact(contact);
  const alreadyQueued = queueQsoCardAfterLog || existing?.status === "queued";
  if (alreadyQueued) {
    queueQsoCardAfterLog = false;
    if (existing?.status === "queued") {
      removeQsoCardStatusForContact(contact);
      notifyQsoCardStatusUpdated();
    }
    noticeText.textContent = "QSO card removed from the send queue.";
    renderQsoCardQueueButton();
    return;
  }

  queueQsoCardAfterLog = true;
  const entry = queueQsoCardForContact(contact, {
    logid: editRecord?.logid,
    localOnly: editRecord?.localOnly === true,
    status: "queued"
  });
  if (entry) {
    notifyQsoCardStatusUpdated();
    noticeText.textContent = `QSO card queued for ${entry.call || "this contact"}.`;
  } else {
    noticeText.textContent = "QSO card will be queued when this contact is logged.";
  }
  renderQsoCardQueueButton();
}

function renderQsoCardQueueButton() {
  const status = qsoCardStatusForContact(formContact());
  const queued = queueQsoCardAfterLog || status?.status === "queued";
  const sent = status?.status === "sent";
  queueQsoCardButton.classList.toggle("qso-card-active", queued);
  queueQsoCardButton.classList.toggle("qso-card-sent", sent && !queued);
  queueQsoCardButton.textContent = queued
    ? "Card Queued"
    : sent
    ? "Queue Again"
    : "Queue QSO Card";
  queueQsoCardButton.title = sent
    ? `QSO card marked sent${status.sentAt ? ` ${formatLocalDateTime(status.sentAt)}` : ""}`
    : queued
    ? "Click to remove this QSO card from the send queue"
    : "Queue a physical QSO card for this contact";
}

function queueQsoCardForContact(contact, options = {}) {
  const entry = qsoCardEntryFromContact(contact, options);
  if (!entry) {
    return null;
  }

  const queue = loadQsoCardQueue();
  const existing = qsoCardStatusForContact(contact);
  if (existing?.key && existing.key !== entry.key) {
    delete queue[existing.key];
  }
  queue[entry.key] = {
    ...queue[entry.key],
    ...entry,
    status: options.status ?? "queued",
    queuedAt: queue[entry.key]?.queuedAt ?? existing?.queuedAt ?? new Date().toISOString(),
    sentAt: null
  };
  saveQsoCardQueue(queue);
  return queue[entry.key];
}

function removeQsoCardStatusForContact(contact) {
  const existing = qsoCardStatusForContact(contact);
  if (!existing?.key) {
    return;
  }

  const queue = loadQsoCardQueue();
  delete queue[existing.key];
  saveQsoCardQueue(queue);
}

function qsoCardStatusForContact(contact) {
  const entry = qsoCardEntryFromContact(contact, {
    logid: editRecord?.logid,
    localOnly: editRecord?.localOnly === true
  });
  if (!entry) {
    return null;
  }

  const queue = loadQsoCardQueue();
  const direct = queue[entry.key];
  if (direct) {
    return { ...direct, key: entry.key };
  }

  const fallback = Object.entries(queue)
    .find(([, candidate]) => candidate?.signature && candidate.signature === entry.signature);
  return fallback ? { ...fallback[1], key: fallback[0] } : null;
}

function qsoCardEntryFromContact(contact, options = {}) {
  const call = formatCallsign(contact.call);
  if (!call) {
    return null;
  }

  const qsoDate = normalizeAdifDate(contact.qsoDate) || qsoDateInput.value;
  const timeOn = normalizeAdifTime(contact.timeOn) || timeOnInput.value;
  const freq = normalizeMhzText(contact.freq);
  const band = String(contact.band ?? "").trim();
  const mode = String(contact.mode ?? "").trim().toUpperCase();
  const localOnly = options.localOnly === true || isCbContact(contact);
  const logid = String(options.logid ?? editRecord?.logid ?? "").trim();
  const signature = qsoCardSignature({ call, qso_date: qsoDate, time_on: timeOn, freq });
  const key = logid
    ? `${localOnly ? "cb" : "qrz"}:${logid}`
    : `contact:${signature}`;
  return {
    key,
    signature,
    logid,
    localOnly,
    call,
    stationCallsign: String(contact.stationCallsign ?? "").trim(),
    name: String(contact.name ?? "").trim(),
    qth: String(contact.qth ?? "").trim(),
    grid: String(contact.grid ?? "").trim().toUpperCase(),
    qsoDate,
    timeOn,
    freq,
    band,
    mode,
    source: localOnly ? "local-cb" : "qrz"
  };
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

function notifyQsoCardStatusUpdated() {
  const message = { type: "qsoCardStatusUpdated" };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, location.origin);
  }
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(message, location.origin);
  }
}

function qsoCardSignature(record = {}) {
  return [
    String(record.call ?? "").trim().toUpperCase(),
    String(record.qso_date ?? record.qsoDate ?? "").replace(/\D/g, ""),
    String(record.time_on ?? record.timeOn ?? "").replace(/\D/g, "").slice(0, 4),
    normalizeMhzText(record.freq)
  ].join(":");
}

function resetContactFormAfterSuccessfulLog(contact) {
  const stationCallsign = contact.stationCallsign;
  const now = new Date();

  editRecord = null;
  replaceMode = false;
  lastLookupCall = "";
  latestPreviousQsoKey = "";
  logbookRecordsCache = null;
  logbookRecordsPromise = null;
  contactForm.reset();

  stationCallsignInput.value = stationCallsign;
  rstSentInput.value = "59";
  rstRcvdInput.value = "59";
  cbHandleInput.value = "";
  setSegmentedDate(formatUtcDate(now));
  setSegmentedTime(formatUtcTime(now));
  clarifierOffsetHz = 0;
  clarifierSlider.value = "0";
  renderClarifier();
  clearPreviousQsoPanel();
  setFrequencyLocked(false);
  fillFromRadio({ lock: false });
  renderReplaceMode();
  queueQsoCardAfterLog = false;
  renderQsoCardQueueButton();
  callInput.focus();
}

function saveLocalCbContact(contact) {
  const records = loadLocalCbLog();
  const now = new Date();
  const existingLogId = editRecord?.localOnly ? editRecord.logid : "";
  const record = {
    logid: existingLogId || `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    localOnly: true,
    source: "local-cb",
    station_callsign: String(contact.stationCallsign ?? "").trim() || defaultCbStationId,
    call: formatCallsign(contact.call),
    qso_date: normalizeAdifDate(contact.qsoDate) || formatUtcDate(now),
    time_on: normalizeAdifTime(contact.timeOn) || formatUtcTime(now),
    band: "11m",
    mode: String(contact.mode ?? "").trim().toUpperCase() || "AM",
    displayMode: String(contact.mode ?? "").trim().toUpperCase() || "AM",
    freq: normalizeMhzText(contact.freq),
    name: String(contact.name ?? "").trim(),
    qth: String(contact.qth ?? "").trim(),
    gridsquare: String(contact.grid ?? "").trim().toUpperCase(),
    rst_sent: String(contact.rstSent ?? "").trim(),
    rst_rcvd: String(contact.rstRcvd ?? "").trim(),
    comment: String(contact.comment ?? "").trim(),
    savedAt: editRecord?.savedAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };
  const existingIndex = records.findIndex((item) => String(item.logid ?? "") === String(existingLogId));
  if (existingIndex >= 0) {
    records.splice(existingIndex, 1, record);
  } else {
    records.unshift(record);
  }
  localStorage.setItem(CB_LOCAL_LOG_STORAGE_KEY, JSON.stringify(records.slice(0, 500)));
  return record;
}

function loadLocalCbLog() {
  try {
    const records = JSON.parse(localStorage.getItem(CB_LOCAL_LOG_STORAGE_KEY) ?? "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function notifyLocalCbLogUpdated(record) {
  const message = {
    type: "cbLocalLogUpdated",
    record
  };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, location.origin);
  }
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(message, location.origin);
  }
}

function isCbContact(contact = {}) {
  const band = String(contact.band ?? "").trim().toLowerCase();
  const freq = Number(contact.freq);
  return band === "11m"
    || band === "cb"
    || (Number.isFinite(freq) && freq >= CB_MIN_MHZ && freq <= CB_MAX_MHZ);
}

function isCbFormContext() {
  return isCbContact({
    band: bandInput.value,
    freq: freqInput.value
  });
}

function cbStationId(value) {
  const current = String(value ?? "").trim();
  if (!current || current.toUpperCase() === stationCallsign) {
    return localStorage.getItem(CB_STATION_ID_STORAGE_KEY) || defaultCbStationId;
  }
  return current;
}

function normalizeMhzText(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function normalizeAdifDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length === 8 ? clean : "";
}

function normalizeAdifTime(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length >= 4 ? clean.slice(0, 6).padEnd(6, "0") : "";
}

function formatCallsign(value) {
  return String(value ?? "").trim().toUpperCase() || "contact";
}

async function lookupCallsignOnBlur() {
  const call = callInput.value.trim().toUpperCase();
  callInput.value = call;
  if (!call) {
    clearPreviousQsoPanel();
    return;
  }

  if (!editRecord) {
    lockFrequencyToCurrentRadio("Callsign locked");
  }
  void checkPreviousQsosForCall(call);
  if (isCbFormContext()) {
    setStatus("CB local lookup");
    noticeText.textContent = "CB numbers and handles stay in the local CB log. QRZ lookup skipped.";
    return;
  }
  if (call === lastLookupCall) {
    return;
  }

  lastLookupCall = call;
  setStatus("Looking up QRZ...");
  try {
    await lookupAndFillCallsign(call);
  } catch (error) {
    setStatus("QRZ lookup skipped");
    noticeText.textContent = error.message;
  }
}

async function lookupAndFillCallsign(call, options = {}) {
  const response = await fetch(`/api/qrz/callsign/${encodeURIComponent(call)}`);
  const data = await response.json();
  if ((!response.ok || data.ok === false) && data.needsCredentials && !options.afterLogin) {
    const loggedIn = await promptForQrzXmlLogin();
    if (!loggedIn) {
      throw new Error("QRZ XML login canceled.");
    }
    return lookupAndFillCallsign(call, { afterLogin: true });
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.reason ?? "QRZ lookup failed");
  }

  const record = data.record ?? {};
  fillEmptyField(nameInput, record.name);
  fillEmptyField(qthInput, record.qth);
  fillEmptyField(gridInput, record.grid);
  setStatus("QRZ filled");
  noticeText.textContent = [
    record.name ? `Name: ${record.name}` : "",
    record.qth ? `QTH: ${record.qth}` : "",
    record.grid ? `Grid: ${record.grid}` : ""
  ].filter(Boolean).join("  |  ") || "QRZ lookup returned the callsign.";
}

function schedulePreviousQsoCheck() {
  const call = callInput.value.trim().toUpperCase();
  if (!call) {
    clearPreviousQsoPanel();
    return;
  }

  clearTimeout(previousQsoCheckTimer);
  previousQsoCheckTimer = setTimeout(() => {
    void checkPreviousQsosForCall(call);
  }, 250);
}

async function checkPreviousQsosForCall(call) {
  const safeCall = String(call ?? "").trim().toUpperCase();
  const qsoDate = qsoDateInput.value;
  const checkKey = `${safeCall}:${qsoDate}`;
  latestPreviousQsoKey = checkKey;
  if (!safeCall) {
    clearPreviousQsoPanel();
    return;
  }

  previousQsoPanel.hidden = false;
  duplicateBadge.hidden = true;
  previousQsoSummary.textContent = `Checking ${safeCall}...`;
  previousQsoList.replaceChildren();

  try {
    const records = isCbContact(formContact()) ? loadLocalCbLog() : await loadQrzLogbookRecords();
    if (latestPreviousQsoKey !== checkKey) {
      return;
    }
    renderPreviousQsos(safeCall, records);
  } catch (error) {
    if (latestPreviousQsoKey !== checkKey) {
      return;
    }
    previousQsoSummary.textContent = "Previous QSOs unavailable.";
    previousQsoList.replaceChildren(previousQsoCellRow([
      ["QRZ", error.message],
      ["Date", "--"],
      ["Freq", "--"],
      ["QTH", "--"]
    ]));
  }
}

async function loadQrzLogbookRecords() {
  if (logbookRecordsCache) {
    return logbookRecordsCache;
  }
  if (logbookRecordsPromise) {
    return logbookRecordsPromise;
  }

  logbookRecordsPromise = fetch("/api/qrz/logbook?range=all&max=250&maxPages=40")
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || data.ok === false) {
        throw new Error(data.reason ?? "QRZ logbook fetch failed.");
      }
      logbookRecordsCache = data.records ?? [];
      return logbookRecordsCache;
    })
    .finally(() => {
      logbookRecordsPromise = null;
    });

  return logbookRecordsPromise;
}

function renderPreviousQsos(call, records) {
  const targetDate = String(qsoDateInput.value ?? "").replace(/\D/g, "");
  const plannedAt = plannedQsoDate();
  const matches = (records ?? [])
    .filter((record) => String(record.call ?? "").trim().toUpperCase() === call)
    .sort((a, b) => (recordUtcTime(b)?.getTime() ?? 0) - (recordUtcTime(a)?.getTime() ?? 0));
  const sameDay = matches.filter((record) => String(record.qso_date ?? "").replace(/\D/g, "") === targetDate);

  previousQsoPanel.hidden = false;
  duplicateBadge.hidden = sameDay.length === 0;
  previousQsoSummary.textContent = sameDay.length > 0
    ? `${sameDay.length} same-day match${sameDay.length === 1 ? "" : "es"}; ${matches.length} total for ${call}`
    : matches.length > 0
    ? `${matches.length} previous QSO${matches.length === 1 ? "" : "s"} for ${call}; none on this UTC date`
    : `No previous QSOs found for ${call}`;

  if (sameDay.length > 0) {
    setStatus("Repeat contact warning");
  }

  previousQsoList.replaceChildren(...matches.slice(0, 10).map((record) => {
    const recordAt = recordUtcTime(record);
    const elapsed = recordAt && plannedAt ? formatElapsed(plannedAt.getTime() - recordAt.getTime()) : "--";
    const row = previousQsoCellRow([
      ["Date/Time", `${formatAdifDate(record.qso_date)} ${formatAdifTime(record.time_on)}`],
      ["Elapsed", elapsed],
      ["Freq", record.freq ? `${record.freq} MHz` : "--"],
      ["QTH", qrzQthLabel(record)]
    ]);
    row.classList.toggle("same-day", String(record.qso_date ?? "").replace(/\D/g, "") === targetDate);
    return row;
  }));
}

function previousQsoCellRow(cells) {
  const row = document.createElement("div");
  row.className = "previous-qso-row";
  for (const [label, value] of cells) {
    const cell = document.createElement("div");
    const small = document.createElement("small");
    const strong = document.createElement("strong");
    small.textContent = label;
    strong.textContent = value || "--";
    cell.append(small, strong);
    row.append(cell);
  }
  return row;
}

function clearPreviousQsoPanel() {
  latestPreviousQsoKey = "";
  duplicateBadge.hidden = true;
  previousQsoPanel.hidden = true;
  previousQsoSummary.textContent = "No matches loaded.";
  previousQsoList.replaceChildren();
}

function promptForQrzXmlLogin() {
  if (qrzLoginDialog.open) {
    return Promise.resolve(false);
  }

  qrzLoginNotice.textContent = "XML login is used for callsign lookup. The API key is used for log upload/fetch if you enter it.";
  qrzXmlPasswordInput.value = "";
  qrzLogbookKeyInput.value = "";
  qrzLoginDialog.showModal();
  qrzXmlUsernameInput.focus();
  return new Promise((resolve) => {
    qrzLoginResolver = resolve;
  });
}

async function handleQrzLoginSubmit(event) {
  event.preventDefault();
  qrzLoginSubmitButton.disabled = true;
  qrzLoginNotice.textContent = "Checking QRZ login...";
  try {
    const response = await fetch("/api/qrz/xml-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: qrzXmlUsernameInput.value,
        password: qrzXmlPasswordInput.value,
        logbookKey: qrzLogbookKeyInput.value
      })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "QRZ XML login failed.");
    }

    const resolve = qrzLoginResolver;
    qrzLoginResolver = null;
    qrzXmlPasswordInput.value = "";
    qrzLogbookKeyInput.value = "";
    qrzLoginDialog.close();
    resolve?.(true);
    qrzLoginResolver = null;
  } catch (error) {
    qrzLoginNotice.textContent = error.message;
  } finally {
    qrzLoginSubmitButton.disabled = false;
  }
}

function cancelQrzLogin() {
  const resolve = qrzLoginResolver;
  qrzLoginResolver = null;
  qrzXmlPasswordInput.value = "";
  qrzLogbookKeyInput.value = "";
  qrzLoginDialog.close();
  resolve?.(false);
}

function fillEmptyField(input, value) {
  const text = String(value ?? "").trim();
  if (text && !input.value.trim()) {
    input.value = text;
  }
}

function openQrzPage() {
  const call = callInput.value.trim();
  if (!call) {
    setStatus("Enter callsign first");
    return;
  }
  window.open(`https://www.qrz.com/db/${encodeURIComponent(call.toUpperCase())}`, "_blank", "noreferrer");
}

function toggleReplaceMode() {
  replaceMode = !replaceMode;
  renderReplaceMode();
}

function renderReplaceMode() {
  const cbMode = editRecord?.localOnly || isCbFormContext();
  if (cbMode) {
    replaceMode = false;
    callFieldLabel.textContent = "Number";
    stationFieldLabel.textContent = "My CB number / handle";
    cbHandleField.hidden = false;
    if (!cbHandleInput.value.trim() && nameInput.value.trim()) {
      cbHandleInput.value = nameInput.value;
    }
    nameField.hidden = true;
    nameFieldLabel.textContent = "Name";
    qthFieldLabel.textContent = "Location";
    callInput.placeholder = "Number";
    cbHandleInput.placeholder = "Handle";
    qthInput.placeholder = "Location";
    stationCallsignInput.value = cbStationId(stationCallsignInput.value);
    replaceToggleButton.textContent = "Local CB";
    replaceToggleButton.disabled = true;
    replaceToggleButton.classList.remove("danger");
    submitButton.textContent = editRecord?.localOnly ? "Save CB Edit" : "Save CB Log";
    if (!noticeText.textContent || /QRZ key stays|Replace mode asks QRZ/.test(noticeText.textContent)) {
      noticeText.textContent = "CB contacts stay in the local CB log and never sync to QRZ.";
    }
    return;
  }

  callFieldLabel.textContent = "Contact callsign";
  stationFieldLabel.textContent = "My callsign";
  cbHandleField.hidden = true;
  nameField.hidden = false;
  nameFieldLabel.textContent = "Name";
  qthFieldLabel.textContent = "QTH";
  callInput.placeholder = "";
  qthInput.placeholder = "";
  replaceToggleButton.disabled = false;
  replaceToggleButton.textContent = replaceMode ? "Replace On" : "Replace Off";
  replaceToggleButton.classList.toggle("danger", replaceMode);
  submitButton.textContent = "Log Contact";
  if (replaceMode) {
    noticeText.textContent = "Replace mode asks QRZ to overwrite a matching duplicate record. Use it intentionally.";
  } else if (!noticeText.textContent || /Replace mode asks QRZ/.test(noticeText.textContent)) {
    noticeText.textContent = "The QRZ key stays on the local server. This popout never sees it.";
  }
}

function handlePttPointerDown(event) {
  event.preventDefault();
  pttButton.setPointerCapture?.(event.pointerId);
  engagePtt("button");
}

function handleKeyDown(event) {
  if (!isPttKey(event) || pttKeyDown) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  pttKeyDown = true;
  engagePtt("key");
}

function handleKeyUp(event) {
  if (!isPttKey(event)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  pttKeyDown = false;
  releasePtt("key");
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
  const selectionEnd = field.selectionEnd;
  field.value = field.value.replace(/`/g, "");
  if (selectionStart !== null && selectionEnd !== null) {
    const nextPosition = Math.max(0, selectionStart - 1);
    field.setSelectionRange(nextPosition, nextPosition);
  }
}

function isPttKey(event) {
  return event.code === "Backquote" || event.key === "`";
}

function engagePtt(reason = "") {
  if (!connected || !socket || socket.readyState !== WebSocket.OPEN) {
    setStatus("Connect CAT before PTT.");
    return;
  }

  sendPtt(true, reason);
  if (pttTimeoutTimer) {
    clearTimeout(pttTimeoutTimer);
  }
  pttTimeoutTimer = setTimeout(() => releasePtt("timeout"), PTT_TIMEOUT_MS);
}

function releasePtt(reason = "") {
  if (pttTimeoutTimer) {
    clearTimeout(pttTimeoutTimer);
    pttTimeoutTimer = null;
  }

  if (!pttActive && reason !== "disconnect") {
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
  pttStatusDisplay.textContent = pttActive ? "TX" : "Ready";
  pttButton.classList.toggle("transmitting", pttActive);
  pttButton.textContent = pttActive ? "Transmitting" : "Hold PTT";
}

function handleRfGainInput() {
  renderPendingRfGain();
  scheduleRfGainSend();
}

function renderPendingRfGain() {
  const value = Number(rfGainSlider.value);
  rfGainDisplay.textContent = `${Math.round((value / 255) * 100)}%`;
}

function scheduleRfGainSend() {
  if (!socket || socket.readyState !== WebSocket.OPEN || !connected) {
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

function handleClarifierInput() {
  const nextOffsetHz = Number(clarifierSlider.value);
  if (!Number.isFinite(nextOffsetHz)) {
    return;
  }

  if (!frequencyLocked && Number.isInteger(loggedBaseHz)) {
    setFrequencyLocked(true, "Clarifier locked");
  }
  const deltaHz = Math.round(nextOffsetHz - clarifierOffsetHz);
  clarifierOffsetHz = Math.round(nextOffsetHz);
  renderClarifier();
  renderLoggedFrequency();

  if (deltaHz === 0 || !socket || socket.readyState !== WebSocket.OPEN || !connected) {
    return;
  }

  socket.send(JSON.stringify({
    type: "nudge",
    stepHz: deltaHz
  }));
}

function centerClarifier() {
  if (clarifierOffsetHz !== 0 && socket?.readyState === WebSocket.OPEN && connected) {
    socket.send(JSON.stringify({
      type: "nudge",
      stepHz: -clarifierOffsetHz
    }));
  }

  clarifierOffsetHz = 0;
  clarifierSlider.value = "0";
  renderClarifier();
  renderLoggedFrequency();
}

function renderClarifier() {
  const sign = clarifierOffsetHz > 0 ? "+" : "";
  clarifierDisplay.textContent = `${sign}${clarifierOffsetHz} Hz`;
}

function handleFrequencyInput() {
  const hz = mhzToHz(freqInput.value);
  if (!Number.isInteger(hz)) {
    return;
  }

  loggedBaseHz = hz - clarifierOffsetHz;
  frequencyPreview.textContent = formatFrequency(hz);
  setFrequencyLocked(true, "Manual freq");
  renderReplaceMode();
}

function renderLoggedFrequency() {
  if (!Number.isInteger(loggedBaseHz)) {
    return;
  }

  const displayHz = loggedBaseHz + clarifierOffsetHz;
  frequencyPreview.textContent = formatFrequency(displayHz);
  freqInput.value = hzToMhz(displayHz);
}

function syncCatControls() {
  const enabled = connected;
  pttButton.disabled = !enabled;
  rfGainSlider.disabled = !enabled;
  clarifierSlider.disabled = !enabled;
  clarifierCenterButton.disabled = !enabled;
}

function loadDraftContext() {
  try {
    return JSON.parse(localStorage.getItem("yeasuCatContactDraft") ?? "{}");
  } catch {
    return {};
  }
}

function loadLastPotaSpot() {
  try {
    return JSON.parse(localStorage.getItem("yeasuCatLastPotaSpot") ?? "null");
  } catch {
    return null;
  }
}

function setStatus(text) {
  statusText.textContent = text;
}

function formatLocalDateTime(value) {
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

function hzToMhz(hz) {
  return Number.isFinite(hz) ? (hz / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function mhzToHz(mhz) {
  const number = Number(mhz);
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

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatUtcTime(date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatAdifDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length !== 8) {
    return "--";
  }
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

function formatAdifTime(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length < 4) {
    return "--";
  }
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}Z`;
}

function recordUtcTime(record = {}) {
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

function plannedQsoDate() {
  const cleanDate = String(qsoDateInput.value ?? "").replace(/\D/g, "");
  if (cleanDate.length !== 8) {
    return null;
  }
  const cleanTime = String(timeOnInput.value ?? "").replace(/\D/g, "").padEnd(4, "0");
  const date = new Date(Date.UTC(
    Number(cleanDate.slice(0, 4)),
    Number(cleanDate.slice(4, 6)) - 1,
    Number(cleanDate.slice(6, 8)),
    Number(cleanTime.slice(0, 2)),
    Number(cleanTime.slice(2, 4))
  ));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatElapsed(ms) {
  const absMs = Math.abs(Number(ms));
  if (!Number.isFinite(absMs)) {
    return "--";
  }
  const totalMinutes = Math.max(0, Math.round(absMs / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return `${parts.join(" ")} ${Number(ms) >= 0 ? "ago" : "from now"}`;
}

function qrzQthLabel(record = {}) {
  return [
    record.qth,
    record.state,
    record.country,
    record.gridsquare
  ].map((value) => String(value ?? "").trim()).filter(Boolean).join(", ") || "--";
}

function setSegmentedDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length !== 8) {
    return;
  }

  qsoYearInput.value = clean.slice(0, 4);
  qsoMonthInput.value = clean.slice(4, 6);
  qsoDayInput.value = clean.slice(6, 8);
  syncDateTimeFields();
}

function setSegmentedTime(value) {
  const clean = String(value ?? "").replace(/\D/g, "").padEnd(4, "0");
  if (clean.length < 4) {
    return;
  }

  timeHourInput.value = clean.slice(0, 2);
  timeMinuteInput.value = clean.slice(2, 4);
  syncDateTimeFields();
}

function syncDateTimeFields() {
  qsoDateInput.value = [
    qsoYearInput.value,
    qsoMonthInput.value.padStart(2, "0"),
    qsoDayInput.value.padStart(2, "0")
  ].join("").replace(/\D/g, "");
  timeOnInput.value = [
    timeHourInput.value.padStart(2, "0"),
    timeMinuteInput.value.padStart(2, "0")
  ].join("").replace(/\D/g, "");
}

function handleSegmentInput(event) {
  const input = event.currentTarget;
  input.value = input.value.replace(/\D/g, "").slice(0, input.maxLength || 4);
  syncDateTimeFields();
  schedulePreviousQsoCheck();
  if (input.value.length >= Number(input.maxLength)) {
    const next = nextSegmentInput(input);
    if (next) {
      next.focus();
      next.select();
    }
  }
}

function normalizeSegmentInput(event) {
  const input = event.currentTarget;
  if (input.value && input !== qsoYearInput) {
    input.value = input.value.padStart(2, "0");
  }
  syncDateTimeFields();
  schedulePreviousQsoCheck();
}

function nextSegmentInput(input) {
  const segments = [qsoMonthInput, qsoDayInput, qsoYearInput, timeHourInput, timeMinuteInput];
  return segments[segments.indexOf(input) + 1] ?? null;
}
