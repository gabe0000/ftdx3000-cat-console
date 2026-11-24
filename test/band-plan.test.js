import test from "node:test";
import assert from "node:assert/strict";
import { EXTRA_PHONE_BANDS, bandIdToAdifBand } from "../public/band-plan.js";
import { canSyncRangeReadback } from "../public/range-readback.js";

test("extra phone presets use local phone windows, not whole band allocations", () => {
  assert.deepEqual(EXTRA_PHONE_BANDS.map(({ id, startHz, endHz }) => [id, startHz, endHz]), [
    ["160m", 1_800_000, 2_000_000],
    ["75m", 3_600_000, 4_000_000],
    ["40m", 7_125_000, 7_300_000],
    ["20m", 14_150_000, 14_350_000],
    ["17m", 18_110_000, 18_168_000],
    ["15m", 21_200_000, 21_450_000],
    ["12m", 24_930_000, 24_990_000],
    ["10m-extra", 28_300_000, 29_700_000]
  ]);
  for (const { startHz, endHz, centerHz } of EXTRA_PHONE_BANDS) {
    assert.ok(startHz < centerHz && centerHz < endHz);
  }
});

test("band profile variants preserve their canonical logging bands", () => {
  assert.equal(bandIdToAdifBand("75m"), "80m");
  assert.equal(bandIdToAdifBand("10m-extra"), "10m");
  assert.equal(bandIdToAdifBand("20m"), "20m");
  assert.equal(bandIdToAdifBand("cb"), "11m");
  assert.equal(bandIdToAdifBand("unknown"), "");
});

test("RF gain readback resumes after a write without requiring slider blur", () => {
  const focusedSlider = { matches: (selector) => selector === ":focus" };
  const draggingSlider = { matches: (selector) => selector === ":active" };
  assert.equal(canSyncRangeReadback(focusedSlider, 1000, 1100), false);
  assert.equal(canSyncRangeReadback(focusedSlider, 1000, 1250), true);
  assert.equal(canSyncRangeReadback(draggingSlider, 1000, 2000), false);
});
