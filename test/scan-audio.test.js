import assert from "node:assert/strict";
import test from "node:test";
import {
  CB_REGULAR_AUDIO_BLIP_QUIET_PASSES,
  CB_REGULAR_AUDIO_CLEAR_MS,
  CB_REGULAR_AUDIO_MAX_DWELL_MS,
  CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT,
  CB_REGULAR_AUDIO_SCAN_DWELL_MS,
  adaptCbRegularAudioDwell,
  regularAudioScanDwellMs,
  shouldBacktrackCbRegularAudioTarget,
  shouldHoldCbRegularAudioScan
} from "../src/scanAudio.js";

test("CB regular scan holds on 25 percent or stronger RX audio", () => {
  assert.equal(CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT, 25);
  assert.equal(CB_REGULAR_AUDIO_CLEAR_MS, 500);
  assert.equal(shouldHoldCbRegularAudioScan({ bandId: "cb", intent: "regular", levelPercent: 24.9 }), false);
  assert.equal(shouldHoldCbRegularAudioScan({ bandId: "cb", intent: "regular", levelPercent: 25 }), true);
  assert.equal(shouldHoldCbRegularAudioScan({ bandId: "10m", intent: "regular", levelPercent: 80 }), false);
  assert.equal(shouldHoldCbRegularAudioScan({ bandId: "cb", intent: "smart", levelPercent: 80 }), false);
});

test("CB regular scan auto uses the fast audio-safe dwell", () => {
  assert.equal(CB_REGULAR_AUDIO_SCAN_DWELL_MS, 5);
  assert.equal(regularAudioScanDwellMs({ bandId: "cb", intent: "regular", requestedDwellMs: 200 }), 5);
  assert.equal(regularAudioScanDwellMs({ bandId: "10m", intent: "regular", requestedDwellMs: 200 }), 200);
  assert.equal(regularAudioScanDwellMs({ bandId: "cb", intent: "smart", requestedDwellMs: 200 }), 200);
});

test("CB regular scan dwell adapts after false and good stops", () => {
  const firstMiss = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 5,
    outcome: "falseStop"
  });
  assert.equal(firstMiss.dwellMs, 10);
  assert.equal(firstMiss.adaptive.falseStops, 1);

  const secondMiss = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 10,
    adaptive: firstMiss.adaptive,
    outcome: "falseStop"
  });
  assert.equal(secondMiss.dwellMs, 20);
  assert.equal(secondMiss.adaptive.falseStops, 2);

  const quietOne = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 20,
    adaptive: secondMiss.adaptive,
    outcome: "quietPass"
  });
  assert.equal(CB_REGULAR_AUDIO_BLIP_QUIET_PASSES, 2);
  assert.equal(quietOne.dwellMs, 20);
  assert.equal(quietOne.adaptive.quietPasses, 1);

  const quietTwo = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 20,
    adaptive: quietOne.adaptive,
    outcome: "quietPass"
  });
  assert.equal(quietTwo.dwellMs, CB_REGULAR_AUDIO_SCAN_DWELL_MS);
  assert.equal(quietTwo.adaptive.falseStops, 0);
  assert.equal(quietTwo.adaptive.quietPasses, 0);

  const goodOne = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 60,
    adaptive: secondMiss.adaptive,
    outcome: "goodStop"
  });
  assert.equal(goodOne.dwellMs, 30);

  const goodTwo = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 30,
    adaptive: goodOne.adaptive,
    outcome: "goodStop"
  });
  assert.equal(goodTwo.dwellMs, 15);

  const capped = adaptCbRegularAudioDwell({
    bandId: "cb",
    intent: "regular",
    currentDwellMs: 999,
    outcome: "falseStop"
  });
  assert.equal(capped.dwellMs, CB_REGULAR_AUDIO_MAX_DWELL_MS);
});

test("CB regular scan backtracks one channel for early audio hits", () => {
  assert.equal(shouldBacktrackCbRegularAudioTarget({
    bandId: "cb",
    intent: "regular",
    scanMode: "channels",
    levelPercent: 35,
    sampleAgeMs: 40,
    previousTarget: { hz: 27_025_000 }
  }), true);
  assert.equal(shouldBacktrackCbRegularAudioTarget({
    bandId: "cb",
    intent: "regular",
    scanMode: "channels",
    levelPercent: 35,
    sampleAgeMs: 400,
    previousTarget: { hz: 27_025_000 }
  }), false);
  assert.equal(shouldBacktrackCbRegularAudioTarget({
    bandId: "cb",
    intent: "regular",
    scanMode: "frequency",
    levelPercent: 35,
    sampleAgeMs: 40,
    previousTarget: { hz: 27_025_000 }
  }), false);
});
