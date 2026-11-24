import assert from "node:assert/strict";
import test from "node:test";
import {
  filterPotaSpotsForRange,
  formatPotaFrequency,
  normalizePotaSpot,
  potaFrequencyToHz
} from "../src/pota.js";

test("converts POTA kHz spot frequencies to hertz", () => {
  assert.equal(potaFrequencyToHz("14334"), 14_334_000);
  assert.equal(potaFrequencyToHz("28385.5"), 28_385_500);
  assert.equal(formatPotaFrequency(28_385_500), "28.385.500");
});

test("normalizes a POTA spot", () => {
  const spot = normalizePotaSpot({
    spotId: 1,
    activator: "k4dwk",
    frequency: "14334",
    mode: "SSB",
    reference: "US-2905",
    name: "Lee State Park",
    spotTime: "2026-05-30T19:32:45",
    comments: "57 into Ohio",
    count: 5,
    expire: 1218
  });

  assert.equal(spot.activator, "K4DWK");
  assert.equal(spot.hz, 14_334_000);
  assert.equal(spot.displayFrequency, "14.334.000");
  assert.equal(spot.qrt, false);
  assert.equal(spot.reference, "US-2905");
});

test("filters POTA spots to the selected band range and hides QRT by default", () => {
  const spots = [
    normalizePotaSpot({ spotId: 1, activator: "A", frequency: "28385", mode: "SSB", reference: "US-0001", spotTime: "2026-05-30T19:32:45", comments: "" }),
    normalizePotaSpot({ spotId: 2, activator: "B", frequency: "14334", mode: "SSB", reference: "US-0002", spotTime: "2026-05-30T19:34:45", comments: "" }),
    normalizePotaSpot({ spotId: 3, activator: "C", frequency: "28450", mode: "SSB", reference: "US-0003", spotTime: "2026-05-30T19:35:45", comments: "", qrt: true })
  ];
  const range = { startHz: 28_300_000, endHz: 28_500_000 };

  assert.deepEqual(filterPotaSpotsForRange(spots, range).map((spot) => spot.activator), ["A"]);
  assert.deepEqual(filterPotaSpotsForRange(spots, range, { includeQrt: true }).map((spot) => spot.activator), ["C", "A"]);
});

test("keeps active POTA spots with QRT text in comments", () => {
  const spot = normalizePotaSpot({
    spotId: 4,
    activator: "NP4IA",
    frequency: "28380",
    mode: "SSB",
    reference: "PR-0022",
    spotTime: "2026-06-01T21:20:18",
    comments: "qrt",
    invalid: null
  });
  const range = { startHz: 28_300_000, endHz: 28_500_000 };

  assert.equal(spot.hz, 28_380_000);
  assert.equal(spot.qrt, false);
  assert.deepEqual(filterPotaSpotsForRange([spot], range).map((candidate) => candidate.activator), ["NP4IA"]);
});
