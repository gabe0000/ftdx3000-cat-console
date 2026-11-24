export const CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT = 25;
export const CB_REGULAR_AUDIO_CLEAR_MS = 500;
export const CB_REGULAR_AUDIO_SCAN_DWELL_MS = 5;
export const CB_REGULAR_AUDIO_MAX_DWELL_MS = 60;
export const CB_REGULAR_AUDIO_DWELL_STEP_MS = 5;
export const CB_REGULAR_AUDIO_SHORT_HOLD_MS = 1200;
export const CB_REGULAR_AUDIO_TARGET_LAG_MS = 180;
export const CB_REGULAR_AUDIO_BACKTRACK_VERIFY_MS = 650;
export const CB_REGULAR_AUDIO_BLIP_QUIET_PASSES = 2;

export function isCbRegularAudioScan({ bandId, intent } = {}) {
  return bandId === "cb" && intent === "regular";
}

export function shouldHoldCbRegularAudioScan({ bandId, intent, levelPercent } = {}) {
  return isCbRegularAudioScan({ bandId, intent })
    && Number.isFinite(Number(levelPercent))
    && Number(levelPercent) >= CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT;
}

export function regularAudioScanDwellMs({ bandId, intent, requestedDwellMs } = {}) {
  return isCbRegularAudioScan({ bandId, intent })
    ? CB_REGULAR_AUDIO_SCAN_DWELL_MS
    : requestedDwellMs;
}

export function adaptCbRegularAudioDwell({
  bandId,
  intent,
  currentDwellMs,
  adaptive,
  outcome
} = {}) {
  const dwellMs = normalizeCbRegularAudioDwell(currentDwellMs);
  if (!isCbRegularAudioScan({ bandId, intent })) {
    return {
      dwellMs,
      adaptive: adaptive ?? {
        falseStops: 0,
        goodStops: 0,
        quietPasses: 0,
        lastOutcome: null
      }
    };
  }

  const current = adaptive ?? {};
  let falseStops = Number.isFinite(Number(current.falseStops)) ? Number(current.falseStops) : 0;
  let goodStops = Number.isFinite(Number(current.goodStops)) ? Number(current.goodStops) : 0;
  let quietPasses = Number.isFinite(Number(current.quietPasses)) ? Number(current.quietPasses) : 0;
  let nextDwellMs = dwellMs;
  if (outcome === "falseStop") {
    falseStops += 1;
    goodStops = 0;
    quietPasses = 0;
    const penalty = CB_REGULAR_AUDIO_DWELL_STEP_MS * Math.min(falseStops, 3);
    nextDwellMs = Math.min(CB_REGULAR_AUDIO_MAX_DWELL_MS, dwellMs + penalty);
  } else if (outcome === "goodStop") {
    falseStops = Math.max(0, falseStops - 1);
    goodStops += 1;
    quietPasses = 0;
    nextDwellMs = Math.max(
      CB_REGULAR_AUDIO_SCAN_DWELL_MS,
      dwellMs - Math.max(CB_REGULAR_AUDIO_DWELL_STEP_MS, Math.ceil(dwellMs / 2))
    );
  } else if (outcome === "quietPass") {
    goodStops = 0;
    if (falseStops > 0) {
      quietPasses += 1;
    }
    if (quietPasses >= CB_REGULAR_AUDIO_BLIP_QUIET_PASSES) {
      falseStops = 0;
      quietPasses = 0;
      nextDwellMs = CB_REGULAR_AUDIO_SCAN_DWELL_MS;
    }
  }

  return {
    dwellMs: nextDwellMs,
    adaptive: {
      falseStops,
      goodStops,
      quietPasses,
      lastOutcome: outcome ?? current.lastOutcome ?? null
    }
  };
}

function normalizeCbRegularAudioDwell(value) {
  const dwellMs = Number.parseInt(value, 10);
  if (!Number.isFinite(dwellMs)) {
    return CB_REGULAR_AUDIO_SCAN_DWELL_MS;
  }

  return Math.min(CB_REGULAR_AUDIO_MAX_DWELL_MS, Math.max(CB_REGULAR_AUDIO_SCAN_DWELL_MS, dwellMs));
}

export function shouldBacktrackCbRegularAudioTarget({
  bandId,
  intent,
  scanMode,
  levelPercent,
  sampleAgeMs,
  previousTarget
} = {}) {
  return shouldHoldCbRegularAudioScan({ bandId, intent, levelPercent })
    && scanMode === "channels"
    && Number.isFinite(Number(sampleAgeMs))
    && Number(sampleAgeMs) <= CB_REGULAR_AUDIO_TARGET_LAG_MS
    && Number.isInteger(previousTarget?.hz)
    && previousTarget.hz > 0;
}
