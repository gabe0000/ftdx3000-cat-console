import { bandIdToAdifBand } from "./band-plan.js";

const statusText = document.querySelector("#statusText");
const embeddedPota = new URLSearchParams(location.search).get("embedded") === "1";
document.body.classList.toggle("embedded", embeddedPota);
const bandSummary = document.querySelector("#bandSummary");
const modeFilterSelect = document.querySelector("#modeFilterSelect");
const includeQrtToggle = document.querySelector("#includeQrtToggle");
const refreshButton = document.querySelector("#refreshButton");
const closeButton = document.querySelector("#closeButton");
const noticeText = document.querySelector("#noticeText");
const spotList = document.querySelector("#spotList");

let socket = null;
let latestState = null;
let context = loadContext();
let spots = [];
let workedTodayByCallPark = new Map();
let workedStatus = {
  loaded: false,
  error: "",
  count: 0
};
let workedLoadedAt = 0;
let loadedSpotKey = "";
let loadingSpotKey = "";
let spotRequestId = 0;
let modeFilterUserSelected = false;
const todayAdifDate = formatUtcDate(new Date());
const WORKED_CACHE_MS = 5 * 60_000;

modeFilterSelect.addEventListener("change", () => {
  modeFilterUserSelected = true;
  handleModeFilterChange();
});
includeQrtToggle.addEventListener("change", () => loadPotaSpots({ force: true, showLoading: true }));
refreshButton.addEventListener("click", () => loadPotaSpots({ force: true, showLoading: spots.length === 0 }));
closeButton.addEventListener("click", () => window.close());
spotList.addEventListener("click", handleSpotClick);
window.addEventListener("message", handleParentMessage);
if (embeddedPota) {
  closeButton.hidden = true;
}

connectWebSocket();
syncModeFilterToContext();
renderBandSummary();
await loadPotaSpots({ force: true, showLoading: true });

function handleParentMessage(event) {
  if (event.origin !== location.origin || event.data?.type !== "potaContext") {
    return;
  }

  context = event.data.context ?? loadContext();
  syncModeFilterToContext();
  renderBandSummary();
  void loadPotaSpots({ showLoading: loadedSpotKey !== spotRequestKey() });
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
    }
  });
  socket.addEventListener("close", () => {
    setTimeout(connectWebSocket, 1200);
  });
}

async function loadPotaSpots(options = {}) {
  const { force = false, showLoading = spots.length === 0 } = options;
  const requestKey = spotRequestKey();
  if (!force && (loadingSpotKey === requestKey || loadedSpotKey === requestKey)) {
    return;
  }

  const requestId = ++spotRequestId;
  loadingSpotKey = requestKey;
  refreshButton.disabled = true;
  if (showLoading) {
    renderLoading();
  }
  try {
    const bandId = encodeURIComponent(activeBandId());
    const includeQrt = includeQrtToggle.checked ? "true" : "false";
    const response = await fetch(`/api/pota/spots?bandId=${bandId}&includeQrt=${includeQrt}`);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "POTA fetch failed");
    }
    if (requestId !== spotRequestId) return;
    await loadWorkedContacts();
    if (requestId !== spotRequestId) return;
    spots = data.spots ?? [];
    context = {
      ...context,
      state: {
        ...(context.state ?? {}),
        bandId: data.band?.id ?? activeBandId(),
        bandName: data.band?.name ?? context.state?.bandName,
        scanRange: data.band?.scanRange ?? context.state?.scanRange
      }
    };
    renderBandSummary(data.band);
    renderSpots(filteredSpots(), data);
    loadedSpotKey = requestKey;
    setStatus(formatSpotCount(filteredSpots().length, spots.length));
    if (workedStatus.error) {
      noticeText.textContent = `Current activator spots for this band. Worked indicators unavailable: ${workedStatus.error}`;
    }
  } catch (error) {
    if (requestId !== spotRequestId) return;
    spots = [];
    renderEmpty(error.message);
    setStatus("POTA failed");
  } finally {
    if (requestId === spotRequestId) {
      loadingSpotKey = "";
      refreshButton.disabled = false;
    }
  }
}

async function loadWorkedContacts() {
  if (workedStatus.loaded && Date.now() - workedLoadedAt < WORKED_CACHE_MS) {
    return;
  }

  try {
    const response = await fetch("/api/qrz/logbook?range=all&max=250&maxPages=40");
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.reason ?? "QRZ logbook unavailable");
    }

    buildWorkedIndexes(data.records ?? []);
    workedStatus = {
      loaded: true,
      error: "",
      count: data.records?.length ?? 0
    };
    workedLoadedAt = Date.now();
  } catch (error) {
    workedTodayByCallPark = new Map();
    workedStatus = {
      loaded: false,
      error: error.message,
      count: 0
    };
  }
}

function spotRequestKey() {
  return `${activeBandId()}:${includeQrtToggle.checked ? "qrt" : "active"}`;
}

function handleModeFilterChange() {
  renderSpots(filteredSpots(), { total: spots.length });
  setStatus(formatSpotCount(filteredSpots().length, spots.length));
}

function filteredSpots() {
  return spots.filter(matchesModeFilter);
}

function selectedPotaMode() {
  return String(modeFilterSelect.value || "ALL").toUpperCase();
}

function syncModeFilterToContext() {
  if (modeFilterUserSelected) {
    return;
  }

  const mode = normalizePotaMode(context.state?.mode);
  if (["AM", "USB", "LSB"].includes(mode)) {
    modeFilterSelect.value = mode;
  } else if (mode === "SSB") {
    modeFilterSelect.value = "SSB";
  }
}

function matchesModeFilter(spot) {
  const selected = selectedPotaMode();
  const mode = normalizePotaMode(spot.mode);
  if (selected === "ALL") {
    return true;
  }
  if (selected === "SSB") {
    return mode === "SSB" || mode === "USB" || mode === "LSB";
  }
  if (selected === "USB" || selected === "LSB") {
    return mode === selected || mode === "SSB";
  }
  if (selected === "DIGI") {
    return ["DATA", "DIGI", "DIGITAL", "FT4", "FT8", "JS8", "RTTY", "PSK31"].includes(mode);
  }
  return mode === selected;
}

function normalizePotaMode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function workingModeForSpot(spot) {
  const selected = selectedPotaMode();
  const spotMode = normalizePotaMode(spot.mode);
  if (["AM", "USB", "LSB", "FM", "CW"].includes(selected)) {
    return selected;
  }
  if (selected === "SSB" && (spotMode === "USB" || spotMode === "LSB")) {
    return spotMode;
  }
  return spotMode || latestState?.mode || context.state?.mode || "";
}

function displayModeForSpot(spot) {
  const spotMode = normalizePotaMode(spot.mode);
  const workingMode = workingModeForSpot(spot);
  if (spotMode && workingMode && spotMode !== workingMode && spotMode === "SSB") {
    return `${spotMode} -> ${workingMode}`;
  }
  return spotMode || workingMode || "--";
}

function formatSpotCount(filteredCount, totalCount) {
  const selected = selectedPotaMode();
  if (selected === "ALL" || filteredCount === totalCount) {
    return `${filteredCount} spots`;
  }
  return `${filteredCount}/${totalCount} ${selected} spots`;
}

function renderBandSummary(band = null) {
  const profile = band ?? context.state ?? {};
  const range = profile.scanRange;
  bandSummary.textContent = range
    ? `${profile.name ?? profile.bandName ?? "Band"} ${formatFrequency(range.startHz)}-${formatFrequency(range.endHz)}`
    : `${profile.bandName ?? profile.bandId ?? "Current band"} spots`;
}

function renderLoading() {
  spotList.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = "Loading current POTA activations...";
  spotList.append(empty);
}

function renderEmpty(message) {
  spotList.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = message;
  spotList.append(empty);
}

function renderSpots(nextSpots, data) {
  spotList.replaceChildren();
  if (nextSpots.length === 0) {
    if (spots.length > 0 && selectedPotaMode() !== "ALL") {
      renderEmpty(`No ${selectedPotaMode()} POTA spots inside this band range. ${spots.length} spots hidden by the mode filter.`);
    } else {
      renderEmpty(includeQrtToggle.checked
        ? `No current POTA spots inside this band range. POTA returned ${data.total ?? 0} total spots.`
        : "No non-QRT POTA spots inside this band range.");
    }
    return;
  }

  for (const spot of nextSpots) {
    const worked = workedStatusForSpot(spot);
    const row = document.createElement("section");
    row.className = "pota-row";
    row.classList.toggle("worked-exact", Boolean(worked));
    row.innerHTML = `
      <div class="pota-main">
        <div class="pota-title">
          <strong>${escapeHtml(spot.activator || "--")}</strong>
          ${worked ? `<span class="pota-worked-badge exact">${escapeHtml(worked.label)}</span>` : ""}
        </div>
        <span>${escapeHtml(spot.reference || "--")} ${spot.parkName ? `- ${escapeHtml(spot.parkName)}` : ""}</span>
        <small>${escapeHtml(spot.locationDesc || "")} ${spot.comments ? `| ${escapeHtml(spot.comments)}` : ""}</small>
        ${worked?.detail ? `<small class="pota-worked-detail">${escapeHtml(worked.detail)}</small>` : ""}
      </div>
      <div class="pota-meta">
        <strong>${escapeHtml(spot.displayFrequency)}</strong>
        <span>${escapeHtml(displayModeForSpot(spot))} ${spot.qrt ? "| QRT" : ""}</span>
        <small>${formatAge(spot.ageMinutes)} | spots ${spot.count ?? 0}</small>
      </div>
      <div class="pota-actions">
        <a href="https://pota.app/#/park/${encodeURIComponent(spot.reference)}" target="_blank" rel="noreferrer">Park</a>
        <button type="button" data-spot-respot-id="${escapeHtml(spot.id)}">Respot</button>
        <button type="button" data-spot-tune-id="${escapeHtml(spot.id)}">Tune</button>
        <button type="button" class="mini-log-button" data-spot-log-id="${escapeHtml(spot.id)}">Log</button>
      </div>
    `;
    spotList.append(row);
  }
}

function buildWorkedIndexes(records) {
  workedTodayByCallPark = new Map();

  for (const record of records ?? []) {
    if (normalizeAdifDate(record.qso_date) !== todayAdifDate) {
      continue;
    }

    const call = normalizeCall(record.call);
    if (!call) {
      continue;
    }

    const worked = {
      call,
      qsoDate: record.qso_date ?? "",
      timeOn: record.time_on ?? "",
      freq: record.freq ?? "",
      timestamp: recordTimestamp(record)
    };

    for (const park of extractParkReferences(record)) {
      setLatestWorked(workedTodayByCallPark, `${call}:${park}`, {
        ...worked,
        park
      });
    }
  }
}

function setLatestWorked(map, key, worked) {
  const previous = map.get(key);
  if (!previous || worked.timestamp >= previous.timestamp) {
    map.set(key, worked);
  }
}

function workedStatusForSpot(spot) {
  if (!workedStatus.loaded) {
    return null;
  }

  const call = normalizeCall(spot.activator);
  const park = normalizeParkReference(spot.reference);
  if (!call) {
    return null;
  }

  const exact = park ? workedTodayByCallPark.get(`${call}:${park}`) : null;
  if (exact) {
    return {
      kind: "exact",
      label: "Worked today",
      detail: workedDetail(exact)
    };
  }

  return null;
}

function workedDetail(worked) {
  const time = formatAdifTime(worked.timeOn);
  const freq = worked.freq ? `${worked.freq} MHz` : "";
  return [`Today`, time, freq].filter(Boolean).join(" ");
}

function handleSpotClick(event) {
  const tuneButton = event.target.closest("[data-spot-tune-id]");
  const logButton = event.target.closest("[data-spot-log-id]");
  const respotButton = event.target.closest("[data-spot-respot-id]");
  const id = tuneButton?.dataset.spotTuneId ?? logButton?.dataset.spotLogId ?? respotButton?.dataset.spotRespotId;
  if (!id) {
    return;
  }
  const spot = spots.find((candidate) => String(candidate.id) === String(id));
  if (!spot) {
    return;
  }
  if (logButton) {
    logSpot(spot);
    return;
  }
  if (respotButton) {
    respotSpot(spot);
    return;
  }

  tuneSpot(spot);
}

async function respotSpot(spot) {
  const summary = [
    spot.activator,
    spot.reference,
    spot.displayFrequency,
    spot.mode,
    spot.comments
  ].filter(Boolean).join(" ");

  try {
    await navigator.clipboard?.writeText(summary);
    noticeText.textContent = `Copied respot details for ${spot.activator} at ${spot.reference}; finish the respot on POTA.`;
  } catch {
    noticeText.textContent = `Open POTA and respot ${spot.activator} at ${spot.reference} on ${spot.displayFrequency}.`;
  }

  window.open("https://pota.app/", "pota-app", "noopener,noreferrer");
  setStatus("POTA opened");
}

function tuneSpot(spot) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setStatus("CAT link not ready");
    return;
  }
  rememberPotaSpot(spot);
  socket.send(JSON.stringify({
    type: "setFrequency",
    bandId: activeBandId(),
    hz: spot.hz
  }));
  noticeText.textContent = `Tuned VFO-A to ${spot.displayFrequency} for ${spot.activator} at ${spot.reference}.`;
  setStatus("Tune command sent");
}

function logSpot(spot) {
  rememberPotaSpot(spot);
  const draft = {
    state: contactStateFromSpot(spot),
    openedAt: Date.now()
  };
  localStorage.setItem("yeasuCatContactDraft", JSON.stringify(draft));

  if (embeddedPota && window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "openContactLogger",
      draft
    }, location.origin);
    setStatus("Logger tab opened");
    noticeText.textContent = `Sent ${spot.activator || "activation"} at ${spot.reference || "park"} to the Logger tab.`;
    return;
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type: "openContactLogger",
      draft
    }, location.origin);
    window.opener.focus();
    setStatus("Logger tab opened");
    noticeText.textContent = `Sent ${spot.activator || "activation"} at ${spot.reference || "park"} to the Logger tab.`;
    return;
  }

  window.location.href = "/#logger";
}

function rememberPotaSpot(spot) {
  localStorage.setItem("yeasuCatLastPotaSpot", JSON.stringify({
    activator: spot.activator ?? "",
    reference: spot.reference ?? "",
    parkName: spot.parkName ?? "",
    mode: workingModeForSpot(spot),
    hz: spot.hz,
    displayFrequency: spot.displayFrequency ?? "",
    savedAt: Date.now()
  }));
}

function contactStateFromSpot(spot) {
  const bandId = activeBandId();
  const frequencyMhz = Number.isInteger(spot.hz)
    ? (spot.hz / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
    : "";
  return {
    connected: latestState?.status === "connected",
    bandId,
    band: bandId,
    bandName: context.state?.bandName ?? latestState?.band?.name ?? bandId,
    adifBand: bandIdToAdifBand(bandId),
    hz: spot.hz,
    frequency: spot.displayFrequency ?? formatFrequency(spot.hz),
    frequencyMhz,
    mode: workingModeForSpot(spot),
    qth: [spot.reference, spot.parkName].filter(Boolean).join(" - "),
    sig: "POTA",
    sigInfo: spot.reference ?? "",
    potaSpot: {
      activator: spot.activator ?? "",
      reference: spot.reference ?? "",
      parkName: spot.parkName ?? "",
      locationDesc: spot.locationDesc ?? "",
      comments: spot.comments ?? ""
    }
  };
}

function activeBandId() {
  return context.state?.bandId ?? latestState?.band?.id ?? "10m";
}

function loadContext() {
  try {
    return JSON.parse(localStorage.getItem("yeasuCatPotaContext") ?? "{}");
  } catch {
    return {};
  }
}

function setStatus(text) {
  statusText.textContent = text;
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

function formatAge(minutes) {
  if (!Number.isFinite(minutes)) {
    return "freshness unknown";
  }
  if (minutes < 1) {
    return "just now";
  }
  return `${minutes} min ago`;
}

function normalizeCall(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeAdifDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length === 8 ? clean : "";
}

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function extractParkReferences(record = {}) {
  const values = [
    record.app_yeasu_cat_pota_location,
    record.pota_ref,
    record.sig_info,
    record.comment,
    record.notes
  ];
  const references = [];
  for (const value of values) {
    const matches = String(value ?? "").toUpperCase().match(/[A-Z]{2,4}-\d{4,5}/g) ?? [];
    references.push(...matches.map(normalizeParkReference).filter(Boolean));
  }
  return [...new Set(references)];
}

function normalizeParkReference(value) {
  const match = String(value ?? "").trim().toUpperCase().match(/[A-Z]{2,4}-\d{4,5}/);
  return match?.[0] ?? "";
}

function recordTimestamp(record = {}) {
  const cleanDate = normalizeAdifDate(record.qso_date);
  if (!cleanDate) {
    return 0;
  }

  const cleanTime = String(record.time_on ?? "").replace(/\D/g, "").padEnd(4, "0");
  const date = new Date(Date.UTC(
    Number(cleanDate.slice(0, 4)),
    Number(cleanDate.slice(4, 6)) - 1,
    Number(cleanDate.slice(6, 8)),
    Number(cleanTime.slice(0, 2)),
    Number(cleanTime.slice(2, 4))
  ));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatAdifTime(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length < 4) {
    return "--";
  }
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}Z`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
