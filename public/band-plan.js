// U.S. Amateur Extra phone ranges for the console's normal VFO operation.
// 47 CFR 97.301, 97.305 and 97.307(f)(11); the lower 40 m phone window
// is not available at this station's location.
export const EXTRA_PHONE_BANDS = Object.freeze([
  { id: "160m", name: "160 Meter", startHz: 1_800_000, endHz: 2_000_000, centerHz: 1_900_000, mode: "LSB" },
  { id: "75m", name: "75 Meter", startHz: 3_600_000, endHz: 4_000_000, centerHz: 3_800_000, mode: "LSB", adifBand: "80m" },
  { id: "40m", name: "40 Meter", startHz: 7_125_000, endHz: 7_300_000, centerHz: 7_200_000, mode: "LSB" },
  { id: "20m", name: "20 Meter", startHz: 14_150_000, endHz: 14_350_000, centerHz: 14_250_000, mode: "USB" },
  { id: "17m", name: "17 Meter", startHz: 18_110_000, endHz: 18_168_000, centerHz: 18_140_000, mode: "USB" },
  { id: "15m", name: "15 Meter", startHz: 21_200_000, endHz: 21_450_000, centerHz: 21_325_000, mode: "USB" },
  { id: "12m", name: "12 Meter", startHz: 24_930_000, endHz: 24_990_000, centerHz: 24_960_000, mode: "USB" },
  { id: "10m-extra", name: "10 Meter (Extra)", startHz: 28_300_000, endHz: 29_700_000, centerHz: 28_400_000, mode: "USB", adifBand: "10m" }
]);

export function bandIdToAdifBand(id) {
  if (id === "cb") return "11m";
  if (id === "10m" || id === "6m") return id;
  const band = EXTRA_PHONE_BANDS.find((entry) => entry.id === id);
  return band?.adifBand ?? band?.id ?? "";
}
