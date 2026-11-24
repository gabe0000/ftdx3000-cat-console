import assert from "node:assert/strict";
import test from "node:test";
import {
  SSB_HUNTER_DWELL_MS,
  SSB_HUNTER_ENVELOPE_BACKTRACK_FRACTION,
  SSB_HUNTER_ENVELOPE_FORWARD_FRACTION,
  SSB_HUNTER_ENVELOPE_MAX_SPAN_HZ,
  SSB_HUNTER_ENVELOPE_PAD_HZ,
  SSB_HUNTER_ENVELOPE_STEP_HZ,
  SSB_HUNTER_INITIAL_STEP_HZ,
  SSB_HUNTER_LOCK_MAX_MS,
  SSB_HUNTER_LOCK_MIN_MS,
  SSB_HUNTER_LOCK_MS,
  SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT,
  SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT,
  SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT,
  SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
  SSB_HUNTER_MIN_STEP_HZ,
  SSB_HUNTER_MIN_STEP_MISS_LIMIT,
  SSB_HUNTER_NOISE_FLOOR_MIN_POINTS,
  SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ,
  SSB_HUNTER_SIGNAL_LIFT_MIN_PERCENT,
  SSB_HUNTER_SKIP_SPAN_HZ,
  clampHunterRefineFrequency,
  createHunterEnvelope,
  createInitialHunterState,
  estimateHunterNoiseFloor,
  hunterInitialRefineStepForEnvelope,
  hunterDwellForStep,
  isMinimumHunterStep,
  nextHunterEnvelopeSurveyFrequency,
  nextHunterFrequency,
  nextHunterFrequencyNoWrap,
  normalizeHunterAudioThresholdPercent,
  normalizeHunterAudioLiftGatePercent,
  normalizeHunterLockMs,
  reduceHunterStep,
  scoreSsbHunterSamples,
  shouldLeaveHunterLock,
  updateHunterEnvelopeWithScore,
  updateHunterNoiseFloor
} from "../src/ssbHunter.js";

test("rejects a loud steady tone", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 74, voiceScore: 70, peakHz: 1000, centroidHz: 1010 },
    { levelPercent: 75, voiceScore: 71, peakHz: 1002, centroidHz: 1012 },
    { levelPercent: 73, voiceScore: 69, peakHz: 1001, centroidHz: 1011 },
    { levelPercent: 75, voiceScore: 70, peakHz: 1003, centroidHz: 1013 }
  ]);

  assert.equal(result.accepted, false);
  assert.equal(result.toneRejected, true);
  assert.equal(result.reason, "steady level");
});

test("accepts modulating audio", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 22, voiceScore: 62, peakHz: 620, centroidHz: 840 },
    { levelPercent: 42, voiceScore: 68, peakHz: 1280, centroidHz: 1460 },
    { levelPercent: 31, voiceScore: 66, peakHz: 940, centroidHz: 1180 },
    { levelPercent: 55, voiceScore: 75, peakHz: 1720, centroidHz: 2020 }
  ]);

  assert.equal(result.accepted, true);
  assert.equal(result.toneRejected, false);
  assert.equal(result.reason, "modulating RX level");
  assert.ok(result.score > 0);
});

test("rejects narrow tone-like audio even when level moves", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 18, voiceScore: 48, peakHz: 890, centroidHz: 930, lowRatio: 0.08, midRatio: 0.86, highRatio: 0.06, voiceTextureScore: 28, voiceSpread: 0.33, voicePeakToMean: 2.8 },
    { levelPercent: 38, voiceScore: 50, peakHz: 1060, centroidHz: 1090, lowRatio: 0.07, midRatio: 0.88, highRatio: 0.05, voiceTextureScore: 30, voiceSpread: 0.33, voicePeakToMean: 3.1 },
    { levelPercent: 21, voiceScore: 49, peakHz: 900, centroidHz: 940, lowRatio: 0.08, midRatio: 0.87, highRatio: 0.05, voiceTextureScore: 29, voiceSpread: 0.33, voicePeakToMean: 2.9 },
    { levelPercent: 35, voiceScore: 51, peakHz: 1070, centroidHz: 1100, lowRatio: 0.07, midRatio: 0.88, highRatio: 0.05, voiceTextureScore: 31, voiceSpread: 0.33, voicePeakToMean: 3.0 }
  ]);

  assert.equal(result.accepted, false);
  assert.equal(result.toneRejected, true);
  assert.equal(result.reason, "tone-like digital");
  assert.ok(result.averageLevelDelta >= 12);
});

test("accepts voice-textured spectrum even with modest level movement", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 24, voiceScore: 48, peakHz: 740, centroidHz: 980, lowRatio: 0.12, midRatio: 0.70, highRatio: 0.18, voiceTextureScore: 76, voiceSpread: 1, voicePeakToMean: 1.7 },
    { levelPercent: 30, voiceScore: 50, peakHz: 1260, centroidHz: 1420, lowRatio: 0.11, midRatio: 0.72, highRatio: 0.17, voiceTextureScore: 81, voiceSpread: 1, voicePeakToMean: 1.9 },
    { levelPercent: 27, voiceScore: 49, peakHz: 960, centroidHz: 1180, lowRatio: 0.13, midRatio: 0.69, highRatio: 0.18, voiceTextureScore: 78, voiceSpread: 1, voicePeakToMean: 1.8 }
  ], { minAudioLevelPercent: 15, noiseFloorPercent: 16, minSignalLiftPercent: 6 });

  assert.equal(result.accepted, true);
  assert.equal(result.toneRejected, false);
  assert.ok(result.spectralVoiceScore >= 70);
  assert.ok(result.score > 0);
});

test("does not refine below the 15 percent audio gate", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 3, voiceScore: 55, peakHz: 900, centroidHz: 980 },
    { levelPercent: 14, voiceScore: 58, peakHz: 1250, centroidHz: 1320 },
    { levelPercent: 5, voiceScore: 56, peakHz: 970, centroidHz: 1040 },
    { levelPercent: 13, voiceScore: 59, peakHz: 1420, centroidHz: 1500 }
  ]);

  assert.equal(SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT, 15);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "below audio gate");
});

test("uses configurable RX audio threshold", () => {
  const samples = [
    { levelPercent: 8, voiceScore: 42, peakHz: 950, centroidHz: 980 },
    { levelPercent: 24, voiceScore: 44, peakHz: 955, centroidHz: 985 },
    { levelPercent: 12, voiceScore: 43, peakHz: 952, centroidHz: 982 },
    { levelPercent: 31, voiceScore: 45, peakHz: 956, centroidHz: 986 }
  ];

  assert.equal(scoreSsbHunterSamples(samples, { minAudioLevelPercent: 15 }).accepted, true);
  assert.equal(scoreSsbHunterSamples(samples, { minAudioLevelPercent: 40 }).accepted, false);
  assert.equal(normalizeHunterAudioThresholdPercent(-1), SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT);
  assert.equal(normalizeHunterAudioThresholdPercent(99), SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT);
  assert.equal(normalizeHunterAudioThresholdPercent(Number.NaN), SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT);
});

test("strongest accepted audio beats a louder steady tone", () => {
  const tone = scoreSsbHunterSamples([
    { levelPercent: 90, voiceScore: 80, peakHz: 1500, centroidHz: 1510 },
    { levelPercent: 91, voiceScore: 80, peakHz: 1501, centroidHz: 1512 },
    { levelPercent: 90, voiceScore: 80, peakHz: 1502, centroidHz: 1511 }
  ]);
  const voice = scoreSsbHunterSamples([
    { levelPercent: 35, voiceScore: 70, peakHz: 500, centroidHz: 800 },
    { levelPercent: 58, voiceScore: 78, peakHz: 1300, centroidHz: 1650 },
    { levelPercent: 44, voiceScore: 74, peakHz: 900, centroidHz: 1200 }
  ]);

  assert.equal(tone.accepted, false);
  assert.equal(voice.accepted, true);
  assert.ok(voice.score > tone.score);
});

test("requires lift above the local noise floor", () => {
  const buried = scoreSsbHunterSamples([
    { levelPercent: 39, voiceScore: 72, peakHz: 720, centroidHz: 980, lowRatio: 0.12, midRatio: 0.74, highRatio: 0.14 },
    { levelPercent: 41, voiceScore: 74, peakHz: 1320, centroidHz: 1510, lowRatio: 0.10, midRatio: 0.76, highRatio: 0.14 },
    { levelPercent: 40, voiceScore: 73, peakHz: 920, centroidHz: 1180, lowRatio: 0.11, midRatio: 0.75, highRatio: 0.14 }
  ], { minAudioLevelPercent: 15, noiseFloorPercent: 38 });
  const clear = scoreSsbHunterSamples([
    { levelPercent: 43, voiceScore: 72, peakHz: 720, centroidHz: 980, lowRatio: 0.12, midRatio: 0.74, highRatio: 0.14 },
    { levelPercent: 58, voiceScore: 76, peakHz: 1320, centroidHz: 1510, lowRatio: 0.10, midRatio: 0.76, highRatio: 0.14 },
    { levelPercent: 49, voiceScore: 74, peakHz: 920, centroidHz: 1180, lowRatio: 0.11, midRatio: 0.75, highRatio: 0.14 }
  ], { minAudioLevelPercent: 15, noiseFloorPercent: 38 });

  assert.equal(SSB_HUNTER_SIGNAL_LIFT_MIN_PERCENT, 4);
  assert.equal(buried.accepted, false);
  assert.equal(buried.reason, "below local floor");
  assert.equal(clear.accepted, true);
  assert.equal(clear.reason, "voice-like lift");
  assert.ok(clear.signalLiftPercent >= 20);
});

test("uses configurable RX lift gate above the local floor", () => {
  const samples = [
    { levelPercent: 34, voiceScore: 72, peakHz: 720, centroidHz: 980, lowRatio: 0.12, midRatio: 0.74, highRatio: 0.14 },
    { levelPercent: 42, voiceScore: 76, peakHz: 1320, centroidHz: 1510, lowRatio: 0.10, midRatio: 0.76, highRatio: 0.14 },
    { levelPercent: 38, voiceScore: 74, peakHz: 920, centroidHz: 1180, lowRatio: 0.11, midRatio: 0.75, highRatio: 0.14 }
  ];

  assert.equal(SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT, 6);
  assert.equal(scoreSsbHunterSamples(samples, { minAudioLevelPercent: 15, noiseFloorPercent: 30, minSignalLiftPercent: 6 }).accepted, true);
  assert.equal(scoreSsbHunterSamples(samples, { minAudioLevelPercent: 15, noiseFloorPercent: 30, minSignalLiftPercent: 16 }).accepted, false);
  assert.equal(normalizeHunterAudioLiftGatePercent(-1), 2);
  assert.equal(normalizeHunterAudioLiftGatePercent(99), 35);
});

test("rejects broadband noise even when it is above the gate", () => {
  const result = scoreSsbHunterSamples([
    { levelPercent: 40, voiceScore: 32, peakHz: 3400, centroidHz: 2600, lowRatio: 0.18, midRatio: 0.42, highRatio: 0.40 },
    { levelPercent: 42, voiceScore: 34, peakHz: 3600, centroidHz: 2700, lowRatio: 0.17, midRatio: 0.43, highRatio: 0.40 },
    { levelPercent: 41, voiceScore: 33, peakHz: 3300, centroidHz: 2550, lowRatio: 0.16, midRatio: 0.41, highRatio: 0.43 }
  ], { minAudioLevelPercent: 15, noiseFloorPercent: 26 });

  assert.equal(result.accepted, false);
  assert.equal(result.broadbandRejected, true);
  assert.equal(result.reason, "broadband noise");
});

test("tracks a local hunter noise floor by frequency window", () => {
  let hunter = createInitialHunterState({ startHz: 28_400_000, now: 1_000, dwellMs: SSB_HUNTER_DWELL_MS });
  for (let index = 0; index < SSB_HUNTER_NOISE_FLOOR_MIN_POINTS; index += 1) {
    hunter = {
      ...hunter,
      floor: updateHunterNoiseFloor(hunter, 28_390_000 + index * 1000, {
        audioStrength: 20 + index,
        voiceLikeScore: 0,
        sampleCount: 4,
        accepted: false
      }, 1_000 + index)
    };
  }
  for (let index = 0; index < SSB_HUNTER_NOISE_FLOOR_MIN_POINTS; index += 1) {
    hunter = {
      ...hunter,
      floor: updateHunterNoiseFloor(hunter, 28_470_000 + index * 1000, {
        audioStrength: 46 + index,
        voiceLikeScore: 0,
        sampleCount: 4,
        accepted: false
      }, 2_000 + index)
    };
  }

  assert.equal(SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ, 15_000);
  assert.ok(estimateHunterNoiseFloor(hunter, 28_392_000) < 30);
  assert.ok(estimateHunterNoiseFloor(hunter, 28_472_000) > 40);
});

test("refinement step shrinks to the minimum", () => {
  assert.equal(SSB_HUNTER_INITIAL_STEP_HZ, 1000);
  assert.equal(reduceHunterStep(SSB_HUNTER_INITIAL_STEP_HZ), 500);
  assert.equal(reduceHunterStep(500), 250);
  assert.equal(reduceHunterStep(250), 100);
  assert.equal(reduceHunterStep(100), 50);
  assert.equal(reduceHunterStep(50), 10);
  assert.equal(reduceHunterStep(10), 10);
  assert.equal(SSB_HUNTER_MIN_STEP_HZ, 10);
  assert.equal(isMinimumHunterStep(10), true);
});

test("hunter dwell increases as refinement step shrinks", () => {
  assert.equal(hunterDwellForStep(1000, SSB_HUNTER_DWELL_MS), 35);
  assert.equal(hunterDwellForStep(500, SSB_HUNTER_DWELL_MS), 35);
  assert.equal(hunterDwellForStep(250, SSB_HUNTER_DWELL_MS), 70);
  assert.equal(hunterDwellForStep(100, SSB_HUNTER_DWELL_MS), 250);
  assert.equal(hunterDwellForStep(50, SSB_HUNTER_DWELL_MS), 450);
  assert.equal(hunterDwellForStep(10, SSB_HUNTER_DWELL_MS), 900);
});

test("initial hunter state starts on wide-hunt dwell", () => {
  const hunter = createInitialHunterState({ startHz: 28_400_000, now: 1_000, dwellMs: SSB_HUNTER_DWELL_MS });
  assert.equal(hunter.stepHz, SSB_HUNTER_INITIAL_STEP_HZ);
  assert.equal(hunter.dwellMs, hunterDwellForStep(SSB_HUNTER_INITIAL_STEP_HZ, SSB_HUNTER_DWELL_MS));
  assert.equal(hunter.belowGateMisses, 0);
  assert.equal(hunter.audioThresholdPercent, SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT);
  assert.equal(hunter.audioLiftGatePercent, SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT);
  assert.equal(hunter.autoRfGainEnabled, false);
  assert.equal(hunter.lockMs, SSB_HUNTER_LOCK_MS);
  assert.equal(SSB_HUNTER_LOCK_MS, 5_000);
  assert.equal(SSB_HUNTER_MIN_STEP_MISS_LIMIT, 8);
  assert.equal(SSB_HUNTER_SKIP_SPAN_HZ, 100);
});

test("normalizes hunter lock time", () => {
  assert.equal(normalizeHunterLockMs(100), SSB_HUNTER_LOCK_MIN_MS);
  assert.equal(normalizeHunterLockMs(120_000), SSB_HUNTER_LOCK_MAX_MS);
  assert.equal(normalizeHunterLockMs(Number.NaN), SSB_HUNTER_LOCK_MS);
});

test("hunter frequency wraps inside the range", () => {
  const range = { startHz: 28_300_000, endHz: 28_500_000 };
  assert.equal(nextHunterFrequency(28_499_900, 1, 500, range), 28_300_000);
  assert.equal(nextHunterFrequency(28_300_100, -1, 500, range), 28_500_000);
});

test("hunter no-wrap frequency returns null at range edges", () => {
  const range = { startHz: 28_300_000, endHz: 28_500_000 };
  assert.equal(nextHunterFrequencyNoWrap(28_402_100, 1, 500, range), 28_402_600);
  assert.equal(nextHunterFrequencyNoWrap(28_499_900, 1, 500, range), null);
  assert.equal(nextHunterFrequencyNoWrap(28_300_100, -1, 500, range), null);
});

test("hunter envelope survey rewinds locally before the suspect on narrow bands", () => {
  const tenMeter = { startHz: 28_300_000, endHz: 28_500_000 };
  const envelope = createHunterEnvelope({
    suspectHz: 28_402_000,
    range: tenMeter,
    now: 1_000,
    score: { score: 88 }
  });

  assert.equal(SSB_HUNTER_ENVELOPE_BACKTRACK_FRACTION, 0.10);
  assert.equal(SSB_HUNTER_ENVELOPE_FORWARD_FRACTION, 0.10);
  assert.equal(SSB_HUNTER_ENVELOPE_MAX_SPAN_HZ, 5_000);
  assert.equal(envelope.surveyStartHz, 28_397_000);
  assert.equal(envelope.surveyEndHz, 28_407_000);
  assert.equal(envelope.bestHz, 28_402_000);
  assert.equal(envelope.bestScore, 88);
});

test("hunter envelope maps a local two-sided survey window on wide bands", () => {
  const sixMeter = { startHz: 50_100_000, endHz: 54_000_000 };
  const envelope = createHunterEnvelope({
    suspectHz: 52_500_000,
    range: sixMeter,
    now: 1_000
  });

  assert.equal(envelope.surveyStartHz, 52_495_000);
  assert.equal(envelope.surveyEndHz, 52_505_000);
  assert.equal(envelope.stepHz, SSB_HUNTER_ENVELOPE_STEP_HZ);
  assert.equal(nextHunterEnvelopeSurveyFrequency(52_110_000, envelope, sixMeter), 52_110_250);
});

test("hunter envelope records first edge, far edge, and strongest score", () => {
  const envelope = createHunterEnvelope({
    suspectHz: 28_402_000,
    range: { startHz: 28_300_000, endHz: 28_500_000 },
    now: 1_000,
    score: { score: 40 }
  });
  const first = updateHunterEnvelopeWithScore(envelope, 28_399_000, { score: 52 }, 1_100);
  const second = updateHunterEnvelopeWithScore(first, 28_401_000, { score: 90 }, 1_200);
  const weaker = updateHunterEnvelopeWithScore(second, 28_403_000, { score: 64 }, 1_300);

  assert.equal(weaker.firstHeardHz, 28_399_000);
  assert.equal(weaker.lowEdgeHz, 28_399_000);
  assert.equal(weaker.highEdgeHz, 28_403_000);
  assert.equal(weaker.bestHz, 28_401_000);
  assert.equal(weaker.bestScore, 90);
  assert.equal(weaker.missesAfterHeard, 0);
  assert.equal(weaker.stepHz, 250);
});

test("hunter refinement clamps inside the mapped envelope with padding", () => {
  const range = { startHz: 28_300_000, endHz: 28_500_000 };
  const hunter = {
    phase: "refining",
    envelope: {
      stage: "refining",
      lowEdgeHz: 28_399_000,
      highEdgeHz: 28_403_000
    }
  };

  assert.equal(SSB_HUNTER_ENVELOPE_PAD_HZ, 1_500);
  assert.equal(clampHunterRefineFrequency(28_390_000, hunter, range), 28_397_500);
  assert.equal(clampHunterRefineFrequency(28_410_000, hunter, range), 28_404_500);
  assert.equal(clampHunterRefineFrequency(28_401_000, hunter, range), 28_401_000);
});

test("hunter envelope always starts refinement at 250 Hz", () => {
  assert.equal(hunterInitialRefineStepForEnvelope({ lowEdgeHz: 28_399_000, highEdgeHz: 28_401_000 }), 250);
  assert.equal(hunterInitialRefineStepForEnvelope({ lowEdgeHz: 28_390_000, highEdgeHz: 28_398_000 }), 250);
  assert.equal(hunterInitialRefineStepForEnvelope({ lowEdgeHz: 28_300_000, highEdgeHz: 28_450_000 }), 250);
});

test("lock timing helper matches hunter timing", () => {
  const now = 1_000_000;
  const hunter = createInitialHunterState({ startHz: 28_400_000, now, dwellMs: SSB_HUNTER_DWELL_MS });
  hunter.bestHz = 28_401_000;
  hunter.lockUntil = now + SSB_HUNTER_LOCK_MS;

  assert.equal(shouldLeaveHunterLock(now + SSB_HUNTER_LOCK_MS - 1, hunter), false);
  assert.equal(shouldLeaveHunterLock(now + SSB_HUNTER_LOCK_MS, hunter), true);
});
