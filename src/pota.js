import { hzToMhz } from "./qrz.js";

export const POTA_SPOTS_ENDPOINT = "https://api.pota.app/spot/activator";
export const POTA_USER_AGENT = "FTdx3000CatConsole/0.1.0 (local POTA spot browser)";

export async function fetchPotaSpots({ fetchImpl = fetch } = {}) {
  const response = await fetchImpl(POTA_SPOTS_ENDPOINT, {
    headers: {
      "accept": "application/json",
      "user-agent": POTA_USER_AGENT
    }
  });
  if (!response.ok) {
    throw new Error(`POTA spots request failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePotaSpot).filter(Boolean) : [];
}

export function normalizePotaSpot(spot) {
  const hz = potaFrequencyToHz(spot?.frequency);
  if (!Number.isInteger(hz)) {
    return null;
  }

  const comments = String(spot?.comments ?? "").trim();
  const spotTime = normalizePotaSpotTime(spot?.spotTime);
  return {
    id: Number(spot?.spotId) || `${spot?.activator ?? "spot"}-${spot?.reference ?? ""}-${hz}`,
    activator: String(spot?.activator ?? "").trim().toUpperCase(),
    spotter: String(spot?.spotter ?? "").trim().toUpperCase(),
    reference: String(spot?.reference ?? "").trim().toUpperCase(),
    parkName: String(spot?.name ?? spot?.parkName ?? "").trim(),
    locationDesc: String(spot?.locationDesc ?? "").trim(),
    mode: String(spot?.mode ?? "").trim().toUpperCase(),
    source: String(spot?.source ?? "").trim(),
    comments,
    frequency: String(spot?.frequency ?? "").trim(),
    hz,
    mhz: hzToMhz(hz),
    displayFrequency: formatPotaFrequency(hz),
    spotTime,
    ageMinutes: spotTime ? Math.max(0, Math.round((Date.now() - spotTime.getTime()) / 60_000)) : null,
    expireSeconds: Number.isFinite(Number(spot?.expire)) ? Number(spot.expire) : null,
    count: Number.isFinite(Number(spot?.count)) ? Number(spot.count) : 0,
    invalid: spot?.invalid ?? null,
    qrt: Boolean(spot?.qrt),
    latitude: finiteOrNull(spot?.latitude),
    longitude: finiteOrNull(spot?.longitude),
    grid4: String(spot?.grid4 ?? "").trim().toUpperCase(),
    grid6: String(spot?.grid6 ?? "").trim().toUpperCase()
  };
}

export function filterPotaSpotsForRange(spots, range, { includeQrt = false } = {}) {
  return (spots ?? [])
    .filter((spot) => Number.isInteger(spot.hz))
    .filter((spot) => !spot.invalid)
    .filter((spot) => includeQrt || !spot.qrt)
    .filter((spot) => !range || (spot.hz >= range.startHz && spot.hz <= range.endHz))
    .sort((left, right) => {
      const leftTime = left.spotTime?.getTime() ?? 0;
      const rightTime = right.spotTime?.getTime() ?? 0;
      return rightTime - leftTime;
    });
}

export function potaFrequencyToHz(frequency) {
  const number = Number(String(frequency ?? "").trim());
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return Math.round(number * 1000);
}

export function formatPotaFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "--.---.---";
  }
  const mhz = Math.floor(hz / 1_000_000);
  const khz = Math.floor((hz % 1_000_000) / 1_000);
  const rest = hz % 1_000;
  return `${mhz}.${String(khz).padStart(3, "0")}.${String(rest).padStart(3, "0")}`;
}

function normalizePotaSpotTime(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }
  const timestamp = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
