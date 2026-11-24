export const SSB_HUNTER_STEPS_HZ = Object.freeze([1000, 500, 250, 100, 50, 10]);
export const SSB_HUNTER_MIN_STEP_HZ = SSB_HUNTER_STEPS_HZ[SSB_HUNTER_STEPS_HZ.length - 1];
export const SSB_HUNTER_INITIAL_STEP_HZ = 1000;
export const SSB_HUNTER_DWELL_MIN_MS = 8;
export const SSB_HUNTER_DWELL_MAX_MS = 120;
export const SSB_HUNTER_DWELL_MS = 35;
export const SSB_HUNTER_DWELL_BY_STEP_MS = Object.freeze({
  1000: 35,
  500: 35,
  250: 70,
  100: 250,
  50: 450,
  10: 900
});
export const SSB_HUNTER_LOCK_MS = 5_000;
export const SSB_HUNTER_LOCK_MIN_MS = 1_000;
export const SSB_HUNTER_LOCK_MAX_MS = 60_000;
export const SSB_HUNTER_MIN_SAMPLES = 3;
export const SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT = 15;
export const SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT = 0;
export const SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT = 80;
export const SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT = 6;
export const SSB_HUNTER_AUDIO_LIFT_GATE_MIN_PERCENT = 2;
export const SSB_HUNTER_AUDIO_LIFT_GATE_MAX_PERCENT = 35;
export const SSB_HUNTER_LOCK_CONFIRM_PASSES = 6;
export const SSB_HUNTER_MIN_STEP_MISS_LIMIT = 8;
export const SSB_HUNTER_SKIP_SPAN_HZ = 100;
export const SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ = 15_000;
export const SSB_HUNTER_NOISE_FLOOR_MIN_POINTS = 6;
export const SSB_HUNTER_NOISE_FLOOR_MAX_POINTS = 1_200;
export const SSB_HUNTER_SIGNAL_LIFT_MIN_PERCENT = 4;
export const SSB_HUNTER_ENVELOPE_BACKTRACK_FRACTION = 0.10;
export const SSB_HUNTER_ENVELOPE_FORWARD_FRACTION = 0.10;
export const SSB_HUNTER_ENVELOPE_MAX_SPAN_HZ = 5_000;
export const SSB_HUNTER_ENVELOPE_STEP_HZ = 250;
export const SSB_HUNTER_ENVELOPE_DWELL_MS = 45;
export const SSB_HUNTER_ENVELOPE_STUDY_DWELL_MS = 110;
export const SSB_HUNTER_ENVELOPE_MISS_LIMIT = 3;
export const SSB_HUNTER_ENVELOPE_PAD_HZ = 1_500;
export const SSB_HUNTER_AUTO_RF_GAIN_TARGET_LIFT_PERCENT = 14;
export const SSB_HUNTER_AUTO_RF_GAIN_MIN_TARGET_PERCENT = 6;
export const SSB_HUNTER_AUTO_RF_GAIN_MAX_TARGET_PERCENT = 35;

export function createInitialHunterState({
  startHz,
  now = Date.now(),
  dwellMs = SSB_HUNTER_DWELL_MS,
  audioThresholdPercent = SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
  audioLiftGatePercent = SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT,
  lockMs = SSB_HUNTER_LOCK_MS
}) {
  const initialDwellMs = hunterDwellForStep(SSB_HUNTER_INITIAL_STEP_HZ, dwellMs);
  return {
    phase: "seeking",
    stepHz: SSB_HUNTER_INITIAL_STEP_HZ,
    direction: 1,
    bestHz: null,
    bestScore: 0,
    currentScore: 0,
    lastHeardAt: null,
    lockUntil: null,
    lockMs: normalizeHunterLockMs(lockMs),
    resumeHz: startHz,
    toneRejected: false,
    broadbandRejected: false,
    modulationScore: 0,
    audioStrength: 0,
    noiseFloorPercent: null,
    signalLiftPercent: 0,
    voiceLikeScore: 0,
    spectralVoiceScore: 0,
    audioThresholdPercent: normalizeHunterAudioThresholdPercent(audioThresholdPercent),
    audioLiftGatePercent: normalizeHunterAudioLiftGatePercent(audioLiftGatePercent),
    autoRfGainEnabled: false,
    rfGainTargetLiftPercent: SSB_HUNTER_AUTO_RF_GAIN_TARGET_LIFT_PERCENT,
    lastAutoRfGainAt: null,
    refinePasses: 0,
    peakMisses: 0,
    belowGateMisses: 0,
    lastImprovedAt: null,
    skippedHz: [],
    passId: 1,
    fastCandidates: [],
    sweep: {
      points: [],
      maxLevelPercent: 0,
      passStartedAt: now
    },
    floor: {
      points: [],
      windowHz: SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ
    },
    envelope: null,
    decision: "seeking",
    samples: [],
    sampleCount: 0,
    startedAt: now,
    baseDwellMs: dwellMs,
    dwellMs: initialDwellMs
  };
}

export function scoreSsbHunterSamples(samples, options = {}) {
  const minAudioLevelPercent = normalizeHunterAudioThresholdPercent(
    options.minAudioLevelPercent ?? options.audioThresholdPercent ?? SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT
  );
  const safeSamples = (samples ?? [])
    .map(normalizeHunterSample)
    .filter((sample) => Number.isFinite(sample.levelPercent));

  if (safeSamples.length < SSB_HUNTER_MIN_SAMPLES) {
    const collectingLevels = safeSamples.map((sample) => sample.levelPercent);
    const collectingAudioStrength = collectingLevels.length > 0 ? Math.max(...collectingLevels) : 0;
    const collectingVoiceScore = average(safeSamples.map((sample) => sample.voiceScore));
    const collectingVoiceTextureScore = average(safeSamples.map((sample) => sample.voiceTextureScore));
    const collectingRatioSamples = safeSamples.filter((sample) => (
      Number.isFinite(sample.midRatio)
        && Number.isFinite(sample.highRatio)
        && Number.isFinite(sample.lowRatio)
    ));
    const collectingSpectralVoiceScore = collectingRatioSamples.length > 0
      ? clampNumber(
        collectingVoiceTextureScore * 0.54
          + collectingVoiceScore * 0.22
          + average(collectingRatioSamples.map((sample) => sample.midRatio)) * 38
          - average(collectingRatioSamples.map((sample) => sample.highRatio)) * 22
          - average(collectingRatioSamples.map((sample) => sample.lowRatio)) * 10,
        0,
        100
      )
      : clampNumber((collectingVoiceScore * 0.56) + (collectingVoiceTextureScore * 0.44), 0, 100);
    const collectingNoiseFloor = normalizeNoiseFloorOption(options.noiseFloorPercent, minAudioLevelPercent);
    const collectingSignalLift = Math.max(0, collectingAudioStrength - collectingNoiseFloor);
    return {
      accepted: false,
      toneRejected: false,
      broadbandRejected: false,
      modulationScore: 0,
      audioStrength: Math.round(collectingAudioStrength),
      noiseFloorPercent: Math.round(collectingNoiseFloor),
      signalLiftPercent: Math.round(collectingSignalLift),
      voiceLikeScore: Math.round(clampNumber((collectingVoiceScore * 0.42) + (collectingSpectralVoiceScore * 0.58), 0, 100)),
      spectralVoiceScore: Math.round(collectingSpectralVoiceScore),
      voiceTextureScore: Math.round(collectingVoiceTextureScore),
      score: 0,
      sampleCount: safeSamples.length,
      reason: "collecting"
    };
  }

  const levels = safeSamples.map((sample) => sample.levelPercent);
  const voiceScores = safeSamples.map((sample) => sample.voiceScore);
  const voiceTextureScores = safeSamples.map((sample) => sample.voiceTextureScore);
  const voiceSpreads = safeSamples.map((sample) => sample.voiceSpread).filter(Number.isFinite);
  const voicePeakToMeans = safeSamples.map((sample) => sample.voicePeakToMean).filter(Number.isFinite);
  const peakHertz = safeSamples.map((sample) => sample.peakHz).filter(Number.isFinite);
  const centroidHertz = safeSamples.map((sample) => sample.centroidHz).filter(Number.isFinite);
  const ratioSamples = safeSamples.filter((sample) => (
    Number.isFinite(sample.midRatio)
      && Number.isFinite(sample.highRatio)
      && Number.isFinite(sample.lowRatio)
  ));
  const levelDeltas = adjacentDeltas(levels);
  const audioStrength = Math.max(...levels);
  const averageLevel = average(levels);
  const levelSpan = span(levels);
  const averageLevelDelta = average(levelDeltas);
  const levelDirectionChanges = directionChanges(levels);
  const peakSpan = span(peakHertz);
  const centroidSpan = span(centroidHertz);
  const averageVoiceScore = average(voiceScores);
  const averageVoiceTextureScore = average(voiceTextureScores);
  const averageVoiceSpread = average(voiceSpreads);
  const averageVoicePeakToMean = average(voicePeakToMeans);
  const averageMidRatio = average(ratioSamples.map((sample) => sample.midRatio));
  const averageHighRatio = average(ratioSamples.map((sample) => sample.highRatio));
  const averageLowRatio = average(ratioSamples.map((sample) => sample.lowRatio));
  const modulationScore = clampNumber(
    levelSpan * 3.4
      + averageLevelDelta * 8.5
      + Math.min(18, levelDirectionChanges * 4)
      + Math.min(8, peakSpan / 80)
      + Math.min(8, centroidSpan / 90)
      + Math.max(0, averageVoiceScore - 45) * 0.2,
    0,
    100
  );
  const hasSpectrumShape = ratioSamples.length >= Math.min(SSB_HUNTER_MIN_SAMPLES, safeSamples.length);
  const spectralVoiceScore = hasSpectrumShape
    ? clampNumber(
      38
        + clampNumber((averageMidRatio - 0.42) * 140, 0, 38)
        + Math.min(18, centroidSpan / 90)
        + Math.min(12, peakSpan / 120)
        + clampNumber((averageVoiceTextureScore - 38) * 0.55, 0, 26)
        + clampNumber((averageVoiceSpread - 0.45) * 32, 0, 18)
        + clampNumber((averageVoicePeakToMean - 1.2) * 11, 0, 12)
        - clampNumber((averageHighRatio - 0.30) * 110, 0, 28)
        - clampNumber((averageLowRatio - 0.38) * 65, 0, 18),
      0,
      100
    )
    : clampNumber((averageVoiceScore * 0.62) + (averageVoiceTextureScore * 0.38), 0, 100);
  const voiceLikeScore = clampNumber(
    modulationScore * 0.45
      + averageVoiceScore * 0.23
      + spectralVoiceScore * 0.27
      + averageVoiceTextureScore * 0.05,
    0,
    100
  );
  const noiseFloorPercent = normalizeNoiseFloorOption(options.noiseFloorPercent, minAudioLevelPercent);
  const signalLiftPercent = Math.max(0, audioStrength - noiseFloorPercent);
  const minSignalLiftPercent = Math.max(
    SSB_HUNTER_SIGNAL_LIFT_MIN_PERCENT,
    normalizeHunterAudioLiftGatePercent(options.minSignalLiftPercent ?? options.audioLiftGatePercent ?? minAudioLevelPercent * 0.22)
  );
  const steadyToneRejected = audioStrength >= 8
    && levelSpan < 5
    && averageLevelDelta < 2.5
    && peakSpan < 45
    && centroidSpan < 55;
  const narrowDigitalRejected = hasSpectrumShape
    && audioStrength >= 8
    && averageMidRatio > 0.72
    && averageHighRatio < 0.16
    && averageLowRatio < 0.18
    && averageVoiceTextureScore < 58
    && averageVoiceSpread < 0.68
    && peakSpan < 280
    && centroidSpan < 280
    && averageVoiceScore < 62
    && levelDirectionChanges <= 2;
  const toneRejected = steadyToneRejected || narrowDigitalRejected;
  const broadbandRejected = hasSpectrumShape
    && audioStrength >= minAudioLevelPercent
    && averageHighRatio > 0.36
    && averageMidRatio < 0.58
    && modulationScore < 48
    && averageVoiceScore < 62;
  const accepted = audioStrength >= minAudioLevelPercent
    && signalLiftPercent >= minSignalLiftPercent
    && (modulationScore >= 24 || voiceLikeScore >= 55)
    && voiceLikeScore >= 35
    && !toneRejected
    && !broadbandRejected;
  const score = accepted
    ? Math.round(
      signalLiftPercent * 3.2
        + voiceLikeScore * 1.25
        + modulationScore * 0.8
        + Math.max(0, averageVoiceScore - 45) * 0.5
    )
    : 0;

  return {
    accepted,
    toneRejected,
    broadbandRejected,
    modulationScore: Math.round(modulationScore),
    audioStrength: Math.round(audioStrength),
    noiseFloorPercent: Math.round(noiseFloorPercent),
    signalLiftPercent: Math.round(signalLiftPercent),
    voiceLikeScore: Math.round(voiceLikeScore),
    spectralVoiceScore: Math.round(spectralVoiceScore),
    voiceTextureScore: Math.round(averageVoiceTextureScore),
    score,
    sampleCount: safeSamples.length,
    levelSpan: Math.round(levelSpan * 10) / 10,
    averageLevelDelta: Math.round(averageLevelDelta * 10) / 10,
    levelDirectionChanges,
    peakSpan: Math.round(peakSpan),
    centroidSpan: Math.round(centroidSpan),
    averageLevel: Math.round(averageLevel),
    averageVoiceScore: Math.round(averageVoiceScore),
    averageVoiceTextureScore: Math.round(averageVoiceTextureScore),
    averageVoiceSpread: Math.round(averageVoiceSpread * 100) / 100,
    averageVoicePeakToMean: Math.round(averageVoicePeakToMean * 10) / 10,
    averageMidRatio: roundRatioPercent(averageMidRatio),
    averageHighRatio: roundRatioPercent(averageHighRatio),
    averageLowRatio: roundRatioPercent(averageLowRatio),
    reason: steadyToneRejected
      ? "steady level"
      : narrowDigitalRejected
      ? "tone-like digital"
      : broadbandRejected
      ? "broadband noise"
      : audioStrength < minAudioLevelPercent
      ? "below audio gate"
      : signalLiftPercent < minSignalLiftPercent
      ? "below local floor"
      : accepted
      ? options.noiseFloorPercent == null
        ? "modulating RX level"
        : "voice-like lift"
      : "weak or flat level"
  };
}

export function estimateHunterNoiseFloor(hunter, hz, options = {}) {
  const points = (hunter?.floor?.points ?? [])
    .filter((point) => Number.isInteger(point.hz) && Number.isFinite(point.levelPercent));
  if (points.length === 0) {
    return null;
  }

  const windowHz = normalizePositiveInteger(
    options.windowHz ?? hunter?.floor?.windowHz,
    SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ
  );
  const minPoints = normalizePositiveInteger(
    options.minPoints,
    SSB_HUNTER_NOISE_FLOOR_MIN_POINTS
  );
  const localPoints = Number.isInteger(hz)
    ? points.filter((point) => Math.abs(point.hz - hz) <= windowHz)
    : [];
  const selectedPoints = localPoints.length >= minPoints ? localPoints : points;
  const values = selectedPoints
    .map((point) => point.levelPercent)
    .filter(Number.isFinite);

  if (values.length === 0) {
    return null;
  }

  return Math.round(percentile(values, 0.35));
}

export function updateHunterNoiseFloor(hunter, hz, score, now = Date.now()) {
  const previousFloor = hunter?.floor ?? {};
  const windowHz = normalizePositiveInteger(previousFloor.windowHz, SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ);
  if (!Number.isInteger(hz) || !Number.isFinite(score?.audioStrength) || (score?.sampleCount ?? 0) < 1) {
    return {
      ...previousFloor,
      points: previousFloor.points ?? [],
      windowHz
    };
  }

  const maxPoints = normalizePositiveInteger(
    previousFloor.maxPoints,
    SSB_HUNTER_NOISE_FLOOR_MAX_POINTS
  );
  const previousPoints = Array.isArray(previousFloor.points) ? previousFloor.points : [];
  const floorLevelPercent = score.accepted && Number.isFinite(score.noiseFloorPercent)
    ? Math.min(score.audioStrength, score.noiseFloorPercent + 2)
    : score.audioStrength;
  const points = [
    ...previousPoints,
    {
      hz,
      levelPercent: Math.round(clampNumber(floorLevelPercent, 0, 100)),
      voiceLikeScore: Number.isFinite(score.voiceLikeScore) ? Math.round(score.voiceLikeScore) : 0,
      accepted: score.accepted === true,
      at: now
    }
  ].slice(-maxPoints);

  return {
    points,
    windowHz,
    maxPoints
  };
}

export function normalizeHunterAudioThresholdPercent(value) {
  const number = Number(value);
  return Math.round(clampNumber(
    Number.isFinite(number) ? number : SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
    SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT,
    SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT
  ));
}

export function normalizeHunterAudioLiftGatePercent(value) {
  const number = Number(value);
  return Math.round(clampNumber(
    Number.isFinite(number) ? number : SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT,
    SSB_HUNTER_AUDIO_LIFT_GATE_MIN_PERCENT,
    SSB_HUNTER_AUDIO_LIFT_GATE_MAX_PERCENT
  ));
}

export function normalizeHunterAutoRfGainTargetPercent(value) {
  const number = Number(value);
  return Math.round(clampNumber(
    Number.isFinite(number) ? number : SSB_HUNTER_AUTO_RF_GAIN_TARGET_LIFT_PERCENT,
    SSB_HUNTER_AUTO_RF_GAIN_MIN_TARGET_PERCENT,
    SSB_HUNTER_AUTO_RF_GAIN_MAX_TARGET_PERCENT
  ));
}

export function normalizeHunterLockMs(value) {
  const number = Number(value);
  return Math.round(clampNumber(
    Number.isFinite(number) ? number : SSB_HUNTER_LOCK_MS,
    SSB_HUNTER_LOCK_MIN_MS,
    SSB_HUNTER_LOCK_MAX_MS
  ));
}

export function reduceHunterStep(stepHz) {
  const currentIndex = SSB_HUNTER_STEPS_HZ.indexOf(Number(stepHz));
  if (currentIndex === -1) {
    return SSB_HUNTER_STEPS_HZ[0];
  }

  return SSB_HUNTER_STEPS_HZ[Math.min(currentIndex + 1, SSB_HUNTER_STEPS_HZ.length - 1)];
}

export function isMinimumHunterStep(stepHz) {
  return Number(stepHz) <= SSB_HUNTER_MIN_STEP_HZ;
}

export function hunterDwellForStep(stepHz, baseDwellMs = SSB_HUNTER_DWELL_MS) {
  const configured = SSB_HUNTER_DWELL_BY_STEP_MS[String(Number(stepHz))];
  const safeBase = Number.isFinite(Number(baseDwellMs)) ? Number(baseDwellMs) : SSB_HUNTER_DWELL_MS;
  return Math.max(safeBase, configured ?? SSB_HUNTER_DWELL_MS);
}

export function createHunterEnvelope({ suspectHz, range, now = Date.now(), score = null }) {
  const safeSuspectHz = Math.round(clampNumber(suspectHz, range.startHz, range.endHz));
  const backtrackHz = hunterEnvelopeFractionSpanHz(range, SSB_HUNTER_ENVELOPE_BACKTRACK_FRACTION);
  const forwardHz = hunterEnvelopeFractionSpanHz(range, SSB_HUNTER_ENVELOPE_FORWARD_FRACTION);
  const surveyStartHz = Math.max(range.startHz, safeSuspectHz - backtrackHz);
  const surveyEndHz = Math.min(range.endHz, safeSuspectHz + forwardHz);
  return {
    active: true,
    stage: "mapping",
    suspectHz: safeSuspectHz,
    surveyStartHz,
    surveyEndHz,
    lowEdgeHz: null,
    highEdgeHz: null,
    bestHz: safeSuspectHz,
    bestScore: Number.isFinite(score?.score) ? score.score : 0,
    firstHeardHz: null,
    lastHeardHz: null,
    missesAfterHeard: 0,
    stepHz: SSB_HUNTER_ENVELOPE_STEP_HZ,
    startedAt: now,
    updatedAt: now
  };
}

function hunterEnvelopeFractionSpanHz(range, fraction) {
  const rangeSpanHz = Math.max(1, Number(range?.endHz) - Number(range?.startHz));
  const minimumStudyHz = SSB_HUNTER_ENVELOPE_STEP_HZ * 8;
  return Math.min(
    SSB_HUNTER_ENVELOPE_MAX_SPAN_HZ,
    Math.max(minimumStudyHz, Math.round(rangeSpanHz * fraction))
  );
}

export function updateHunterEnvelopeWithScore(envelope, hz, score, now = Date.now()) {
  if (!envelope) {
    return null;
  }

  const improved = Number.isFinite(score?.score) && score.score >= (envelope.bestScore ?? 0);
  return {
    ...envelope,
    firstHeardHz: Number.isInteger(envelope.firstHeardHz) ? envelope.firstHeardHz : hz,
    lastHeardHz: hz,
    lowEdgeHz: Number.isInteger(envelope.lowEdgeHz) ? envelope.lowEdgeHz : hz,
    highEdgeHz: hz,
    bestHz: improved ? hz : envelope.bestHz,
    bestScore: improved ? score.score : envelope.bestScore,
    missesAfterHeard: 0,
    stepHz: SSB_HUNTER_ENVELOPE_STEP_HZ,
    updatedAt: now
  };
}

export function nextHunterEnvelopeSurveyFrequency(hz, envelope, range) {
  const stepHz = Math.max(1, envelope?.stepHz ?? SSB_HUNTER_ENVELOPE_STEP_HZ);
  const nextHz = Math.round(Number(hz) + stepHz);
  if (nextHz > (envelope?.surveyEndHz ?? range.endHz)) {
    return null;
  }

  return Math.min(range.endHz, Math.max(range.startHz, nextHz));
}

export function clampHunterRefineFrequency(hz, hunter, range) {
  const envelope = hunter?.envelope;
  if (hunter?.phase !== "refining" || envelope?.stage !== "refining") {
    return hz;
  }

  const lowEdgeHz = Number.isInteger(envelope.lowEdgeHz) ? envelope.lowEdgeHz : range.startHz;
  const highEdgeHz = Number.isInteger(envelope.highEdgeHz) ? envelope.highEdgeHz : range.endHz;
  const low = Math.max(range.startHz, lowEdgeHz - SSB_HUNTER_ENVELOPE_PAD_HZ);
  const high = Math.min(range.endHz, highEdgeHz + SSB_HUNTER_ENVELOPE_PAD_HZ);
  return Math.round(clampNumber(hz, low, high));
}

export function hunterInitialRefineStepForEnvelope(envelope) {
  void envelope;
  return 250;
}

export function nextHunterFrequency(hz, direction, stepHz, range) {
  const safeDirection = direction === -1 ? -1 : 1;
  const safeStepHz = Math.max(1, Math.abs(Number(stepHz) || SSB_HUNTER_INITIAL_STEP_HZ));
  let nextHz = Number(hz) + safeDirection * safeStepHz;

  if (nextHz > range.endHz) {
    nextHz = range.startHz;
  } else if (nextHz < range.startHz) {
    nextHz = range.endHz;
  }

  return nextHz;
}

export function nextHunterFrequencyNoWrap(hz, direction, stepHz, range) {
  const safeDirection = direction === -1 ? -1 : 1;
  const safeStepHz = Math.max(1, Math.abs(Number(stepHz) || SSB_HUNTER_INITIAL_STEP_HZ));
  const nextHz = Math.round(Number(hz) + safeDirection * safeStepHz);

  if (nextHz > range.endHz || nextHz < range.startHz) {
    return null;
  }

  return nextHz;
}

export function shouldLeaveHunterLock(now, hunter) {
  return Number.isFinite(hunter?.lockUntil) && now >= hunter.lockUntil;
}

function normalizeHunterSample(sample) {
  const midRatio = ratioOrNull(sample?.midRatio);
  const highRatio = ratioOrNull(sample?.highRatio);
  const lowRatio = ratioOrNull(
    Number.isFinite(Number(sample?.lowRatio))
      ? sample.lowRatio
      : Number.isFinite(midRatio) && Number.isFinite(highRatio)
      ? Math.max(0, 1 - midRatio - highRatio)
      : null
  );

  return {
    levelPercent: clampNumber(sample?.levelPercent, 0, 100),
    voiceScore: clampNumber(sample?.voiceScore, 0, 100),
    peakHz: finiteOrNull(sample?.peakHz),
    centroidHz: finiteOrNull(sample?.centroidHz),
    voiceTextureScore: clampNumber(sample?.voiceTextureScore, 0, 100),
    voiceSpread: ratioOrNull(sample?.voiceSpread),
    voicePeakToMean: finiteOrNull(sample?.voicePeakToMean ?? sample?.peakToMean),
    midRatio,
    highRatio,
    lowRatio
  };
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function span(values) {
  if (values.length < 2) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}

function adjacentDeltas(values) {
  if (values.length < 2) {
    return [];
  }

  const deltas = [];
  for (let index = 1; index < values.length; index += 1) {
    deltas.push(Math.abs(values[index] - values[index - 1]));
  }
  return deltas;
}

function directionChanges(values) {
  let previousDirection = 0;
  let changes = 0;
  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    const direction = Math.abs(delta) < 0.8 ? 0 : Math.sign(delta);
    if (direction !== 0 && previousDirection !== 0 && direction !== previousDirection) {
      changes += 1;
    }
    if (direction !== 0) {
      previousDirection = direction;
    }
  }
  return changes;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratioOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? clampNumber(number, 0, 1) : null;
}

function normalizeNoiseFloorOption(value, minAudioLevelPercent) {
  if (value == null || value === "") {
    return Math.max(0, minAudioLevelPercent - 8);
  }

  const number = Number(value);
  if (Number.isFinite(number)) {
    return clampNumber(number, 0, 100);
  }

  return Math.max(0, minAudioLevelPercent - 8);
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : fallback;
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) {
    return 0;
  }
  if (sorted.length === 1) {
    return sorted[0];
  }

  const position = clampNumber(fraction, 0, 1) * (sorted.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function roundRatioPercent(value) {
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}
