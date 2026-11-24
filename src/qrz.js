export const QRZ_LOGBOOK_ENDPOINT = "https://logbook.qrz.com/api";
export const QRZ_XML_ENDPOINT = "https://xmldata.qrz.com/xml/current/";
export const QRZ_USER_AGENT = "FTdx3000CatConsole/0.1.0 (local QRZ logbook)";

const QRZ_KEY_PATTERN = /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/i;
const MAX_FETCH_RECORDS = 250;
const QRZ_XML_SESSION_RETRY_ERRORS = [/session/i, /key/i, /login/i];
const CB_MIN_MHZ = 26.965;
const CB_MAX_MHZ = 27.405;

export function getQrzLogbookKey(env = process.env) {
  const key = String(env.QRZ_LOGBOOK_KEY ?? "").trim();
  return QRZ_KEY_PATTERN.test(key) ? key.toUpperCase() : "";
}

export function getQrzPublicConfig(env = process.env) {
  return {
    configured: Boolean(getQrzLogbookKey(env)),
    xmlLookupConfigured: Boolean(getQrzXmlCredentials(env).configured),
    endpoint: QRZ_LOGBOOK_ENDPOINT,
    xmlEndpoint: QRZ_XML_ENDPOINT,
    userAgent: QRZ_USER_AGENT
  };
}

export function getQrzXmlCredentials(env = process.env) {
  const username = String(env.QRZ_XML_USERNAME ?? env.QRZ_USERNAME ?? "").trim();
  const password = String(env.QRZ_XML_PASSWORD ?? env.QRZ_PASSWORD ?? "").trim();
  return {
    username,
    password,
    configured: Boolean(username && password)
  };
}

export async function qrzLogbookRequest({
  key,
  action,
  adif = null,
  option = null,
  logids = null,
  fetchImpl = fetch
}) {
  if (!key) {
    throw new Error("QRZ logbook key is not configured.");
  }

  const body = new URLSearchParams();
  body.set("KEY", key);
  body.set("ACTION", String(action ?? "").toUpperCase());
  if (adif) {
    body.set("ADIF", adif);
  }
  if (option) {
    body.set("OPTION", option);
  }
  if (logids) {
    body.set("LOGIDS", Array.isArray(logids) ? logids.join(",") : String(logids));
  }

  const response = await fetchImpl(QRZ_LOGBOOK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": QRZ_USER_AGENT
    },
    body
  });
  const text = await response.text();
  const parsed = parseQrzNameValueResponse(text);
  if (!response.ok) {
    throw new Error(parsed.REASON || `QRZ request failed with HTTP ${response.status}`);
  }

  return {
    ok: parsed.RESULT === "OK" || parsed.RESULT === "REPLACE",
    raw: text,
    ...parsed
  };
}

export function buildQrzContactAdif(input) {
  const contact = normalizeQrzContact(input);
  const fields = [
    ["station_callsign", contact.stationCallsign],
    ["call", contact.call],
    ["qso_date", contact.qsoDate],
    ["time_on", contact.timeOn],
    ["band", contact.band],
    ["freq", contact.freq],
    ["mode", contact.mode],
    ["submode", contact.submode],
    ["rst_sent", contact.rstSent],
    ["rst_rcvd", contact.rstRcvd],
    ["name", contact.name],
    ["qth", contact.qth],
    ["gridsquare", contact.grid],
    ["sig", contact.sig],
    ["sig_info", contact.sigInfo],
    ["app_yeasu_cat_pota_location", contact.potaLocation],
    ["comment", contact.comment],
    ["app_yeasu_cat_source", contact.source]
  ];

  return `${fields.map(([name, value]) => adifField(name, value)).join("")}<eor>`;
}

export function isCbQrzContact(input = {}) {
  const contact = normalizeQrzContact(input);
  const band = String(contact.band ?? input.band ?? input.bandId ?? "").trim().toLowerCase();
  const freq = Number(contact.freq ?? input.freq ?? input.frequencyMhz);
  return band === "11m"
    || band === "cb"
    || (Number.isFinite(freq) && freq >= CB_MIN_MHZ && freq <= CB_MAX_MHZ);
}

export function normalizeQrzContact(input = {}) {
  const now = new Date();
  const modeInfo = radioModeToAdif(input.mode ?? input.radioMode);
  const freq = normalizeFrequencyMhz(input.freq ?? input.frequencyMhz ?? hzToMhz(input.hz));
  const band = normalizeAdifValue(input.band) || bandFromFrequencyMhz(freq) || normalizeAdifValue(input.bandId);
  const potaLocation = normalizeAdifValue(input.potaLocation ?? input.pota ?? input.park);
  const potaReference = normalizePotaReference(input.sigInfo ?? input.sig_info ?? potaLocation);
  return {
    stationCallsign: normalizeCallsign(input.stationCallsign ?? input.myCallsign ?? input.myCall),
    call: normalizeCallsign(input.call ?? input.callsign),
    qsoDate: normalizeQsoDate(input.qsoDate ?? input.date ?? formatUtcDate(now)),
    timeOn: normalizeTimeOn(input.timeOn ?? input.time ?? formatUtcTime(now)),
    band,
    freq,
    mode: normalizeAdifValue(input.adifMode) || modeInfo.mode,
    submode: normalizeAdifValue(input.submode) || modeInfo.submode,
    rstSent: normalizeAdifValue(input.rstSent ?? "59"),
    rstRcvd: normalizeAdifValue(input.rstRcvd ?? "59"),
    name: normalizeAdifValue(input.name),
    qth: normalizeAdifValue(input.qth),
    grid: normalizeGrid(input.grid ?? input.gridsquare),
    sig: potaReference ? "POTA" : normalizeAdifValue(input.sig),
    sigInfo: potaReference || normalizeAdifValue(input.sigInfo ?? input.sig_info),
    potaLocation,
    comment: normalizeAdifValue(input.comment),
    source: normalizeAdifValue(input.source ?? "YEASU CAT")
  };
}

function normalizePotaReference(value) {
  const match = String(value ?? "").trim().toUpperCase().match(/[A-Z]{2,4}-\d{4,5}/);
  return match?.[0] ?? "";
}

export async function qrzXmlLogin({
  username,
  password,
  fetchImpl = fetch
}) {
  if (!username || !password) {
    throw new Error("QRZ XML username/password is not configured.");
  }

  const result = await qrzXmlRequest({
    params: {
      username,
      password,
      agent: QRZ_USER_AGENT
    },
    fetchImpl
  });
  const key = result.session?.Key ?? "";
  if (!key) {
    throw new Error(result.session?.Error || result.session?.Message || "QRZ XML login did not return a session key.");
  }

  return {
    key,
    count: result.session?.Count ?? "",
    subExp: result.session?.SubExp ?? "",
    message: result.session?.Message ?? ""
  };
}

export async function qrzXmlLookupCallsign({
  sessionKey,
  callsign,
  fetchImpl = fetch
}) {
  const call = normalizeCallsign(callsign);
  if (!sessionKey) {
    throw new Error("QRZ XML session key is missing.");
  }
  if (!call) {
    throw new Error("Enter a callsign to look up.");
  }

  const result = await qrzXmlRequest({
    params: {
      s: sessionKey,
      callsign: call
    },
    fetchImpl
  });
  const sessionError = result.session?.Error ?? "";
  if (sessionError) {
    const error = new Error(sessionError);
    error.retrySession = QRZ_XML_SESSION_RETRY_ERRORS.some((pattern) => pattern.test(sessionError));
    throw error;
  }
  if (!result.callsign?.call) {
    throw new Error(result.session?.Message || `QRZ did not return ${call}.`);
  }

  return normalizeQrzXmlCallsign(result.callsign);
}

export async function qrzXmlRequest({ params, fetchImpl = fetch }) {
  const url = new URL(QRZ_XML_ENDPOINT);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value != null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetchImpl(url, {
    headers: {
      "user-agent": QRZ_USER_AGENT
    }
  });
  const text = await response.text();
  const parsed = parseQrzXmlResponse(text);
  if (!response.ok) {
    throw new Error(parsed.session?.Error || `QRZ XML request failed with HTTP ${response.status}`);
  }

  return parsed;
}

export function parseQrzXmlResponse(xml) {
  return {
    session: parseXmlNodeFields(xml, "Session"),
    callsign: parseXmlNodeFields(xml, "Callsign")
  };
}

export function normalizeQrzXmlCallsign(record = {}) {
  const call = normalizeCallsign(record.call);
  const displayName = normalizeAdifValue(
    record.name_fmt
      || [record.fname, record.name].filter(Boolean).join(" ")
      || record.nickname
  );
  const city = normalizeAdifValue(record.addr2);
  const state = normalizeAdifValue(record.state);
  const country = normalizeAdifValue(record.country || record.land);
  const qth = normalizeAdifValue(
    [city, state].filter(Boolean).join(", ")
      || record.county
      || country
  );

  return {
    call,
    name: displayName,
    qth,
    grid: normalizeGrid(record.grid),
    city,
    state,
    country,
    county: normalizeAdifValue(record.county),
    lat: normalizeCoordinateString(record.lat),
    lon: normalizeCoordinateString(record.lon),
    geoloc: normalizeAdifValue(record.geoloc),
    nickname: normalizeAdifValue(record.nickname),
    qrzUrl: call ? `https://www.qrz.com/db/${encodeURIComponent(call)}` : "",
    raw: record
  };
}

export function validateQrzContact(input = {}) {
  const contact = normalizeQrzContact(input);
  const missing = [];
  for (const [key, label] of [
    ["stationCallsign", "my callsign"],
    ["call", "contact callsign"],
    ["qsoDate", "QSO date"],
    ["timeOn", "QSO time"],
    ["band", "band"],
    ["mode", "mode"]
  ]) {
    if (!contact[key]) {
      missing.push(label);
    }
  }

  return {
    contact,
    missing,
    valid: missing.length === 0
  };
}

export function parseQrzNameValueResponse(text) {
  const source = String(text ?? "");
  const keys = ["RESULT", "COUNT", "LOGID", "LOGIDS", "ADIF", "DATA", "REASON", "OPTION"];
  const matches = [];
  for (const key of keys) {
    const pattern = new RegExp(`(?:^|&)${key}=`, "g");
    let match = pattern.exec(source);
    while (match) {
      matches.push({
        key,
        start: match.index,
        valueStart: match.index + match[0].length
      });
      match = pattern.exec(source);
    }
  }

  matches.sort((left, right) => left.start - right.start);
  const result = {};
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const rawValue = source.slice(match.valueStart, next ? next.start : source.length);
    result[match.key] = decodeQrzResponseValue(rawValue);
  }

  return result;
}

export function parseAdifRecords(adif) {
  const records = [];
  let current = {};
  let index = 0;
  const text = String(adif ?? "");

  while (index < text.length) {
    const start = text.indexOf("<", index);
    if (start === -1) {
      break;
    }
    const end = text.indexOf(">", start + 1);
    if (end === -1) {
      break;
    }

    const header = text.slice(start + 1, end).trim();
    const [rawName, rawLength] = header.split(":");
    const name = rawName.toLowerCase();
    index = end + 1;

    if (name === "eor") {
      if (Object.keys(current).length > 0) {
        records.push(enrichQrzRecord(current));
      }
      current = {};
      continue;
    }
    if (name === "eoh") {
      current = {};
      continue;
    }

    const length = Number.parseInt(rawLength, 10);
    if (!Number.isFinite(length)) {
      continue;
    }

    current[name] = text.slice(index, index + length);
    index += length;
  }

  if (Object.keys(current).length > 0) {
    records.push(enrichQrzRecord(current));
  }

  return records;
}

export function buildFetchOption({ range = "all", max = MAX_FETCH_RECORDS, afterLogId = 0, today = new Date() } = {}) {
  const safeMax = Math.max(0, Math.min(MAX_FETCH_RECORDS, Number.parseInt(max, 10) || MAX_FETCH_RECORDS));
  const options = [`MAX:${safeMax}`, `AFTERLOGID:${Math.max(0, Number.parseInt(afterLogId, 10) || 0)}`, "TYPE:ADIF", "STATUS:ALL"];
  const dates = dateRangeForPreset(range, today);
  if (dates) {
    options.unshift(`BETWEEN:${dates.start}+${dates.end}`);
  }
  return options.join(";");
}

export function dateRangeForPreset(range, today = new Date()) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  if (range === "today") {
    return { start: formatIsoDate(start), end: formatIsoDate(end) };
  }
  if (range === "7d") {
    start.setUTCDate(start.getUTCDate() - 6);
    return { start: formatIsoDate(start), end: formatIsoDate(end) };
  }
  if (range === "30d") {
    start.setUTCDate(start.getUTCDate() - 29);
    return { start: formatIsoDate(start), end: formatIsoDate(end) };
  }
  return null;
}

export function adifDateForTimeZone(date = new Date(), timeZone = "UTC") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}${parts.month}${parts.day}`;
}

export function filterRecordsForLocalAdifDate(records, adifDate, timeZone = "UTC") {
  const targetDate = normalizeAdifDateOnly(adifDate);
  if (!targetDate) {
    return records ?? [];
  }

  return (records ?? []).filter((record) => recordLocalAdifDate(record, timeZone) === targetDate);
}

export function recordLocalAdifDate(record = {}, timeZone = "UTC") {
  const qsoDate = normalizeAdifDateOnly(record.qso_date);
  if (!qsoDate) {
    return "";
  }

  const timeOn = String(record.time_on ?? "").replace(/\D/g, "").padEnd(4, "0");
  const year = Number(qsoDate.slice(0, 4));
  const month = Number(qsoDate.slice(4, 6));
  const day = Number(qsoDate.slice(6, 8));
  const hour = Number(timeOn.slice(0, 2));
  const minute = Number(timeOn.slice(2, 4));
  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return qsoDate;
  }

  return adifDateForTimeZone(new Date(Date.UTC(year, month - 1, day, hour, minute)), timeZone);
}

export function availableQsoDates(records) {
  return [...new Set((records ?? [])
    .map((record) => normalizeAdifDateOnly(record.qso_date))
    .filter(Boolean))]
    .sort();
}

export function hzToMhz(hz) {
  const number = Number(hz);
  return Number.isFinite(number) && number > 0 ? (number / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

export function mhzToHz(mhz) {
  const number = Number(mhz);
  return Number.isFinite(number) && number > 0 ? Math.round(number * 1_000_000) : null;
}

export function bandFromFrequencyMhz(freq) {
  const mhz = Number(freq);
  if (!Number.isFinite(mhz)) {
    return "";
  }
  if (mhz >= 1.8 && mhz < 2) return "160m";
  if (mhz >= 3.5 && mhz < 4) return "80m";
  if (mhz >= 5.0 && mhz < 5.5) return "60m";
  if (mhz >= 7 && mhz < 7.3) return "40m";
  if (mhz >= 10.1 && mhz < 10.15) return "30m";
  if (mhz >= 14 && mhz < 14.35) return "20m";
  if (mhz >= 18.068 && mhz < 18.168) return "17m";
  if (mhz >= 21 && mhz < 21.45) return "15m";
  if (mhz >= 24.89 && mhz < 24.99) return "12m";
  if (mhz >= 28 && mhz < 29.7) return "10m";
  if (mhz >= 50 && mhz < 54) return "6m";
  if (mhz >= 26 && mhz < 28) return "11m";
  return "";
}

export function radioModeToAdif(mode) {
  const normalized = String(mode ?? "").trim().toUpperCase();
  if (normalized === "USB" || normalized === "LSB") {
    return { mode: "SSB", submode: normalized };
  }
  if (normalized === "AM") {
    return { mode: "AM", submode: "" };
  }
  return {
    mode: normalized || "SSB",
    submode: ""
  };
}

export function maidenheadToLatLon(grid) {
  const value = String(grid ?? "").trim().toUpperCase();
  if (!/^[A-R]{2}(?:[0-9]{2}(?:[A-X]{2}(?:[0-9]{2})?)?)?$/.test(value)) {
    return null;
  }

  let lon = (value.charCodeAt(0) - 65) * 20 - 180;
  let lat = (value.charCodeAt(1) - 65) * 10 - 90;
  let lonSize = 20;
  let latSize = 10;

  if (value.length >= 4) {
    lon += Number(value[2]) * 2;
    lat += Number(value[3]);
    lonSize = 2;
    latSize = 1;
  }
  if (value.length >= 6) {
    lon += (value.charCodeAt(4) - 65) * (5 / 60);
    lat += (value.charCodeAt(5) - 65) * (2.5 / 60);
    lonSize = 5 / 60;
    latSize = 2.5 / 60;
  }
  if (value.length >= 8) {
    lon += Number(value[6]) * (5 / 600);
    lat += Number(value[7]) * (2.5 / 600);
    lonSize = 5 / 600;
    latSize = 2.5 / 600;
  }

  return {
    lat: roundCoordinate(lat + latSize / 2),
    lon: roundCoordinate(lon + lonSize / 2)
  };
}

function enrichQrzRecord(record) {
  const logid = record.app_qrzlog_logid || record.logid || record.qrz_logid || "";
  const coordinates = coordinatesForRecord(record);
  return {
    ...record,
    logid,
    displayMode: record.submode || record.mode || "",
    qrzUrl: record.call ? `https://www.qrz.com/db/${encodeURIComponent(record.call)}` : "",
    coordinates
  };
}

function coordinatesForRecord(record) {
  const lat = parseCoordinate(record.lat || record.latitude);
  const lon = parseCoordinate(record.lon || record.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat: roundCoordinate(lat), lon: roundCoordinate(lon) };
  }
  return maidenheadToLatLon(record.gridsquare || record.grid_square || record.grid);
}

function parseCoordinate(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseXmlNodeFields(xml, nodeName) {
  const text = String(xml ?? "");
  const nodePattern = new RegExp(`<${nodeName}\\b[^>]*>([\\s\\S]*?)<\\/${nodeName}>`, "i");
  const nodeMatch = text.match(nodePattern);
  if (!nodeMatch) {
    return {};
  }

  const fields = {};
  const fieldPattern = /<([A-Za-z][A-Za-z0-9_.-]*)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let fieldMatch = fieldPattern.exec(nodeMatch[1]);
  while (fieldMatch) {
    fields[fieldMatch[1]] = decodeXmlText(fieldMatch[2]);
    fieldMatch = fieldPattern.exec(nodeMatch[1]);
  }
  return fields;
}

function decodeXmlText(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function decodeQrzResponseValue(value) {
  const plusDecoded = String(value ?? "").replace(/\+/g, " ");
  let urlDecoded = plusDecoded;
  try {
    urlDecoded = decodeURIComponent(plusDecoded);
  } catch {
    urlDecoded = plusDecoded;
  }

  return decodeXmlText(urlDecoded);
}

function adifField(name, value) {
  const safeValue = sanitizeAdifValue(value);
  if (!safeValue) {
    return "";
  }
  return `<${name}:${safeValue.length}>${safeValue}`;
}

function sanitizeAdifValue(value) {
  return String(value ?? "").trim().replace(/[<>]/g, "").replace(/\r?\n/g, " ");
}

function normalizeCallsign(value) {
  return normalizeAdifValue(value).toUpperCase();
}

function normalizeGrid(value) {
  return normalizeAdifValue(value).toUpperCase();
}

function normalizeAdifValue(value) {
  return sanitizeAdifValue(value);
}

function normalizeFrequencyMhz(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function normalizeCoordinateString(value) {
  const number = parseCoordinate(value);
  return Number.isFinite(number) ? String(roundCoordinate(number)) : "";
}

function normalizeQsoDate(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length === 8 ? clean : "";
}

function normalizeTimeOn(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length >= 6) {
    return clean.slice(0, 6);
  }
  return clean.length >= 4 ? clean.slice(0, 4) : "";
}

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatUtcTime(date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatIsoDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function normalizeAdifDateOnly(value) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return clean.length === 8 ? clean : "";
}

function normalizeTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return "UTC";
  }
}

function roundCoordinate(value) {
  return Math.round(value * 100000) / 100000;
}
