let settings = {};
try {
  const response = await fetch("/station-settings.local.json", { cache: "no-store" });
  if (response.ok) settings = (await response.json()) ?? {};
} catch {
  // A fresh install has no local station settings.
}

export const stationCallsign = String(settings.callsign ?? "").trim().toUpperCase();
export const cbStationId = String(settings.cbStationId ?? "").trim();
const grid = String(settings.grid ?? "").trim().toUpperCase();

for (const node of document.querySelectorAll("[data-station-call]")) {
  node.textContent = stationCallsign || "LOCAL";
}
for (const node of document.querySelectorAll("[data-station-grid]")) {
  node.textContent = grid;
  node.closest(".station-grid-square").hidden = !grid;
}
for (const node of document.querySelectorAll("[data-journal-station]")) {
  if (stationCallsign) node.textContent = `Stamped notes for ${stationCallsign}`;
}
