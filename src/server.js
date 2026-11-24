import express from "express";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { WebSocket, WebSocketServer } from "ws";
import { SerialPort } from "serialport";
import { EXTRA_PHONE_BANDS } from "../public/band-plan.js";
import { isLocalConsoleClient, isLocalConsoleHost, LOOPBACK_ADDRESS } from "./localAccess.js";
import { loadLocalEnv } from "./localEnv.js";
import {
  MAX_FREQUENCY_HZ,
  MAX_RF_GAIN,
  MIN_FREQUENCY_HZ,
  MIN_RF_GAIN,
  MODE_COMMANDS,
  NUDGE_STEPS_HZ,
  READ_ONLY_COMMANDS,
  S_UNITS,
  approxSToRawMeter,
  formatSetMicGainCommand,
  formatSetModeCommand,
  formatSetMonitorEnabledCommand,
  formatSetMonitorLevelCommand,
  formatSetParametricEqEnabledCommand,
  formatSetProcessorEnabledCommand,
  formatSetProcessorLevelCommand,
  formatSetPowerSwitchCommand,
  formatSetRfGainCommand,
  formatStartAntennaTunerCommand,
  formatSetTransmitCommand,
  formatSetVfoAFrequencyCommand,
  isLikelyRiskyTxPort,
  normalizePollMs,
  parseCatFrame,
  splitCatFrames,
  toMacCalloutPath
} from "./cat.js";
import {
  SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT,
  SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT,
  SSB_HUNTER_AUDIO_LIFT_GATE_MAX_PERCENT,
  SSB_HUNTER_AUDIO_LIFT_GATE_MIN_PERCENT,
  SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT,
  SSB_HUNTER_AUTO_RF_GAIN_MAX_TARGET_PERCENT,
  SSB_HUNTER_AUTO_RF_GAIN_MIN_TARGET_PERCENT,
  SSB_HUNTER_AUTO_RF_GAIN_TARGET_LIFT_PERCENT,
  SSB_HUNTER_DWELL_MAX_MS,
  SSB_HUNTER_DWELL_MIN_MS,
  SSB_HUNTER_DWELL_MS,
  SSB_HUNTER_DWELL_BY_STEP_MS,
  SSB_HUNTER_ENVELOPE_DWELL_MS,
  SSB_HUNTER_ENVELOPE_MISS_LIMIT,
  SSB_HUNTER_ENVELOPE_STEP_HZ,
  SSB_HUNTER_ENVELOPE_STUDY_DWELL_MS,
  SSB_HUNTER_INITIAL_STEP_HZ,
  SSB_HUNTER_LOCK_MAX_MS,
  SSB_HUNTER_LOCK_MIN_MS,
  SSB_HUNTER_LOCK_MS,
  SSB_HUNTER_LOCK_CONFIRM_PASSES,
  SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
  SSB_HUNTER_MIN_SAMPLES,
  SSB_HUNTER_MIN_STEP_HZ,
  SSB_HUNTER_MIN_STEP_MISS_LIMIT,
  SSB_HUNTER_NOISE_FLOOR_MAX_POINTS,
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
  normalizeHunterAutoRfGainTargetPercent,
  normalizeHunterAudioLiftGatePercent,
  normalizeHunterAudioThresholdPercent,
  normalizeHunterLockMs,
  reduceHunterStep,
  scoreSsbHunterSamples,
  shouldLeaveHunterLock,
  updateHunterEnvelopeWithScore,
  updateHunterNoiseFloor
} from "./ssbHunter.js";
import {
  fetchPotaSpots,
  filterPotaSpotsForRange,
  POTA_SPOTS_ENDPOINT,
  POTA_USER_AGENT
} from "./pota.js";
import {
  CB_REGULAR_AUDIO_CLEAR_MS,
  CB_REGULAR_AUDIO_SHORT_HOLD_MS,
  CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT,
  CB_REGULAR_AUDIO_BACKTRACK_VERIFY_MS,
  adaptCbRegularAudioDwell,
  isCbRegularAudioScan,
  regularAudioScanDwellMs,
  shouldBacktrackCbRegularAudioTarget,
  shouldHoldCbRegularAudioScan
} from "./scanAudio.js";
import {
  buildFetchOption,
  buildQrzContactAdif,
  getQrzLogbookKey,
  getQrzPublicConfig,
  getQrzXmlCredentials,
  isCbQrzContact,
  parseAdifRecords,
  qrzXmlLogin,
  qrzXmlLookupCallsign,
  qrzLogbookRequest,
  validateQrzContact
} from "./qrz.js";

const execFileAsync = promisify(execFile);
loadLocalEnv();
const DEFAULT_PORT = 3030;
const BAUD_RATES = Object.freeze([4800, 9600, 19200, 38400]);
const DEFAULT_RF_GAIN = Math.round(MAX_RF_GAIN * 0.45);
const MODE_POLL_MS = 5000;
const METER_POLL_MS = 250;
const LIVE_METER_COMMANDS = Object.freeze(["RM1;", "RM5;", "RM6;"]);
const RF_GAIN_POLL_MS = 500;
const SCANNING_RF_GAIN_POLL_MS = 1500;
const POWER_SWITCH_POLL_MS = 10000;
const TX_AUDIO_POLL_MS = 5000;
const TX_AUDIO_READ_COMMANDS = Object.freeze(["MG;", "ML0;", "ML1;", "PL;", "PR0;", "PR1;"]);
const IDLE_FREQUENCY_POLL_MS = 50;
const HUNTER_IDLE_FREQUENCY_POLL_MS = 50;
const HUNTER_FREQUENCY_POLL_MS = 250;
const RECENT_HUNTER_TUNE_WINDOW_MS = 3000;
const HUNTER_STATE_BROADCAST_MS = 250;
const WEBSOCKET_STATE_BUFFER_LIMIT_BYTES = 256_000;
const WEBSOCKET_HARD_BUFFER_LIMIT_BYTES = 2_000_000;
const CAT_FAST_WRITE_BUFFER_LIMIT_BYTES = 2_048;
const SSB_HUNTER_ROLLING_SWEEPS = 5;
const SSB_HUNTER_SWEEP_MAX_POINTS = 20_000;
const SSB_HUNTER_BROADCAST_SWEEP_MAX_POINTS = 5_000;
const SSB_HUNTER_FAST_CONFIRM_PASSES = 3;
const SSB_HUNTER_FAST_BUCKET_HZ = 5_000;
const SSB_HUNTER_FAST_CANDIDATE_MAX_PASS_AGE = 6;
const HUNTER_AUTO_RF_GAIN_INTERVAL_MS = 650;
const HUNTER_AUTO_RF_GAIN_DEADBAND_PERCENT = 4;
let qrzXmlSession = null;
let qrzXmlRuntimeCredentials = null;
let qrzRuntimeLogbookKey = "";
const DEFAULT_BAND_ID = "10m";
const CB_CHANNELS = Object.freeze([
  [1, 26_965_000],
  [2, 26_975_000],
  [3, 26_985_000],
  [4, 27_005_000],
  [5, 27_015_000],
  [6, 27_025_000],
  [7, 27_035_000],
  [8, 27_055_000],
  [9, 27_065_000],
  [10, 27_075_000],
  [11, 27_085_000],
  [12, 27_105_000],
  [13, 27_115_000],
  [14, 27_125_000],
  [15, 27_135_000],
  [16, 27_155_000],
  [17, 27_165_000],
  [18, 27_175_000],
  [19, 27_185_000],
  [20, 27_205_000],
  [21, 27_215_000],
  [22, 27_225_000],
  [23, 27_255_000],
  [24, 27_235_000],
  [25, 27_245_000],
  [26, 27_265_000],
  [27, 27_275_000],
  [28, 27_285_000],
  [29, 27_295_000],
  [30, 27_305_000],
  [31, 27_315_000],
  [32, 27_325_000],
  [33, 27_335_000],
  [34, 27_345_000],
  [35, 27_355_000],
  [36, 27_365_000],
  [37, 27_375_000],
  [38, 27_385_000],
  [39, 27_395_000],
  [40, 27_405_000]
].map(([number, hz]) => createChannel(number, hz)));
const TEN_METER_FAVORITES = Object.freeze([
  [1, 28_300_000],
  [2, 28_350_000],
  [3, 28_400_000],
  [4, 28_450_000],
  [5, 28_500_000]
].map(([number, hz]) => createChannel(number, hz, "FAV")));
const SIX_METER_FAVORITES = Object.freeze([
  [1, 50_125_000],
  [2, 50_200_000],
  [3, 50_300_000],
  [4, 52_050_000],
  [5, 52_525_000],
  [6, 53_000_000]
].map(([number, hz]) => createChannel(number, hz, "FAV")));
const BAND_PROFILES = Object.freeze({
  "10m": Object.freeze({
    id: "10m",
    name: "10 Meter",
    scanLabel: "10m Technician",
    centerHz: 28_400_000,
    defaultRfGain: DEFAULT_RF_GAIN,
    defaultMode: "USB",
    defaultChannel: 3,
    defaultScanSource: "frequency",
    topHitSpacingHz: 5000,
    scanRange: Object.freeze({
      name: "10m Tech",
      startHz: 28_300_000,
      endHz: 28_500_000
    }),
    channels: TEN_METER_FAVORITES
  }),
  "6m": Object.freeze({
    id: "6m",
    name: "6 Meter",
    scanLabel: "6m Voice",
    centerHz: 52_050_000,
    defaultRfGain: DEFAULT_RF_GAIN,
    defaultMode: "USB",
    defaultChannel: 4,
    defaultScanSource: "frequency",
    topHitSpacingHz: 5000,
    scanRange: Object.freeze({
      name: "6m Voice",
      startHz: 50_100_000,
      endHz: 54_000_000
    }),
    channels: SIX_METER_FAVORITES
  }),
  ...Object.fromEntries(EXTRA_PHONE_BANDS.map(({ id, name, startHz, endHz, centerHz, mode }) => {
    const scanLabel = `${id === "10m-extra" ? "10m" : id} Extra Phone`;
    return [id, Object.freeze({
      id,
      name,
      scanLabel,
      centerHz,
      defaultRfGain: DEFAULT_RF_GAIN,
      defaultMode: mode,
      defaultChannel: id === "10m-extra" ? 3 : 2,
      defaultScanSource: "frequency",
      topHitSpacingHz: 5000,
      scanRange: Object.freeze({ name: scanLabel, startHz, endHz }),
      channels: id === "10m-extra" ? TEN_METER_FAVORITES : Object.freeze(
        [startHz + 5_000, centerHz, endHz - 5_000].map((hz, index) => createChannel(index + 1, hz, "FAV"))
      )
    })];
  })),
  cb: Object.freeze({
    id: "cb",
    name: "CB",
    scanLabel: "CB Channels",
    centerHz: 27_025_000,
    defaultRfGain: DEFAULT_RF_GAIN,
    defaultMode: "AM",
    defaultChannel: 6,
    defaultScanSource: "presets",
    scanRange: Object.freeze({
      name: "CB Channels",
      startHz: 26_965_000,
      endHz: 27_405_000
    }),
    channels: CB_CHANNELS
  })
});
const SCAN_STEPS_HZ = Object.freeze([10, 25, 50, 100, 250, 500, 1000, 2500]);
const SCAN_DWELL_MS = Object.freeze([20, 35, 50, 100, 150, 250, 400, 600, 1000]);
const MIN_SCAN_DWELL_MS = 5;
const MAX_SCAN_DWELL_MS = 1000;
const DEFAULT_SCAN_DWELL_MS = 35;
const DEFAULT_REGULAR_SCAN_DWELL_MS = 35;
const SMART_SCAN_DURATION_MS = 30_000;
const MAX_SCAN_HITS = 5;
const SCAN_GROUP_MIN_HZ = 2500;
const SCAN_SETTLE_MS = 8;
const READABLE_VERIFY_MS = 850;
const READABLE_VERIFY_SAMPLE_MS = 170;
const READABLE_SCORE_MIN = 4;
const BUSY_SCAN_DWELL_MS = 35;
const BUSY_SCAN_POLL_MS = 140;
const BUSY_SCAN_CLEAR_MS = 1000;
const BUSY_SCAN_RESPONSE_TIMEOUT_MS = 450;
const AUDIO_VOICE_SCORE_MIN = 55;
const AUDIO_SAMPLE_STALE_MS = 450;
const FREQUENCY_SLIDER_STEP_HZ = 10;
const PTT_TIMEOUT_MS = 120_000;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/cat",
  maxPayload: 64 * 1024,
  verifyClient: ({ req }) => isLocalConsoleClient(req)
});

let session = null;
let radioPowerOn = true;

app.disable("x-powered-by");
app.use((request, response, next) => {
  if (!isLocalConsoleHost(request)) {
    return response.status(403).end();
  }
  response.set({
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": `frame-ancestors 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; connect-src 'self' ws://${request.headers.host}`,
    "Referrer-Policy": "no-referrer"
  });
  next();
});
app.use("/api", (request, response, next) => {
  if (!isLocalConsoleClient(request)) {
    return response.status(403).end();
  }
  response.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get("/api/config", (_request, response) => {
  response.json({
    baudRates: BAUD_RATES,
    defaultPollMs: 250,
    readOnlyCommands: READ_ONLY_COMMANDS,
    modeControl: {
      modes: Object.keys(MODE_COMMANDS),
      commands: MODE_COMMANDS
    },
    rfGainControl: {
      min: MIN_RF_GAIN,
      max: MAX_RF_GAIN,
      read: "RG0;",
      set: "RG0###;"
    },
    meters: {
      s: "RM1;",
      power: "RM5;",
      swr: "RM6;",
      busy: "BY;"
    },
    defaultBandId: DEFAULT_BAND_ID,
    bands: publicBandProfiles(),
    scan: {
      stepsHz: SCAN_STEPS_HZ,
      dwellMs: SCAN_DWELL_MS,
      dwellRange: {
        min: MIN_SCAN_DWELL_MS,
        max: MAX_SCAN_DWELL_MS,
        step: 5
      },
      sUnits: S_UNITS,
      defaultStepHz: 10,
      regularStepsHz: [10, 50, 100, 500, 1000],
      defaultRegularStepHz: 100,
      defaultDwellMs: DEFAULT_SCAN_DWELL_MS,
      defaultRegularDwellMs: DEFAULT_REGULAR_SCAN_DWELL_MS,
      regularDwellRange: {
        min: MIN_SCAN_DWELL_MS,
        max: MAX_SCAN_DWELL_MS,
        step: 5
      },
      defaultThresholdS: 0,
      defaultSmartList: true,
      defaultReadableMode: false,
      defaultUseBusy: false,
      readableVerifyMs: READABLE_VERIFY_MS,
      ssbHunter: {
        initialStepHz: SSB_HUNTER_INITIAL_STEP_HZ,
        dwellMs: SSB_HUNTER_DWELL_MS,
        dwellMinMs: SSB_HUNTER_DWELL_MIN_MS,
        dwellMaxMs: SSB_HUNTER_DWELL_MAX_MS,
        dwellByStepMs: SSB_HUNTER_DWELL_BY_STEP_MS,
        lockMs: SSB_HUNTER_LOCK_MS,
        lockMinMs: SSB_HUNTER_LOCK_MIN_MS,
        lockMaxMs: SSB_HUNTER_LOCK_MAX_MS,
        minAudioLevelPercent: SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
        audioThresholdMinPercent: SSB_HUNTER_AUDIO_THRESHOLD_MIN_PERCENT,
        audioThresholdMaxPercent: SSB_HUNTER_AUDIO_THRESHOLD_MAX_PERCENT,
        audioLiftGatePercent: SSB_HUNTER_AUDIO_LIFT_GATE_PERCENT,
        audioLiftGateMinPercent: SSB_HUNTER_AUDIO_LIFT_GATE_MIN_PERCENT,
        audioLiftGateMaxPercent: SSB_HUNTER_AUDIO_LIFT_GATE_MAX_PERCENT,
        autoRfGainTargetLiftPercent: SSB_HUNTER_AUTO_RF_GAIN_TARGET_LIFT_PERCENT,
        autoRfGainTargetMinPercent: SSB_HUNTER_AUTO_RF_GAIN_MIN_TARGET_PERCENT,
        autoRfGainTargetMaxPercent: SSB_HUNTER_AUTO_RF_GAIN_MAX_TARGET_PERCENT,
        lockConfirmPasses: SSB_HUNTER_LOCK_CONFIRM_PASSES,
        minStepMissLimit: SSB_HUNTER_MIN_STEP_MISS_LIMIT,
        noiseFloorWindowHz: SSB_HUNTER_NOISE_FLOOR_WINDOW_HZ,
        noiseFloorMinPoints: SSB_HUNTER_NOISE_FLOOR_MIN_POINTS,
        noiseFloorMaxPoints: SSB_HUNTER_NOISE_FLOOR_MAX_POINTS,
	        minSignalLiftPercent: SSB_HUNTER_SIGNAL_LIFT_MIN_PERCENT,
        skipSpanHz: SSB_HUNTER_SKIP_SPAN_HZ,
        fastConfirmPasses: SSB_HUNTER_FAST_CONFIRM_PASSES,
        fastBucketHz: SSB_HUNTER_FAST_BUCKET_HZ,
        rollingSweeps: SSB_HUNTER_ROLLING_SWEEPS,
        sweepMaxPoints: SSB_HUNTER_SWEEP_MAX_POINTS,
        sweepBroadcastMaxPoints: SSB_HUNTER_BROADCAST_SWEEP_MAX_POINTS,
        broadTargetMhzPerSecond: (SSB_HUNTER_INITIAL_STEP_HZ / SSB_HUNTER_DWELL_MS) / 1_000
      }
	    },
    frequencyControl: {
      command: "FA########;",
      minHz: MIN_FREQUENCY_HZ,
      maxHz: MAX_FREQUENCY_HZ,
      nudgeStepsHz: NUDGE_STEPS_HZ
    },
    pttControl: {
      transmit: "TX1;",
      receive: "TX0;",
      timeoutMs: PTT_TIMEOUT_MS
    },
    defaultRtsHigh: true,
    defaultStopBits: 2,
    txPortPattern: "Paths ending in 1 are blocked because Yaesu's Standard COM Port is commonly used for TX controls."
  });
});

app.get("/api/qrz/config", (_request, response) => {
  const config = getQrzPublicConfig();
  response.json({
    ...config,
    configured: config.configured || Boolean(qrzRuntimeLogbookKey),
    xmlLookupConfigured: config.xmlLookupConfigured || Boolean(qrzXmlRuntimeCredentials?.configured),
    xmlSessionActive: Boolean(qrzXmlRuntimeCredentials?.configured)
  });
});

app.get("/api/pota/spots", async (request, response) => {
  try {
    const profile = getBandProfile(String(request.query.bandId ?? DEFAULT_BAND_ID));
    const includeQrt = request.query.includeQrt === "true";
    const spots = await fetchPotaSpots();
    const filtered = filterPotaSpotsForRange(spots, profile.scanRange, { includeQrt });
    response.json({
      ok: true,
      endpoint: POTA_SPOTS_ENDPOINT,
      userAgent: POTA_USER_AGENT,
      band: publicBandProfile(profile),
      includeQrt,
      total: spots.length,
      count: filtered.length,
      spots: filtered
    });
  } catch (error) {
    response.status(502).json({
      ok: false,
      reason: error.message,
      spots: []
    });
  }
});

app.get("/api/qrz/status", async (_request, response) => {
  try {
    const key = getActiveQrzLogbookKey();
    if (!key) {
      response.status(400).json({ ok: false, reason: "QRZ logbook key is not configured." });
      return;
    }

    const result = await qrzLogbookRequest({ key, action: "STATUS" });
    response.json({
      ok: result.RESULT === "OK",
      result: result.RESULT,
      data: result.DATA ?? "",
      reason: result.REASON ?? ""
    });
  } catch (error) {
    response.status(502).json({ ok: false, reason: error.message });
  }
});

app.get("/api/qrz/callsign/:call", async (request, response) => {
  try {
    const credentials = getActiveQrzXmlCredentials();
    if (!credentials.configured) {
      response.status(401).json({
        ok: false,
        configured: false,
        needsCredentials: true,
        reason: "Enter QRZ XML login to look up callsigns for this app session."
      });
      return;
    }

    const call = String(request.params.call ?? "").trim().toUpperCase();
    if (!call) {
      response.status(400).json({ ok: false, configured: true, reason: "Enter a callsign to look up." });
      return;
    }

    const record = await lookupQrzCallsignWithSession(credentials, call);
    response.json({
      ok: true,
      configured: true,
      record
    });
  } catch (error) {
    response.status(502).json({
      ok: false,
      configured: true,
      reason: error.message
    });
  }
});

app.post("/api/qrz/xml-session", async (request, response) => {
  try {
    const username = String(request.body?.username ?? "").trim();
    const password = String(request.body?.password ?? "");
    const logbookKey = String(request.body?.logbookKey ?? "").trim();
    if (!username || !password) {
      response.status(400).json({
        ok: false,
        needsCredentials: true,
        reason: "Enter QRZ XML username and password."
      });
      return;
    }

    if (logbookKey) {
      const safeLogbookKey = getQrzLogbookKey({ QRZ_LOGBOOK_KEY: logbookKey });
      if (!safeLogbookKey) {
        response.status(400).json({
          ok: false,
          reason: "QRZ logbook API key format did not look valid."
        });
        return;
      }
      qrzRuntimeLogbookKey = safeLogbookKey;
    }

    const credentials = { username, password, configured: true };
    qrzXmlSession = await qrzXmlLogin(credentials);
    qrzXmlRuntimeCredentials = credentials;
    response.json({
      ok: true,
      configured: true,
      username,
      message: qrzXmlSession.message ?? "",
      subExp: qrzXmlSession.subExp ?? ""
    });
  } catch (error) {
    qrzXmlSession = null;
    qrzXmlRuntimeCredentials = null;
    response.status(401).json({
      ok: false,
      needsCredentials: true,
      reason: error.message
    });
  }
});

app.post("/api/qrz/contact", async (request, response) => {
  try {
    const validation = validateQrzContact(request.body?.contact ?? request.body ?? {});
    if (!validation.valid) {
      response.status(400).json({
        ok: false,
        reason: `Missing ${validation.missing.join(", ")}.`
      });
      return;
    }

    if (isCbQrzContact(validation.contact)) {
      response.status(400).json({
        ok: false,
        reason: "CB/11m contacts are local-only in this app and are blocked from QRZ sync."
      });
      return;
    }

    const key = getActiveQrzLogbookKey();
    if (!key) {
      response.status(400).json({ ok: false, reason: "QRZ logbook key is not configured." });
      return;
    }

    const adif = buildQrzContactAdif(validation.contact);
    const result = await qrzLogbookRequest({
      key,
      action: "INSERT",
      adif,
      option: request.body?.replace === true ? "REPLACE" : null
    });
    response.json({
      ok: result.RESULT === "OK" || result.RESULT === "REPLACE",
      result: result.RESULT,
      logid: result.LOGID ?? result.LOGIDS ?? "",
      count: Number(result.COUNT ?? 0),
      reason: result.REASON ?? "",
      contact: validation.contact
    });
  } catch (error) {
    response.status(502).json({ ok: false, reason: error.message });
  }
});

app.get("/api/qrz/logbook", async (request, response) => {
  try {
    const key = getActiveQrzLogbookKey();
    if (!key) {
      response.status(400).json({ ok: false, reason: "QRZ logbook key is not configured.", records: [] });
      return;
    }

    const range = String(request.query.range ?? "30d");
    const pageSize = Math.max(1, Math.min(250, Number.parseInt(request.query.max, 10) || 250));
    const maxPages = Math.max(1, Math.min(40, Number.parseInt(request.query.maxPages, 10) || 20));
    let afterLogId = Math.max(0, Number.parseInt(request.query.afterLogId, 10) || 0);
    let totalCount = 0;
    let lastResult = null;
    let truncated = false;
    const records = [];
    const logids = [];

    for (let page = 0; page < maxPages; page += 1) {
      const option = buildFetchOption({
        range,
        max: pageSize,
        afterLogId
      });
      const result = await qrzLogbookRequest({ key, action: "FETCH", option });
      lastResult = { ...result, OPTION: option };
      totalCount = Math.max(totalCount, Number(result.COUNT ?? 0));
      const pageRecords = parseAdifRecords(result.ADIF ?? "");
      records.push(...pageRecords);
      logids.push(...String(result.LOGIDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean));

      const highestLogid = pageRecords.reduce((max, record) => Math.max(max, Number.parseInt(record.logid, 10) || 0), afterLogId);
      if (pageRecords.length < pageSize || highestLogid <= afterLogId) {
        afterLogId = highestLogid;
        break;
      }

      afterLogId = highestLogid + 1;
      truncated = page === maxPages - 1;
    }

    response.json({
      ok: !lastResult || lastResult.RESULT === "OK" || records.length > 0,
      result: lastResult?.RESULT ?? "OK",
      count: totalCount || records.length,
      records,
      logids: [...new Set(logids)],
      nextAfterLogId: afterLogId > 0 ? afterLogId + 1 : null,
      truncated,
      reason: lastResult?.REASON ?? "",
      option: lastResult?.OPTION ?? ""
    });
  } catch (error) {
    response.status(502).json({ ok: false, reason: error.message, records: [] });
  }
});

app.post("/api/qrz/delete", async (request, response) => {
  try {
    const key = getActiveQrzLogbookKey();
    if (!key) {
      response.status(400).json({ ok: false, reason: "QRZ logbook key is not configured." });
      return;
    }

    const logids = Array.isArray(request.body?.logids) ? request.body.logids : [request.body?.logid];
    const safeLogids = logids.map((value) => String(value ?? "").trim()).filter((value) => /^\d+$/.test(value));
    if (safeLogids.length === 0) {
      response.status(400).json({ ok: false, reason: "Choose at least one QRZ logid to delete." });
      return;
    }

    const result = await qrzLogbookRequest({ key, action: "DELETE", logids: safeLogids });
    response.json({
      ok: result.RESULT === "OK",
      result: result.RESULT,
      count: Number(result.COUNT ?? 0),
      logids: result.LOGIDS ?? "",
      reason: result.REASON ?? ""
    });
  } catch (error) {
    response.status(502).json({ ok: false, reason: error.message });
  }
});

app.get("/api/ports", async (_request, response) => {
  try {
    const ports = await SerialPort.list();
    response.json({
      ports: ports
        .filter((port) => port.path)
        .map((port) => {
          const path = toMacCalloutPath(port.path);

          return {
            path,
            rawPath: port.path,
            manufacturer: port.manufacturer ?? "",
            serialNumber: port.serialNumber ?? "",
            vendorId: port.vendorId ?? "",
            productId: port.productId ?? "",
            blocked: isLikelyRiskyTxPort(path),
            recommended: /usbserial-[\w-]+0$/i.test(path)
          };
        })
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/audio-inputs", async (_request, response) => {
  try {
    response.json({
      inputs: await listMacAudioInputs()
    });
  } catch (error) {
    response.status(500).json({ error: error.message, inputs: [] });
  }
});

wss.on("connection", (socket) => {
  send(socket, {
    type: "hello",
    readOnlyCommands: READ_ONLY_COMMANDS,
    radioPowerOn
  });
  send(socket, {
    type: "powerState",
    radioPowerOn
  });

  if (session) {
    session.addClient(socket);
  }

  socket.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "connect") {
        await handleConnect(socket, message);
      } else if (message.type === "disconnect") {
        await stopSession("Disconnected");
      } else if (message.type === "radioPower") {
        await handleRadioPower(message);
      } else if (message.type === "setTuneKeys") {
        handleSetTuneKeys(socket, message);
      } else if (message.type === "nudge") {
        handleNudge(socket, message);
      } else if (message.type === "setMode") {
        handleSetMode(socket, message);
      } else if (message.type === "setRfGain") {
        handleSetRfGain(socket, message);
      } else if (message.type === "setMicGain") {
        handleSetMicGain(socket, message);
      } else if (message.type === "setRadioMonitorEnabled") {
        handleSetRadioMonitorEnabled(socket, message);
      } else if (message.type === "setRadioMonitorLevel") {
        handleSetRadioMonitorLevel(socket, message);
      } else if (message.type === "setProcessorLevel") {
        handleSetProcessorLevel(socket, message);
      } else if (message.type === "setProcessorEnabled") {
        handleSetProcessorEnabled(socket, message);
      } else if (message.type === "setParametricEqEnabled") {
        handleSetParametricEqEnabled(socket, message);
      } else if (message.type === "setRadioPowerSwitch") {
        handleSetRadioPowerSwitch(socket, message);
      } else if (message.type === "setPtt") {
        await handleSetPtt(socket, message);
      } else if (message.type === "audioScanSample") {
        handleAudioScanSample(socket, message);
      } else if (message.type === "applyBandPreset") {
        handleApplyBandPreset(socket, message);
      } else if (message.type === "setChannel") {
        handleSetChannel(socket, message);
      } else if (message.type === "setFrequency") {
        handleSetFrequency(socket, message);
      } else if (message.type === "startAntennaTuner") {
        handleStartAntennaTuner(socket, message);
      } else if (message.type === "startScan") {
        await handleStartScan(socket, message);
      } else if (message.type === "setSmartList") {
        handleSetSmartList(socket, message);
      } else if (message.type === "setScanOptions") {
        handleSetScanOptions(socket, message);
      } else if (message.type === "setScanDwell") {
        handleSetScanDwell(socket, message);
      } else if (message.type === "stopScan") {
        handleStopScan(socket);
      } else if (message.type === "jumpToHit") {
        handleJumpToHit(socket, message);
      } else if (message.type === "skipScanHit") {
        handleSkipScanHit(socket, message);
      } else if (message.type === "skipHunterTarget") {
        handleSkipHunterTarget(socket);
      } else if (message.type === "setHunterOptions") {
        handleSetHunterOptions(socket, message);
      } else if (message.type === "clearScanSkips") {
        handleClearScanSkips(socket);
      }
    } catch (error) {
      send(socket, { type: "error", message: error.message });
    }
  });

  socket.on("close", () => {
    if (session) {
      session.removeClient(socket);
    }
  });
});

async function handleConnect(socket, message) {
  if (!radioPowerOn) {
    throw new Error("Radio deck is powered down.");
  }

  const path = String(message.path ?? "");
  const baudRate = Number.parseInt(message.baudRate, 10);
  const pollMs = normalizePollMs(message.pollMs);
  const rtsHigh = message.rtsHigh !== false;
  const stopBits = Number.parseInt(message.stopBits, 10) === 1 ? 1 : 2;

  if (!path.startsWith("/dev/cu.")) {
    throw new Error("Choose a macOS callout serial port beginning with /dev/cu.");
  }

  if (isLikelyRiskyTxPort(path)) {
    throw new Error("This looks like the Yaesu Standard COM Port, which can be used for TX controls. It is blocked here.");
  }

  if (!BAUD_RATES.includes(baudRate)) {
    throw new Error(`Choose one of these CAT rates: ${BAUD_RATES.join(", ")}.`);
  }

  const connectTarget = normalizeConnectTuneTarget(message);

  await stopSession("Replacing connection");
  session = new CatReadOnlySession({
    path,
    baudRate,
    pollMs,
    rtsHigh,
    stopBits,
    bandId: connectTarget.bandId,
    customChannels: message.customChannels
  });
  session.addClient(socket);
  await session.open({
    autoTune: message.autoTune === true,
    targetHz: connectTarget.hz
  });
}

async function handleRadioPower(message) {
  radioPowerOn = message.powered !== false;
  if (!radioPowerOn) {
    await stopSession("Powered down");
  }
  broadcastPowerState();
}

function broadcastPowerState() {
  for (const client of wss.clients) {
    send(client, {
      type: "powerState",
      radioPowerOn,
      updatedAt: new Date().toISOString()
    });
  }
}

function handleSetTuneKeys(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before enabling tune keys.");
  }

  session.setTuneKeysEnabled(Boolean(message.enabled));
}

function handleNudge(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before tuning.");
  }

  session.nudgeFrequency(Number.parseInt(message.stepHz, 10));
}

function handleSetMode(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before setting mode.");
  }

  session.setMode(String(message.mode ?? ""));
}

function handleSetRfGain(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before setting RF gain.");
  }

  session.setRfGain(Number.parseInt(message.value, 10));
}

function handleSetMicGain(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before setting mic gain.");
  }

  session.setMicGain(Number.parseInt(message.value, 10));
}

function handleSetRadioMonitorEnabled(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before changing MONI.");
  }

  session.setRadioMonitorEnabled(message.enabled === true);
}

function handleSetRadioMonitorLevel(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before setting monitor level.");
  }

  session.setRadioMonitorLevel(Number.parseInt(message.value, 10));
}

function handleSetProcessorLevel(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before setting processor level.");
  }

  session.setProcessorLevel(Number.parseInt(message.value, 10));
}

function handleSetProcessorEnabled(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before changing the speech processor.");
  }

  session.setProcessorEnabled(message.enabled === true);
}

function handleSetParametricEqEnabled(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before changing the parametric EQ.");
  }

  session.setParametricEqEnabled(message.enabled === true);
}

async function handleSetRadioPowerSwitch(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before using the radio power switch.");
  }

  await session.setRadioPowerSwitch(message.powered === true);
}

async function handleSetPtt(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before using PTT.");
  }

  await session.setPtt(message.transmitting === true);
}

function handleAudioScanSample(socket, message) {
  if (!session || !session.clients.has(socket)) {
    return;
  }

  session.recordAudioScanSample({
    bandId: message.bandId,
    hz: Number.parseInt(message.hz, 10),
    tunedAt: Number.parseInt(message.tunedAt, 10),
    levelPercent: Number(message.levelPercent),
    dbfs: Number(message.dbfs),
    clipPercent: Number(message.clipPercent),
    voiceScore: Number(message.voiceScore),
    voiceLikely: message.voiceLikely === true,
    peakHz: Number(message.peakHz),
    centroidHz: Number(message.centroidHz),
    midRatio: Number(message.midRatio),
    lowRatio: Number(message.lowRatio),
    highRatio: Number(message.highRatio),
    voiceTextureScore: Number(message.voiceTextureScore),
    voiceSpread: Number(message.voiceSpread),
    voicePeakToMean: Number(message.voicePeakToMean),
    manualStudy: message.manualStudy === true
  });
}

function handleApplyBandPreset(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before applying a band preset.");
  }

  const bandId = String(message.bandId ?? "");
  if (!Object.hasOwn(BAND_PROFILES, bandId)) {
    throw new Error("Choose a supported band preset.");
  }
  session.applyBandPreset(bandId, {
    customChannels: message.customChannels,
    autoTune: message.autoTune === true
  });
}

function handleSetChannel(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before tuning a channel.");
  }

  session.setChannel(String(message.bandId ?? ""), Number.parseInt(message.channelNumber, 10));
}

function handleSetFrequency(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before tuning a frequency.");
  }

  session.setFrequency(String(message.bandId ?? ""), Number.parseInt(message.hz, 10));
}

function handleStartAntennaTuner(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before starting the antenna tuner.");
  }

  session.startAntennaTuner(String(message.bandId ?? ""));
}

async function handleStartScan(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before scanning.");
  }

  await session.startScan({
    thresholdS: Number.parseInt(message.thresholdS, 10),
    stepHz: Number.parseInt(message.stepHz, 10),
    dwellMs: Number(message.dwellMs),
    bandId: message.bandId,
    intent: message.intent,
    scanSource: message.scanSource,
    customChannels: message.customChannels,
    smartList: message.smartList !== false,
    readableMode: message.readableMode !== false,
    useBusy: message.useBusy === true,
    audioAssist: message.audioAssist === true,
    durationMs: Number.parseInt(message.durationMs, 10),
    audioThresholdPercent: Number(message.audioThresholdPercent),
    audioLiftGatePercent: Number(message.audioLiftGatePercent),
    autoRfGainEnabled: message.autoRfGainEnabled === true,
    rfGainTargetLiftPercent: Number(message.rfGainTargetLiftPercent),
    lockMs: Number(message.lockMs)
  });
}

function handleSetSmartList(socket, message) {
  if (!session || !session.clients.has(socket)) {
    return;
  }

  session.setSmartList(Boolean(message.enabled));
}

function handleSetScanOptions(socket, message) {
  if (!session || !session.clients.has(socket)) {
    return;
  }

  session.setScanOptions({
    stepHz: Number.parseInt(message.stepHz, 10),
    scanSource: message.scanSource,
    customChannels: message.customChannels
  });
}

function handleSetScanDwell(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before changing scan dwell.");
  }

  session.setScanDwell(Number.parseInt(message.dwellMs, 10));
}

function handleStopScan(socket) {
  if (!session || !session.clients.has(socket)) {
    return;
  }

  session.stopScan("stopped");
}

function handleJumpToHit(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before jumping to a hit.");
  }

  session.jumpToHit(String(message.id ?? ""));
}

function handleSkipScanHit(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before skipping a channel.");
  }

  session.skipScanHit(String(message.id ?? ""));
}

function handleSkipHunterTarget(socket) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before skipping SSB Hunter.");
  }

  session.skipHunterTarget();
}

function handleSetHunterOptions(socket, message) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before changing SSB Hunter settings.");
  }

  const options = {};
  if ("audioThresholdPercent" in message) {
    options.audioThresholdPercent = Number(message.audioThresholdPercent);
  }
  if ("audioLiftGatePercent" in message) {
    options.audioLiftGatePercent = Number(message.audioLiftGatePercent);
  }
  if ("lockMs" in message) {
    options.lockMs = Number(message.lockMs);
  }
  if ("dwellMs" in message) {
    options.dwellMs = Number(message.dwellMs);
  }
  if ("autoRfGainEnabled" in message) {
    options.autoRfGainEnabled = message.autoRfGainEnabled === true;
  }
  if ("rfGainTargetLiftPercent" in message) {
    options.rfGainTargetLiftPercent = Number(message.rfGainTargetLiftPercent);
  }

  session.setHunterOptions(options);
}

function handleClearScanSkips(socket) {
  if (!session || !session.clients.has(socket)) {
    throw new Error("Connect to the radio before clearing skipped channels.");
  }

  session.clearScanSkips();
}

async function listMacAudioInputs() {
  const { stdout } = await execFileAsync("system_profiler", ["SPAudioDataType", "-json"], {
    maxBuffer: 1024 * 1024,
    timeout: 5000
  });
  const profile = JSON.parse(stdout);
  const devices = (profile.SPAudioDataType ?? []).flatMap((section) => section._items ?? []);

  return devices
    .filter((device) => Number(device.coreaudio_device_input) > 0)
    .map((device) => ({
      name: device._name ?? "Unknown audio input",
      channels: Number(device.coreaudio_device_input),
      sampleRate: Number(device.coreaudio_device_srate) || null,
      manufacturer: device.coreaudio_device_manufacturer ?? "",
      transport: normalizeAudioTransport(device.coreaudio_device_transport),
      default: device.coreaudio_default_audio_input_device === "spaudio_yes"
    }));
}

function normalizeAudioTransport(transport) {
  return String(transport ?? "")
    .replace(/^coreaudio_device_type_/, "")
    .replace(/^spaudio_/, "")
    .toUpperCase();
}

async function stopSession(reason) {
  if (!session) {
    return;
  }

  const oldSession = session;
  session = null;
  await oldSession.close(reason);
}

class CatReadOnlySession {
  constructor({ path, baudRate, pollMs, rtsHigh, stopBits, bandId, customChannels }) {
    this.path = path;
    this.baudRate = baudRate;
    this.pollMs = pollMs;
    this.rtsHigh = rtsHigh;
    this.stopBits = stopBits;
    this.customChannels = customChannels;
    this.bandProfile = profileWithCustomChannels(getBandProfile(bandId), customChannels);
    this.clients = new Set();
    this.readBuffer = "";
    this.pollTimer = null;
    this.scanTimer = null;
    this.scanMeterTimer = null;
    this.scanBusyTimer = null;
    this.autoTuneTimer = null;
    this.powerSwitchTimer = null;
    this.pttTimeoutTimer = null;
    this.pttActive = false;
    this.noFramesTimer = null;
    this.framesSeen = 0;
    this.lastStateBroadcastAt = 0;
    this.pendingStateBroadcastTimer = null;
    this.lastHunterBackpressureAt = 0;
    this.lastModePollAt = 0;
    this.lastFrequencyPollAt = 0;
    this.lastMeterPollAt = 0;
	    this.meterPollIndex = 0;
	    this.lastRfGainPollAt = 0;
	    this.lastPowerSwitchPollAt = 0;
	    this.lastTxAudioPollAt = 0;
	    this.txAudioPollIndex = 0;
	    this.recentHunterTunes = [];
    this.tuneKeysEnabled = true;
    this.pendingScanMeter = null;
    this.pendingScanBusy = null;
    this.currentBusy = null;
    this.scan = createIdleScanState(this.bandProfile.scanRange, this.bandProfile);
    this.lastState = {
      type: "state",
      status: "opening",
      path,
      baudRate,
      pollMs,
      rtsHigh,
      dtrHigh: false,
      stopBits,
      frequency: null,
      hz: null,
      mode: null,
      meter: null,
      powerMeter: null,
	      swrMeter: null,
	      rfGain: null,
	      txAudio: createEmptyTxAudioState(),
	      radioPowerSwitch: null,
      raw: "",
      rxCount: 0,
      tuneKeysEnabled: true,
      ptt: {
        active: false,
        timeoutMs: PTT_TIMEOUT_MS
      },
      band: publicBandProfile(this.bandProfile),
      scan: this.scan,
      modelId: null,
      lastCommand: null
    };
    this.port = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
      dataBits: 8,
      parity: "none",
      stopBits,
      rtscts: false
    });

    this.port.on("data", (chunk) => this.handleData(chunk));
    this.port.on("error", (error) => this.broadcastError(error.message));
    this.port.on("close", () => this.broadcast({ ...this.lastState, status: "closed" }));
  }

  addClient(socket) {
    this.clients.add(socket);
    send(socket, this.lastState);
  }

  removeClient(socket) {
    this.clients.delete(socket);
    if (this.pttActive) {
      void this.setPtt(false, { force: true, reason: "client closed" });
    }
  }

  setTuneKeysEnabled() {
    this.tuneKeysEnabled = true;
    this.updateState({ tuneKeysEnabled: true });
  }

  async setPtt(transmitting, options = {}) {
    const active = transmitting === true;

    if (active && this.scan.active) {
      this.broadcastError("Stop scan before using PTT.");
      return false;
    }

    if (!this.port.isOpen) {
      this.clearPttTimeout();
      this.pttActive = false;
      this.updatePttState(false, { reason: options.reason });
      return false;
    }

    return this.writePttCommand(formatSetTransmitCommand(active), active, options);
  }

  async setRadioPowerSwitch(powered) {
    const desiredOn = powered === true;
    if (!this.port.isOpen) {
      this.broadcastError("CAT port is not open for radio power control.");
      return false;
    }

    if (!desiredOn) {
      this.stopScan("radio power");
      if (this.pttActive) {
        await this.setPtt(false, { force: true, reason: "radio power" });
      }
    }

    if (this.powerSwitchTimer) {
      clearTimeout(this.powerSwitchTimer);
      this.powerSwitchTimer = null;
    }

    const command = formatSetPowerSwitchCommand(desiredOn);
    this.updateState({
      lastCommand: "PS;",
      radioPowerSwitch: {
        on: desiredOn,
        pending: true,
        updatedAt: new Date().toISOString()
      }
    });
    this.port.write("PS;", (dummyError) => {
      if (dummyError) {
        this.broadcastError(dummyError.message);
        return;
      }

      this.powerSwitchTimer = setTimeout(() => {
        this.powerSwitchTimer = null;
        if (!this.port.isOpen) {
          return;
        }

        this.updateState({ lastCommand: command });
        this.port.write(command, (error) => {
          if (error) {
            this.broadcastError(error.message);
            return;
          }

          this.updateState({
            raw: command,
            radioPowerSwitch: {
              on: desiredOn,
              pending: false,
              updatedAt: new Date().toISOString()
            }
          });
          setTimeout(() => {
            if (this.port.isOpen) {
              this.writeReadCommand("PS;");
            }
          }, 450);
        });
      }, 1200);
    });
    return true;
  }

  clearPttTimeout() {
    if (this.pttTimeoutTimer) {
      clearTimeout(this.pttTimeoutTimer);
      this.pttTimeoutTimer = null;
    }
  }

  armPttTimeout() {
    this.clearPttTimeout();
    this.pttTimeoutTimer = setTimeout(() => {
      this.pttTimeoutTimer = null;
      void this.setPtt(false, { force: true, reason: "timeout" }).then(() => {
        this.broadcastError("PTT timeout released after 2 minutes.");
      });
    }, PTT_TIMEOUT_MS);
  }

  updatePttState(active, options = {}) {
    const { reason, ...patch } = options;
    const ptt = {
      active,
      timeoutMs: PTT_TIMEOUT_MS,
      updatedAt: new Date().toISOString()
    };

    if (reason) {
      ptt.reason = reason;
    }

    this.updateState({
      ...patch,
      ptt
    });
  }

  async writePttCommand(command, active, options = {}) {
    this.updateState({ lastCommand: command });

    return new Promise((resolve) => {
      this.port.write(command, (error) => {
        if (error) {
          this.broadcastError(error.message);
          resolve(false);
          return;
        }

        if (active) {
          this.armPttTimeout();
        } else {
          this.clearPttTimeout();
        }

        this.pttActive = active;
        this.updatePttState(active, {
          lastCommand: command,
          raw: command,
          reason: options.reason
        });

        if (this.port.isOpen) {
          this.port.drain(() => resolve(true));
          return;
        }

        resolve(true);
      });
    });
  }

  async open(options = {}) {
    await new Promise((resolve, reject) => {
      this.port.open((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      this.port.set({ rts: this.rtsHigh, dtr: false }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.updateState({ status: "connected" });
    this.applyBandPreset(this.bandProfile.id, {
      autoTune: options.autoTune === true,
      targetHz: options.targetHz
    });
    this.writeReadCommand("ID;");
    this.writeReadCommand("MD0;");
    this.writeReadCommand("RM1;");
    this.writeReadCommand("RM5;");
    this.writeReadCommand("RM6;");
    this.writeReadCommand("RG0;");
    this.writeReadCommand("BY;");
    this.writeReadCommand("PS;");
    for (const command of TX_AUDIO_READ_COMMANDS) {
      this.writeReadCommand(command);
    }
    this.pollTimer = setInterval(() => this.poll(), Math.min(this.pollMs, IDLE_FREQUENCY_POLL_MS));
    this.noFramesTimer = setTimeout(() => {
      if (this.framesSeen === 0) {
        this.broadcastError("Connected, but no CAT replies yet. Check RTS line, stop bits, CAT rate, or other CAT apps.");
      }
    }, 3500);
    this.poll();
  }

  async close(reason = "Closed") {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }

    if (this.scanMeterTimer) {
      clearTimeout(this.scanMeterTimer);
      this.scanMeterTimer = null;
    }
    if (this.scanBusyTimer) {
      clearTimeout(this.scanBusyTimer);
      this.scanBusyTimer = null;
    }
    if (this.autoTuneTimer) {
      clearTimeout(this.autoTuneTimer);
      this.autoTuneTimer = null;
    }
    if (this.powerSwitchTimer) {
      clearTimeout(this.powerSwitchTimer);
      this.powerSwitchTimer = null;
    }
    this.pendingScanMeter = null;
    this.pendingScanBusy = null;

    if (this.noFramesTimer) {
      clearTimeout(this.noFramesTimer);
      this.noFramesTimer = null;
    }
    if (this.pendingStateBroadcastTimer) {
      clearTimeout(this.pendingStateBroadcastTimer);
      this.pendingStateBroadcastTimer = null;
    }

    if (this.pttActive) {
      await this.setPtt(false, { force: true, reason: "session closing" });
    } else {
      this.clearPttTimeout();
    }

    this.updateState({ status: reason });

    if (this.port.isOpen) {
      await new Promise((resolve) => this.port.close(() => resolve()));
    }
  }

  nudgeFrequency(stepHz) {
    if (this.scan.active) {
      this.broadcastError("Stop scan before using tune keys.");
      return;
    }

    if (!this.tuneKeysEnabled) {
      this.broadcastError("Tune keys are off.");
      return;
    }

    if (!NUDGE_STEPS_HZ.includes(stepHz)) {
      this.broadcastError("Unsupported frequency step.");
      return;
    }

    const currentHz = this.lastState.hz;
    if (!Number.isInteger(currentHz)) {
      this.broadcastError("No current VFO A frequency yet.");
      return;
    }

    const nextHz = currentHz + stepHz;
    let command;

    try {
      command = formatSetVfoAFrequencyCommand(nextHz);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeSetFrequencyCommand(command, nextHz, stepHz);
  }

  setMode(mode) {
    let command;
    let rfCommand;

    try {
      command = formatSetModeCommand(mode);
      rfCommand = formatSetRfGainCommand(this.bandProfile.defaultRfGain);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeModeCommand(command);
    this.writeRfGainCommand(rfCommand, this.bandProfile.defaultRfGain);
  }

  setRfGain(value) {
    let command;

    try {
      command = formatSetRfGainCommand(value);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeRfGainCommand(command, Number.parseInt(value, 10));
  }

  setMicGain(value) {
    let command;

    try {
      command = formatSetMicGainCommand(value);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeTxAudioValueCommand(command, {
      micGain: {
        value: Number.parseInt(value, 10),
        percent: Number.parseInt(value, 10)
      }
    }, "MG;");
  }

  setRadioMonitorEnabled(enabled) {
    const command = formatSetMonitorEnabledCommand(enabled);
    this.writeTxAudioValueCommand(command, {
      monitor: {
        ...this.lastState.txAudio?.monitor,
        enabled: enabled === true
      }
    }, "ML0;");
  }

  setRadioMonitorLevel(value) {
    let command;

    try {
      command = formatSetMonitorLevelCommand(value);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeTxAudioValueCommand(command, {
      monitor: {
        ...this.lastState.txAudio?.monitor,
        level: Number.parseInt(value, 10)
      }
    }, "ML1;");
  }

  setProcessorLevel(value) {
    let command;

    try {
      command = formatSetProcessorLevelCommand(value);
    } catch (error) {
      this.broadcastError(error.message);
      return;
    }

    this.writeTxAudioValueCommand(command, {
      processor: {
        ...this.lastState.txAudio?.processor,
        level: Number.parseInt(value, 10)
      }
    }, "PL;");
  }

  setProcessorEnabled(enabled) {
    const command = formatSetProcessorEnabledCommand(enabled);
    this.writeTxAudioValueCommand(command, {
      processor: {
        ...this.lastState.txAudio?.processor,
        enabled: enabled === true
      }
    }, "PR0;");
  }

  setParametricEqEnabled(enabled) {
    const command = formatSetParametricEqEnabledCommand(enabled);
    this.writeTxAudioValueCommand(command, {
      parametricEq: {
        ...this.lastState.txAudio?.parametricEq,
        enabled: enabled === true
      }
    }, "PR1;");
  }

  setChannel(bandId, channelNumber) {
    const previousBandId = this.bandProfile.id;
    const profile = getBandProfile(bandId);
    const channel = findChannel(profile, channelNumber);
    if (!channel) {
      this.broadcastError("Channel preset not found.");
      return;
    }

    this.bandProfile = profile;
    this.stopScan("channel");
    if (previousBandId !== profile.id || this.scan.bandId !== profile.id) {
      this.scan = createIdleScanState(profile.scanRange, profile);
    }
    this.updateState({ band: publicBandProfile(profile), scan: this.scan });
    if (profile.defaultMode) {
      this.writeModeCommand(formatSetModeCommand(profile.defaultMode));
    }
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(channel.hz), channel.hz, 0, { channel });
  }

  setFrequency(bandId, hz) {
    const previousBandId = this.bandProfile.id;
    const profile = !bandId || bandId === previousBandId ? this.bandProfile : getBandProfile(bandId);
    const range = profile.scanRange;
    if (!Number.isInteger(hz)) {
      this.broadcastError("Choose a valid frequency.");
      return;
    }

    if (hz < range.startHz || hz > range.endHz) {
      this.broadcastError(`Frequency must stay inside ${profile.scanLabel}.`);
      return;
    }

    if (this.scan.active) {
      this.broadcastError("Stop scan before moving frequency manually.");
      return;
    }

    const snappedHz = snapToScanStep(hz, FREQUENCY_SLIDER_STEP_HZ, range);
    this.bandProfile = profile;
    if (previousBandId !== profile.id || this.scan.bandId !== profile.id) {
      this.scan = createIdleScanState(profile.scanRange, profile);
    }
    this.updateState({ band: publicBandProfile(profile), scan: this.scan });
    const channel = findChannelForHz(profile, snappedHz);
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(snappedHz), snappedHz, 0, { channel });
  }

  startAntennaTuner(bandId) {
    const profile = this.bandProfile;
    if (bandId && bandId !== profile.id) {
      this.broadcastError("Select the band preset before starting the antenna tuner.");
      return;
    }
    if (this.pttActive) {
      this.broadcastError("Release PTT before using the antenna tuner.");
      return;
    }

    if (this.scan.active) {
      this.broadcastError("Stop scan before starting the antenna tuner.");
      return;
    }

    if (!Number.isInteger(this.lastState.hz) || this.lastState.hz < profile.scanRange.startHz || this.lastState.hz > profile.scanRange.endHz) {
      this.broadcastError(`Tune VFO A inside ${profile.scanLabel} before starting the antenna tuner.`);
      return;
    }

    const command = formatStartAntennaTunerCommand();
    this.writeAntennaTunerCommand(command);
  }

  scheduleAutoAntennaTune(bandId) {
    if (this.autoTuneTimer) {
      clearTimeout(this.autoTuneTimer);
      this.autoTuneTimer = null;
    }

    this.autoTuneTimer = setTimeout(() => {
      this.autoTuneTimer = null;
      if (!this.port.isOpen || this.bandProfile.id !== bandId || this.scan.active) {
        return;
      }

      this.startAntennaTuner(bandId);
    }, 750);
  }

  async startScan({
    thresholdS,
    stepHz,
    dwellMs,
    bandId,
    intent = "smart",
    scanSource,
    customChannels,
    smartList = true,
    readableMode,
    useBusy,
    audioAssist,
    durationMs,
    audioThresholdPercent,
    audioLiftGatePercent,
    autoRfGainEnabled = false,
    rfGainTargetLiftPercent,
    lockMs
  }) {
    if (this.autoTuneTimer) {
      clearTimeout(this.autoTuneTimer);
      this.autoTuneTimer = null;
    }

    const previousBandId = this.bandProfile.id;
    this.bandProfile = profileWithCustomChannels(
      getBandProfile(bandId ?? this.bandProfile.id),
      customChannels
    );
    const samePreviousBand = previousBandId === this.bandProfile.id && this.scan?.bandId === this.bandProfile.id;
    const previousSkippedChannelNumbers = samePreviousBand
      ? this.scan.skippedChannelNumbers ?? []
      : [];
    const previousHits = samePreviousBand ? this.scan.hits ?? [] : [];
    const scanRange = this.bandProfile.scanRange;
    const safeThresholdS = S_UNITS.includes(thresholdS) ? thresholdS : 3;
    const hunterAudioThresholdPercent = normalizeHunterAudioThresholdPercent(audioThresholdPercent);
    const hunterAudioLiftGatePercent = normalizeHunterAudioLiftGatePercent(audioLiftGatePercent);
    const hunterRfGainTargetLiftPercent = normalizeHunterAutoRfGainTargetPercent(rfGainTargetLiftPercent);
    const hunterLockMs = normalizeHunterLockMs(lockMs);
    const scanIntent = intent === "busy"
      ? "busy"
      : intent === "regular"
      ? "regular"
      : intent === "ssbHunter"
      ? "ssbHunter"
      : "smart";
    if (scanIntent === "ssbHunter" && !["USB", "LSB"].includes(String(this.lastState.mode ?? "").toUpperCase())) {
      this.broadcastError("Choose USB or LSB before starting SSB Hunter.");
      return;
    }
    if (["smart", "regular", "ssbHunter"].includes(scanIntent) && !audioAssist) {
      this.broadcastError(scanIntent === "ssbHunter"
        ? "Start audio before SSB Hunter."
        : "Start audio before scanning.");
      return;
    }
    const safeStepHz = scanIntent === "ssbHunter"
      ? SSB_HUNTER_INITIAL_STEP_HZ
      : SCAN_STEPS_HZ.includes(stepHz)
      ? stepHz
      : 1000;
    const audioAssistEnabled = ["smart", "regular", "ssbHunter"].includes(scanIntent);
    const scanDurationMs = scanIntent === "smart" ? normalizeScanDurationMs(durationMs) : null;
    const smartListEnabled = smartList !== false;
    if (scanIntent === "smart" && !smartListEnabled) {
      this.broadcastError("Smart top 5 is off.");
      return;
    }
    if (String(scanSource) === "top5" && previousHits.length === 0) {
      this.broadcastError("No Smart Top 5 entries to scan yet.");
      return;
    }
    const safeScanSource = scanIntent === "ssbHunter"
      ? "frequency"
      : normalizeScanSource(scanSource, this.bandProfile, previousHits);
    const scanMode = scanSourceToMode(safeScanSource);
    const channelScan = scanMode === "channels";
    const topHitScan = scanMode === "topHits";
    const safeDwellMs = scanIntent === "busy"
      ? BUSY_SCAN_DWELL_MS
      : scanIntent === "ssbHunter"
      ? normalizeHunterDwellMs(dwellMs)
      : regularAudioScanDwellMs({
        bandId: this.bandProfile.id,
        intent: scanIntent,
        requestedDwellMs: normalizeScanDwellMs(dwellMs)
      });
    const activeDwellMs = scanIntent === "ssbHunter"
      ? hunterDwellForStep(SSB_HUNTER_INITIAL_STEP_HZ, safeDwellMs)
      : safeDwellMs;
    const skippedChannelNumbers = channelScan && previousBandId === this.bandProfile.id
      ? normalizeSkippedChannelNumbers(previousSkippedChannelNumbers, this.bandProfile.channels)
      : [];
    let startChannelIndex = channelScan
      ? findChannelIndexForHz(this.bandProfile.channels, this.lastState.hz, this.bandProfile.defaultChannel)
      : -1;
    let startChannel = channelScan ? this.bandProfile.channels[startChannelIndex] : null;
    if (startChannel && isSkippedChannel(startChannel, skippedChannelNumbers)) {
      const nextStart = nextScanChannel(startChannelIndex, 1, this.bandProfile.channels, skippedChannelNumbers);
      startChannelIndex = nextStart.channelIndex;
      startChannel = nextStart.channel;
    }
    const startTopHit = topHitScan ? findTopHitStart(previousHits, this.lastState.hz) : null;
    const startHz = channelScan
      ? startChannel?.hz
      : topHitScan
      ? startTopHit?.peakHz
      : this.lastState.hz >= scanRange.startHz && this.lastState.hz <= scanRange.endHz
      ? snapToScanStep(this.lastState.hz, safeStepHz, scanRange)
      : scanRange.startHz;

    if (!Number.isInteger(startHz)) {
      this.broadcastError(topHitScan
        ? "No Smart Top 5 entries to scan yet."
        : "Every channel in this scan list is skipped. Clear skipped channels to scan again.");
      return;
    }

    if (this.pttActive) {
      await this.setPtt(false, { force: true, reason: "scan" });
    }

    const preservedHits = smartListEnabled ? rankScanHits(previousHits).slice(0, MAX_SCAN_HITS) : [];
    const startedAtMs = Date.now();
    this.scan = {
      ...createIdleScanState(scanRange, this.bandProfile),
      active: true,
      intent: scanIntent,
      scanSource: safeScanSource,
      scanMode,
      status: scanIntent === "busy"
        ? "busy scanning"
        : scanIntent === "regular"
        ? "audio scanning"
        : scanIntent === "ssbHunter"
        ? "SSB Hunter seeking"
        : "audio smart scanning",
      thresholdS: safeThresholdS,
      thresholdRaw: approxSToRawMeter(safeThresholdS),
      readableMode: false,
      audioAssist: audioAssistEnabled,
      smartList: smartListEnabled,
      useBusy: scanIntent === "busy",
      stepHz: safeStepHz,
      dwellMs: activeDwellMs,
      direction: 1,
      currentHz: startHz,
      channelIndex: startChannelIndex,
      currentChannel: startChannel ? publicChannel(startChannel) : null,
      topHitIndex: topHitScan ? findTopHitIndex(previousHits, startTopHit?.id) : -1,
      skippedChannelNumbers,
	      busyHold: null,
	      audioHold: null,
	      cbAudioAdaptive: isCbRegularAudioScan({ bandId: this.bandProfile.id, intent: scanIntent })
	        ? { falseStops: 0, goodStops: 0, lastOutcome: "start" }
	        : null,
	      hunter: scanIntent === "ssbHunter"
        ? createInitialHunterState({
          startHz,
          now: startedAtMs,
          dwellMs: safeDwellMs,
          audioThresholdPercent: hunterAudioThresholdPercent,
          audioLiftGatePercent: hunterAudioLiftGatePercent,
          lockMs: hunterLockMs
        })
        : null,
      tuneCount: 1,
      ratePerSecond: 0,
      tunedAt: startedAtMs,
      startedAt: new Date(startedAtMs).toISOString(),
      durationMs: scanDurationMs,
      endsAt: scanDurationMs ? startedAtMs + scanDurationMs : null,
      hits: preservedHits,
      strongest: preservedHits[0] ?? null
    };
    if (this.scan.hunter) {
      this.scan = {
        ...this.scan,
        hunter: {
          ...this.scan.hunter,
          autoRfGainEnabled: autoRfGainEnabled === true,
          rfGainTargetLiftPercent: hunterRfGainTargetLiftPercent
        }
      };
    }
    this.updateState({
      band: publicBandProfile(this.bandProfile),
      scan: this.scan,
      tuneKeysEnabled: true
    });
    this.startScanTimer();
    if (this.bandProfile.defaultMode && scanIntent !== "ssbHunter") {
      this.writeModeCommand(formatSetModeCommand(this.bandProfile.defaultMode));
    }
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(startHz), startHz, 0, { channel: startChannel });
    if (scanIntent === "busy") {
      this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
    }
  }

  setScanDwell(dwellMs) {
    const safeDwellMs = regularAudioScanDwellMs({
      bandId: this.bandProfile.id,
      intent: this.scan.intent,
      requestedDwellMs: normalizeScanDwellMs(dwellMs)
    });
    this.scan = {
      ...this.scan,
      dwellMs: safeDwellMs
    };
    if (this.scan.active) {
      this.startScanTimer();
    }
    this.updateState({ scan: this.scan });
  }

  setScanOptions({ stepHz, scanSource, customChannels }) {
    this.bandProfile = profileWithCustomChannels(this.bandProfile, customChannels);
    const safeStepHz = SCAN_STEPS_HZ.includes(stepHz) ? stepHz : this.scan.stepHz;
    if (String(scanSource) === "top5" && (this.scan.hits?.length ?? 0) === 0) {
      this.broadcastError("No Smart Top 5 entries to scan yet.");
      return;
    }
    const safeScanSource = normalizeScanSource(scanSource, this.bandProfile, this.scan.hits);
    const scanMode = scanSourceToMode(safeScanSource);

    const sourceChanged = safeScanSource !== this.scan.scanSource;
    const nextPatch = {
      stepHz: safeStepHz,
      scanSource: safeScanSource,
      scanMode,
      channels: (this.bandProfile.channels ?? []).map(publicChannel)
    };

    if (sourceChanged && scanMode === "channels") {
      const channelIndex = findChannelIndexForHz(this.bandProfile.channels, this.lastState.hz, this.bandProfile.defaultChannel);
      nextPatch.channelIndex = channelIndex;
      nextPatch.currentChannel = this.bandProfile.channels[channelIndex]
        ? publicChannel(this.bandProfile.channels[channelIndex])
        : null;
    } else if (sourceChanged && scanMode === "range") {
      nextPatch.currentChannel = null;
      nextPatch.channelIndex = -1;
      nextPatch.currentHz = this.lastState.hz >= this.bandProfile.scanRange.startHz && this.lastState.hz <= this.bandProfile.scanRange.endHz
        ? snapToScanStep(this.lastState.hz, safeStepHz, this.bandProfile.scanRange)
        : this.bandProfile.scanRange.startHz;
    } else if (sourceChanged && scanMode === "topHits") {
      const startTopHit = findTopHitStart(this.scan.hits, this.lastState.hz);
      nextPatch.topHitIndex = findTopHitIndex(this.scan.hits, startTopHit?.id);
      nextPatch.currentChannel = null;
      nextPatch.channelIndex = -1;
      nextPatch.currentHz = startTopHit?.peakHz ?? this.scan.currentHz;
    }

    this.scan = {
      ...this.scan,
      ...nextPatch
    };
    this.updateState({ scan: this.scan });

    if (!this.scan.active || !sourceChanged) {
      return;
    }

    if (this.scanMeterTimer) {
      clearTimeout(this.scanMeterTimer);
      this.scanMeterTimer = null;
    }
    if (this.scanBusyTimer) {
      clearTimeout(this.scanBusyTimer);
      this.scanBusyTimer = null;
    }
    this.pendingScanMeter = null;
    this.pendingScanBusy = null;
    const now = Date.now();
    this.advanceScanChannel(now);
    if (this.scan.active && this.scan.intent === "busy") {
      this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
    } else if (this.scan.active && !this.scan.audioAssist) {
      this.scheduleScanMeterRead();
    }
  }

  setSmartList(enabled) {
    const smartList = Boolean(enabled);
    this.scan = {
      ...this.scan,
      smartList,
      ...(smartList ? {} : {
        hits: [],
        skippedChannelNumbers: [],
        strongest: null,
        verify: null
      })
    };

    if (!smartList && this.scan.active && this.scan.intent === "smart") {
      this.stopScan("smart off");
      return;
    }

    this.updateState({ scan: this.scan });
  }

  stopScan(status = "stopped") {
    if (!this.scan.active) {
      return;
    }

    this.scan = {
      ...this.scan,
      active: false,
      status
    };
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    if (this.scanMeterTimer) {
      clearTimeout(this.scanMeterTimer);
      this.scanMeterTimer = null;
    }
    if (this.scanBusyTimer) {
      clearTimeout(this.scanBusyTimer);
      this.scanBusyTimer = null;
    }
    this.pendingScanMeter = null;
    this.pendingScanBusy = null;
    this.updateState({ scan: this.scan });
  }

  jumpToHit(id) {
    const hit = this.scan.hits.find((candidate) => candidate.id === id);
    if (!hit) {
      this.broadcastError("Scan hit not found.");
      return;
    }

    this.stopScan("jumped");
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(hit.peakHz), hit.peakHz, 0);
  }

  skipScanHit(id) {
    const hit = this.scan.hits.find((candidate) => candidate.id === id);
    if (!hit) {
      this.broadcastError("Scan hit not found.");
      return;
    }

    if (!Number.isInteger(hit.channelNumber)) {
      this.broadcastError("Skip is available for channelized hits.");
      return;
    }

    this.skipChannelNumber(hit.channelNumber, hit.channelLabel ?? `CH ${String(hit.channelNumber).padStart(2, "0")}`);
  }

  skipHunterTarget() {
    if (!this.scan.active || this.scan.intent !== "ssbHunter" || !this.scan.hunter) {
      this.broadcastError("SSB Hunter is not running.");
      return;
    }

    const hunter = this.scan.hunter;
    const range = this.scan.range;
    const suspectHz = firstIntegerInRange([
      hunter.envelope?.suspectHz,
      hunter.bestHz,
      hunter.envelope?.bestHz,
      hunter.lastHeardHz,
      this.scan.currentHz
    ], range);
    const skipHz = suspectHz ?? this.scan.currentHz;
    const skippedHz = normalizeSkippedHunterFrequencies([
      ...(hunter.skippedHz ?? []),
      ...(Number.isInteger(skipHz) ? [skipHz] : [])
    ], range);
    const hunterWithSkip = {
      ...hunter,
      skippedHz
    };
    const forwardAnchorCandidates = [
      hunter.bestHz,
      hunter.resumeHz,
	      hunter.envelope?.suspectHz,
	      hunter.envelope?.lastHeardHz,
	      hunter.envelope?.highEdgeHz,
	      hunter.envelope?.surveyEndHz,
	      hunter.envelope?.bestHz
	    ]
      .filter(Number.isInteger)
      .filter((hz) => hz >= range.startHz && hz <= range.endHz)
      .filter((hz) => !Number.isInteger(skipHz) || hz >= skipHz);
    const highestKnownHz = forwardAnchorCandidates.length > 0
      ? Math.max(...forwardAnchorCandidates)
      : Math.min(range.endHz, Math.max(range.startHz, Number.isInteger(skipHz) ? skipHz : range.startHz));
    const skipPocketEndHz = Number.isInteger(skipHz)
      ? Math.min(range.endHz, skipHz + SSB_HUNTER_SKIP_SPAN_HZ)
      : highestKnownHz;
    const forwardResumeHz = firstUnskippedHunterFrequencyAtOrAfter(
      Math.max(highestKnownHz, skipPocketEndHz + 1),
      SSB_HUNTER_INITIAL_STEP_HZ,
      range,
      hunterWithSkip
    );
    const resumeHz = forwardResumeHz ?? nextUnskippedHunterFrequency(
      range.startHz - SSB_HUNTER_INITIAL_STEP_HZ,
      1,
      SSB_HUNTER_INITIAL_STEP_HZ,
      range,
      {
        ...hunterWithSkip,
        skippedHz: []
      }
    );
    const now = Date.now();
    this.leaveHunterSuspect(now, "skipped target; resuming wide hunt", {
      skipHz,
      resumeHz
    });
  }

  setHunterOptions(options = {}) {
    if (!this.scan.active || this.scan.intent !== "ssbHunter" || !this.scan.hunter) {
      return;
    }

    const hunter = this.scan.hunter;
    const nextHunter = { ...hunter };
    if (Number.isFinite(Number(options.audioThresholdPercent))) {
      nextHunter.audioThresholdPercent = normalizeHunterAudioThresholdPercent(options.audioThresholdPercent);
    }
    if (Number.isFinite(Number(options.audioLiftGatePercent))) {
      nextHunter.audioLiftGatePercent = normalizeHunterAudioLiftGatePercent(options.audioLiftGatePercent);
    }
    if (Number.isFinite(Number(options.lockMs))) {
      nextHunter.lockMs = normalizeHunterLockMs(options.lockMs);
    }
    if (Number.isFinite(Number(options.dwellMs))) {
      nextHunter.baseDwellMs = normalizeHunterDwellMs(options.dwellMs);
    }
    if ("autoRfGainEnabled" in options) {
      nextHunter.autoRfGainEnabled = options.autoRfGainEnabled === true;
    }
    if (Number.isFinite(Number(options.rfGainTargetLiftPercent))) {
      nextHunter.rfGainTargetLiftPercent = normalizeHunterAutoRfGainTargetPercent(options.rfGainTargetLiftPercent);
    }

    const audioLiftGatePercent = normalizeHunterAudioLiftGatePercent(nextHunter.audioLiftGatePercent);
    const audioThresholdPercent = normalizeHunterAudioThresholdPercent(nextHunter.audioThresholdPercent);
    const rfGainTargetLiftPercent = normalizeHunterAutoRfGainTargetPercent(nextHunter.rfGainTargetLiftPercent);
    const lockMs = normalizeHunterLockMs(nextHunter.lockMs);
    const autoRfGainEnabled = nextHunter.autoRfGainEnabled === true;
    const baseDwellMs = normalizeHunterDwellMs(nextHunter.baseDwellMs);
    const dwellMs = hunterDwellForStep(nextHunter.stepHz ?? this.scan.stepHz ?? SSB_HUNTER_INITIAL_STEP_HZ, baseDwellMs);
    this.scan = {
      ...this.scan,
      dwellMs,
      hunter: {
        ...nextHunter,
        audioThresholdPercent,
        audioLiftGatePercent,
        autoRfGainEnabled,
        rfGainTargetLiftPercent,
        baseDwellMs,
        dwellMs,
        lockMs,
        decision: `RX lift +${audioLiftGatePercent}% | base ${baseDwellMs} ms | RF ${autoRfGainEnabled ? `auto +${rfGainTargetLiftPercent}%` : "manual"} | lock ${Math.round(lockMs / 1000)}s`
      }
    };
    this.updateState({ scan: this.scan });
  }

  clearScanSkips() {
    this.scan = {
      ...this.scan,
      skippedChannelNumbers: []
    };
    this.updateState({ scan: this.scan });
  }

  cbRegularAudioDwellPatch(outcome) {
    const result = adaptCbRegularAudioDwell({
      bandId: this.bandProfile.id,
      intent: this.scan.intent,
      currentDwellMs: this.scan.dwellMs,
      adaptive: this.scan.cbAudioAdaptive,
      outcome
    });
    return {
      dwellMs: result.dwellMs,
      cbAudioAdaptive: result.adaptive
    };
  }

  skipChannelNumber(channelNumber, label) {
    const skippedChannelNumbers = normalizeSkippedChannelNumbers(
      [...(this.scan.skippedChannelNumbers ?? []), channelNumber],
      this.scan.channels
    );
    const hits = this.scan.hits.filter((hit) => hit.channelNumber !== channelNumber);
    const skippingCurrent = this.scan.currentChannel?.number === channelNumber
      || this.scan.busyHold?.channel?.number === channelNumber
      || this.scan.verify?.channel?.number === channelNumber;

    if (this.scan.scanMode === "channels" && skippedChannelNumbers.length >= this.scan.channels.length) {
      this.scan = {
        ...this.scan,
        skippedChannelNumbers,
        hits,
        strongest: rankScanHits(hits)[0] ?? null
      };
      this.updateState({ scan: this.scan });
      this.stopScan("all skipped");
      return;
    }

    this.scan = {
      ...this.scan,
      status: skippingCurrent && this.scan.active ? `skipped ${label}` : this.scan.status,
      skippedChannelNumbers,
      hits,
      strongest: rankScanHits(hits)[0] ?? null,
      verify: this.scan.verify?.channel?.number === channelNumber ? null : this.scan.verify,
      busyHold: this.scan.busyHold?.channel?.number === channelNumber ? null : this.scan.busyHold
    };
    this.updateState({ scan: this.scan });

    if (!this.scan.active || !skippingCurrent) {
      return;
    }

    if (this.scanMeterTimer) {
      clearTimeout(this.scanMeterTimer);
      this.scanMeterTimer = null;
    }
    if (this.scanBusyTimer) {
      clearTimeout(this.scanBusyTimer);
      this.scanBusyTimer = null;
    }
    this.pendingScanMeter = null;
    this.pendingScanBusy = null;
    const now = Date.now();
    this.advanceScanChannel(now);
    if (this.scan.active && this.scan.intent === "busy") {
      this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
    } else if (this.scan.active && !this.scan.audioAssist) {
      this.scheduleScanMeterRead();
    }
  }

  poll() {
    const now = Date.now();
    const frequencyPollMs = this.scan.intent === "ssbHunter" && !this.scan.active
      ? HUNTER_IDLE_FREQUENCY_POLL_MS
      : this.scan.intent === "ssbHunter"
      ? HUNTER_FREQUENCY_POLL_MS
      : 0;
    const shouldPollFrequency = !this.scan.active
      || (frequencyPollMs > 0 && now - this.lastFrequencyPollAt >= frequencyPollMs);
    if (shouldPollFrequency) {
      this.lastFrequencyPollAt = now;
      this.writeReadCommand("FA;");
    }

    if (!this.scan.active && now - this.lastMeterPollAt >= METER_POLL_MS) {
      this.lastMeterPollAt = now;
      this.writeReadCommand(LIVE_METER_COMMANDS[this.meterPollIndex]);
      this.meterPollIndex = (this.meterPollIndex + 1) % LIVE_METER_COMMANDS.length;
    }

    if (now - this.lastModePollAt >= MODE_POLL_MS) {
      this.lastModePollAt = now;
      this.writeReadCommand("MD0;");
    }

    const rfGainPollMs = this.scan.active ? SCANNING_RF_GAIN_POLL_MS : RF_GAIN_POLL_MS;
    if (now - this.lastRfGainPollAt >= rfGainPollMs && !this.isCatWriteBackpressured()) {
      this.lastRfGainPollAt = now;
      this.writeReadCommand("RG0;");
    }

    if (!this.scan.active && now - this.lastPowerSwitchPollAt >= POWER_SWITCH_POLL_MS) {
      this.lastPowerSwitchPollAt = now;
      this.writeReadCommand("PS;");
    }

    if (!this.scan.active && now - this.lastTxAudioPollAt >= TX_AUDIO_POLL_MS) {
      this.lastTxAudioPollAt = now;
      this.writeReadCommand(TX_AUDIO_READ_COMMANDS[this.txAudioPollIndex]);
      this.txAudioPollIndex = (this.txAudioPollIndex + 1) % TX_AUDIO_READ_COMMANDS.length;
    }
  }

  startScanTimer() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
    }

    const intervalMs = this.scan.intent === "ssbHunter"
      ? Math.max(1, Math.floor(this.scan.dwellMs / 2))
      : Math.max(5, Math.floor(this.scan.dwellMs / 2));
    this.scanTimer = setInterval(() => this.scanTick(), intervalMs);
  }

  scheduleScanMeterRead(delayOverrideMs = null) {
    if (this.scanMeterTimer) {
      clearTimeout(this.scanMeterTimer);
    }

    const latestUsefulReadMs = Math.max(SCAN_SETTLE_MS, this.scan.dwellMs - 5);
    const dwellMs = this.scan.verify?.active || this.scan.busyHold?.active
      ? READABLE_VERIFY_MS
      : this.scan.dwellMs;
    const delayMs = Number.isInteger(delayOverrideMs)
      ? Math.max(0, delayOverrideMs)
      : Math.min(Math.max(SCAN_SETTLE_MS, Math.floor(this.scan.dwellMs * 0.55)), latestUsefulReadMs);
    const meterTarget = {
      hz: this.scan.currentHz,
      channel: this.scan.currentChannel,
      tunedAt: this.scan.tunedAt,
      dwellMs,
      requestedAt: null
    };
    this.scanMeterTimer = setTimeout(() => {
      this.scanMeterTimer = null;
      if (this.scan.active) {
        if (this.pendingScanMeter) {
          this.updateScanMetrics({
            ...this.scan.metrics,
            missedSampleCount: this.scan.metrics.missedSampleCount + 1
          });
        }
        this.pendingScanMeter = {
          ...meterTarget,
          requestedAt: Date.now()
        };
        this.updateScanMetrics({
          ...this.scan.metrics,
          meterRequestCount: this.scan.metrics.meterRequestCount + 1
        });
        this.writeReadCommand("RM1;");
        if (this.scan.intent === "smart" && this.scan.useBusy) {
          this.writeReadCommand("BY;");
        }
      }
    }, delayMs);
  }

  scheduleBusyRead(delayMs = BUSY_SCAN_POLL_MS) {
    if (this.scanBusyTimer) {
      clearTimeout(this.scanBusyTimer);
    }

    const busyTarget = {
      hz: this.scan.currentHz,
      channel: this.scan.currentChannel,
      tunedAt: this.scan.tunedAt,
      requestedAt: null
    };
    this.scanBusyTimer = setTimeout(() => {
      this.scanBusyTimer = null;
      if (this.scan.active && this.scan.intent === "busy") {
        this.pendingScanBusy = {
          ...busyTarget,
          requestedAt: Date.now()
        };
        this.writeReadCommand("BY;");
      }
    }, Math.max(0, delayMs));
  }

  scanTick() {
    if (!this.scan.active) {
      return;
    }

    const now = Date.now();
    if (this.scan.intent === "smart" && Number.isFinite(this.scan.endsAt) && now >= this.scan.endsAt) {
      this.stopScan("complete");
      return;
    }

    if (this.scan.intent === "busy") {
      if (this.pendingScanBusy?.requestedAt && now - this.pendingScanBusy.requestedAt > BUSY_SCAN_RESPONSE_TIMEOUT_MS) {
        this.pendingScanBusy = null;
        this.scheduleBusyRead(this.scan.busyHold?.active ? BUSY_SCAN_POLL_MS : 0);
        return;
      }

      if (this.scan.busyHold?.active || this.pendingScanBusy || this.scanBusyTimer) {
        return;
      }

      if (now - this.scan.tunedAt < this.scan.dwellMs) {
        return;
      }

      this.advanceScanChannel(now);
      this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
      return;
    }

    if (this.scan.intent === "regular") {
      if (this.scan.audioHold?.active) {
        if (this.scan.audioHold.verifying === true) {
          if (now >= this.scan.audioHold.verifyUntil) {
            const dwellPatch = this.cbRegularAudioDwellPatch("falseStop");
            this.scan = {
              ...this.scan,
              status: "audio scanning",
              ...dwellPatch,
              audioHold: null,
              tunedAt: now - (dwellPatch.dwellMs ?? this.scan.dwellMs)
            };
            this.updateState({ scan: this.scan });
            this.advanceScanChannel(now);
          }
          return;
        }

        if (Number.isFinite(this.scan.audioHold.holdUntil)) {
          if (now >= this.scan.audioHold.holdUntil) {
            this.scan = {
              ...this.scan,
              status: "audio scanning",
              audioHold: null,
              tunedAt: now - this.scan.dwellMs
            };
            this.updateState({ scan: this.scan });
            this.advanceScanChannel(now);
          }
          return;
        }

        const clearMs = Number.isFinite(this.scan.audioHold.clearMs)
          ? this.scan.audioHold.clearMs
          : BUSY_SCAN_CLEAR_MS;
        const clearSince = this.scan.audioHold.clearSince
          ?? (now - this.scan.audioHold.lastVoiceAt > clearMs ? this.scan.audioHold.lastVoiceAt : null);
        if (clearSince && now - clearSince >= clearMs) {
          const heldMs = now - (this.scan.audioHold.startedAt ?? now);
          const cbAudioHold = isCbRegularAudioScan({
            bandId: this.bandProfile.id,
            intent: this.scan.intent
          });
          const dwellPatch = cbAudioHold
            ? this.cbRegularAudioDwellPatch(heldMs < CB_REGULAR_AUDIO_SHORT_HOLD_MS ? "falseStop" : "goodStop")
            : {};
          this.scan = {
            ...this.scan,
            status: "audio scanning",
            ...dwellPatch,
            audioHold: null,
            tunedAt: now - (dwellPatch.dwellMs ?? this.scan.dwellMs)
          };
          this.updateState({ scan: this.scan });
          this.advanceScanChannel(now);
        }
        return;
      }

      if (now - this.scan.tunedAt < this.scan.dwellMs) {
        return;
      }

      const cbAdaptive = this.scan.cbAudioAdaptive;
      const recoveringCbBlip = Number(cbAdaptive?.falseStops ?? 0) > 0
        || Number(cbAdaptive?.quietPasses ?? 0) > 0;
      if (recoveringCbBlip && isCbRegularAudioScan({ bandId: this.bandProfile.id, intent: this.scan.intent })) {
        const dwellPatch = this.cbRegularAudioDwellPatch("quietPass");
        if (dwellPatch.dwellMs !== this.scan.dwellMs
          || dwellPatch.cbAudioAdaptive.falseStops !== this.scan.cbAudioAdaptive?.falseStops
          || dwellPatch.cbAudioAdaptive.quietPasses !== this.scan.cbAudioAdaptive?.quietPasses) {
          this.scan = {
            ...this.scan,
            ...dwellPatch
          };
          this.updateState({ scan: this.scan });
        }
      }

      this.advanceScanChannel(now);
      return;
    }

    if (this.scan.intent === "ssbHunter") {
      this.scanSsbHunterTick(now);
      return;
    }

    if (this.scan.verify?.active) {
      if (now >= this.scan.verify.until) {
        this.finalizeReadableVerify();
        return;
      }

      if (now >= this.scan.verify.nextSampleAt && !this.scanMeterTimer) {
        this.scan = {
          ...this.scan,
          verify: {
            ...this.scan.verify,
            nextSampleAt: now + READABLE_VERIFY_SAMPLE_MS
          }
        };
        this.updateState({ scan: this.scan });
        this.scheduleScanMeterRead(0);
      }
      return;
    }

    if (now - this.scan.tunedAt < this.scan.dwellMs) {
      return;
    }

    this.advanceScanChannel(now);
    if (!this.scan.audioAssist) {
      this.scheduleScanMeterRead();
    }
  }

  scanSsbHunterTick(now) {
    const hunter = this.scan.hunter;
    if (!hunter) {
      this.stopScan("hunter idle");
      return;
    }

    if (hunter.phase === "locked") {
      if (!shouldLeaveHunterLock(now, hunter)) {
        return;
      }

      const resumeHz = postSuspectResumeFrequency(hunter, hunter.bestHz ?? this.scan.currentHz, this.scan.range);
      const dwellMs = hunterDwellForStep(SSB_HUNTER_INITIAL_STEP_HZ, hunter.baseDwellMs);
      this.scan = {
        ...this.scan,
        status: "SSB Hunter seeking",
        dwellMs,
        hunter: {
          ...hunter,
	          phase: "seeking",
	          stepHz: SSB_HUNTER_INITIAL_STEP_HZ,
	          dwellMs,
	          direction: 1,
		          decision: "lock expired; resuming hunt",
		          resumeHz,
		          lockUntil: null,
		          envelope: null,
		          fastCandidates: [],
		          samples: []
		        }
	      };
	      this.updateState({ scan: this.scan });
	      this.tuneHunterFrequency(resumeHz, now);
	      return;
	    }

	    if (now - this.scan.tunedAt < this.scan.dwellMs) {
      return;
    }

    if (hunter.phase === "refining") {
      this.processHunterDwell(now);
      return;
    }

    this.processHunterDwell(now);
  }

  advanceScanChannel(now) {
    if (this.scan.intent === "ssbHunter" && this.isCatWriteBackpressured()) {
      this.noteHunterBackpressure(now);
      return;
    }

    const next = this.scan.intent === "ssbHunter"
      ? nextHunterScanTarget(this.scan, now)
      : this.scan.scanMode === "channels"
      ? nextScanChannel(this.scan.channelIndex, this.scan.direction, this.scan.channels, this.scan.skippedChannelNumbers)
      : this.scan.scanMode === "topHits"
      ? nextTopHit(this.scan.topHitIndex, this.scan.direction, this.scan.hits)
      : nextScanFrequency(this.scan.currentHz, this.scan.direction, this.scan.stepHz, this.scan.range);
    if (!Number.isInteger(next.hz)) {
      this.stopScan("no channels");
      return;
    }

    const previousTarget = Number.isInteger(this.scan.currentHz)
      ? {
        hz: this.scan.currentHz,
        channel: this.scan.currentChannel,
        channelIndex: this.scan.channelIndex,
        tunedAt: this.scan.tunedAt
      }
      : this.scan.previousTarget;
    const tuneCount = (this.scan.tuneCount ?? 0) + 1;
    const startedAt = Date.parse(this.scan.startedAt);
    const elapsedSeconds = Number.isFinite(startedAt) ? Math.max((now - startedAt) / 1000, 0.001) : 0;
    const ratePerSecond = elapsedSeconds > 0
      ? Math.round((tuneCount / elapsedSeconds) * 10) / 10
      : 0;
    this.scan = {
      ...this.scan,
      currentHz: next.hz,
      channelIndex: next.channelIndex ?? this.scan.channelIndex,
      currentChannel: next.channel ? publicChannel(next.channel) : null,
      previousTarget,
      topHitIndex: next.topHitIndex ?? this.scan.topHitIndex,
      direction: next.direction,
      audioHold: null,
      hunter: this.scan.hunter ? {
        ...this.scan.hunter,
        ...(next.hunterPatch ?? {}),
        samples: [],
        sampleCount: 0
      } : this.scan.hunter,
      tuneCount,
      ratePerSecond,
      tunedAt: now
    };
    this.updateState({ scan: this.scan });
    if (this.scan.intent === "ssbHunter") {
      this.rememberHunterTune(next.hz, now);
    }
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(next.hz), next.hz, 0, { verify: false, channel: next.channel });
  }

  tuneHunterFrequency(hz, now, patch = {}) {
    if (!Number.isInteger(hz)) {
      return;
    }

    if (this.scan.intent === "ssbHunter" && this.isCatWriteBackpressured()) {
      this.noteHunterBackpressure(now);
      return;
    }

    const targetHz = Math.min(this.scan.range.endHz, Math.max(this.scan.range.startHz, Math.round(hz)));
    const tuneCount = (this.scan.tuneCount ?? 0) + 1;
    const startedAt = Date.parse(this.scan.startedAt);
    const elapsedSeconds = Number.isFinite(startedAt) ? Math.max((now - startedAt) / 1000, 0.001) : 0;
    const ratePerSecond = elapsedSeconds > 0
      ? Math.round((tuneCount / elapsedSeconds) * 10) / 10
      : 0;

    this.scan = {
      ...this.scan,
      currentHz: targetHz,
      currentChannel: null,
      tuneCount,
      ratePerSecond,
      tunedAt: now,
      hunter: this.scan.hunter ? {
        ...this.scan.hunter,
        ...patch,
        samples: [],
        sampleCount: 0
      } : this.scan.hunter
    };
    this.updateState({ scan: this.scan });
    this.rememberHunterTune(targetHz, now);
    this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(targetHz), targetHz, 0, { verify: false });
  }

  beginHunterEnvelopeSurvey(now, hunter, score) {
    const hz = Number.isInteger(hunter?.bestHz) ? hunter.bestHz : this.scan.currentHz;
    if (!Number.isInteger(hz)) {
      return;
    }

    const envelope = createHunterEnvelope({
      suspectHz: hz,
      range: this.scan.range,
      now,
      score
    });
    const dwellMs = hunterEnvelopeDwellForStep(envelope, hunter.baseDwellMs);
    const resumeHz = forwardHunterResumeFrequency(hunter.resumeHz, hz, this.scan.range, hunter);
	    const nextHunter = {
	      ...hunter,
      phase: "mapping",
      stepHz: envelope.stepHz,
      dwellMs,
      direction: 1,
      bestHz: envelope.bestHz,
      bestScore: envelope.bestScore,
      lastHeardAt: now,
      resumeHz,
      envelope,
      refinePasses: 0,
      peakMisses: 0,
      belowGateMisses: 0,
      sweep: hunter.sweep,
      decision: "suspect found; rewinding to map envelope",
      samples: [],
      sampleCount: 0
    };

    this.scan = {
      ...this.scan,
      status: "SSB Hunter mapping",
      dwellMs,
      hunter: nextHunter
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(envelope.surveyStartHz, now);
  }

  continueHunterEnvelopeSurvey(now, hunter, score) {
    const hz = this.scan.currentHz;
    if (!Number.isInteger(hz)) {
      return;
    }

    const seedEnvelope = hunter.envelope ?? createHunterEnvelope({
      suspectHz: hunter.bestHz ?? hz,
      range: this.scan.range,
      now,
      score
    });
    const envelope = updateHunterEnvelopeWithScore(seedEnvelope, hz, score, now);
    const nextHz = nextHunterEnvelopeSurveyFrequency(hz, envelope, this.scan.range);
    if (!Number.isInteger(nextHz)) {
      this.finishHunterEnvelopeSurvey(now, hunter, envelope, "envelope mapped; refining inside signal edges");
      return;
    }

    const dwellMs = hunterEnvelopeDwellForStep(envelope, hunter.baseDwellMs);
    this.scan = {
      ...this.scan,
      status: "SSB Hunter mapping",
      dwellMs,
      hunter: {
        ...hunter,
        phase: "mapping",
        stepHz: envelope.stepHz,
        dwellMs,
        direction: 1,
        bestHz: envelope.bestHz,
        bestScore: envelope.bestScore,
        lastHeardAt: now,
        envelope,
        belowGateMisses: 0,
        decision: `mapping envelope; best ${parseCatFrame(formatSetVfoAFrequencyCommand(envelope.bestHz)).display}`,
        samples: [],
        sampleCount: 0
      }
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(nextHz, now);
  }

  handleHunterEnvelopeNoHit(now, hunter) {
    const hz = this.scan.currentHz;
    if (!Number.isInteger(hz)) {
      return;
    }

    const envelope = hunter.envelope ?? createHunterEnvelope({
      suspectHz: hunter.bestHz ?? hz,
      range: this.scan.range,
      now
    });
    const heardDuringSurvey = Number.isInteger(envelope.firstHeardHz);
    const nextEnvelope = {
      ...envelope,
      missesAfterHeard: heardDuringSurvey ? (envelope.missesAfterHeard ?? 0) + 1 : 0,
      updatedAt: now
    };
    if (heardDuringSurvey && nextEnvelope.missesAfterHeard >= SSB_HUNTER_ENVELOPE_MISS_LIMIT) {
      this.finishHunterEnvelopeSurvey(now, hunter, nextEnvelope, "far edge found; refining around mapped peak");
      return;
    }

	    const nextHz = nextHunterEnvelopeSurveyFrequency(hz, nextEnvelope, this.scan.range);
	    if (!Number.isInteger(nextHz)) {
	      if (!heardDuringSurvey) {
	        const resumeHz = firstUnskippedHunterFrequencyAtOrAfter(
	          (nextEnvelope.surveyEndHz ?? hz) + SSB_HUNTER_INITIAL_STEP_HZ,
	          SSB_HUNTER_INITIAL_STEP_HZ,
	          this.scan.range,
	          hunter
	        );
	        this.leaveHunterSuspect(now, "survey quiet; resuming wide hunt", { resumeHz });
	        return;
	      }

	      this.finishHunterEnvelopeSurvey(
	        now,
	        hunter,
	        nextEnvelope,
	        "survey end reached; refining envelope"
	      );
	      return;
	    }

    const dwellMs = hunterEnvelopeDwellForStep(nextEnvelope, hunter.baseDwellMs);
    this.scan = {
      ...this.scan,
      status: "SSB Hunter mapping",
      dwellMs,
      hunter: {
        ...hunter,
        phase: "mapping",
        stepHz: nextEnvelope.stepHz,
        dwellMs,
        direction: 1,
        envelope: nextEnvelope,
        decision: heardDuringSurvey
          ? `past last lift ${nextEnvelope.missesAfterHeard}/${SSB_HUNTER_ENVELOPE_MISS_LIMIT}; bracketing peak`
          : "rewind survey; sniffing for first signal edge",
        samples: [],
        sampleCount: 0
      }
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(nextHz, now);
  }

  finishHunterEnvelopeSurvey(now, hunter, envelope, decision) {
    const seedHz = envelope?.suspectHz ?? hunter.bestHz ?? this.scan.currentHz;
    if (!Number.isInteger(seedHz)) {
      this.leaveHunterSuspect(now, "envelope survey lost target");
      return;
    }

    const lowEdgeHz = Number.isInteger(envelope?.lowEdgeHz) ? envelope.lowEdgeHz : seedHz;
    const highEdgeHz = Number.isInteger(envelope?.highEdgeHz) ? envelope.highEdgeHz : seedHz;
    const bestHz = Number.isInteger(envelope?.bestHz) ? envelope.bestHz : seedHz;
    const normalizedEnvelope = {
      ...envelope,
      active: true,
      stage: "refining",
      lowEdgeHz: Math.min(lowEdgeHz, highEdgeHz),
      highEdgeHz: Math.max(lowEdgeHz, highEdgeHz),
      bestHz,
      bestScore: Number.isFinite(envelope?.bestScore) ? envelope.bestScore : hunter.bestScore ?? 0,
      updatedAt: now
    };
    const stepHz = hunterInitialRefineStepForEnvelope(normalizedEnvelope);
    const dwellMs = hunterDwellForStep(stepHz, hunter.baseDwellMs);
    const resumeHz = postSuspectResumeFrequency({
      ...hunter,
      envelope: normalizedEnvelope,
      bestHz
    }, bestHz, this.scan.range);
    const candidateHunter = {
      ...hunter,
      phase: "refining",
      stepHz,
      dwellMs,
      direction: 1,
      bestHz,
      bestScore: normalizedEnvelope.bestScore,
      lastHeardAt: Number.isFinite(hunter.lastHeardAt) ? hunter.lastHeardAt : now,
      resumeHz,
      envelope: normalizedEnvelope,
      refinePasses: 0,
      peakMisses: 0,
      belowGateMisses: 0,
      decision,
      samples: [],
      sampleCount: 0
    };
    const targetHz = clampHunterRefineFrequency(bestHz, candidateHunter, this.scan.range);

    this.scan = {
      ...this.scan,
      status: "SSB Hunter refining",
      dwellMs,
      hunter: candidateHunter
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(targetHz, now);
  }

  handleHunterNoHit(now) {
    const hunter = this.scan.hunter;
    if (!hunter) {
      return;
    }

    if (Number.isInteger(hunter.bestHz) && isMinimumHunterStep(hunter.stepHz)) {
      const belowGateMisses = (hunter.belowGateMisses ?? 0) + 1;
      if (belowGateMisses >= SSB_HUNTER_MIN_STEP_MISS_LIMIT) {
        this.leaveHunterSuspect(now, "audio stayed below gate; resuming wide hunt");
        return;
      }

      const stepHz = hunter.stepHz;
      const dwellMs = hunterDwellForStep(stepHz, hunter.baseDwellMs);
      const direction = hunter.direction === -1 ? 1 : -1;
      const targetHz = clampHunterRefineFrequency(
        nextUnskippedHunterFrequency(hunter.bestHz, direction, stepHz, this.scan.range, hunter),
        {
          ...hunter,
          phase: "refining"
        },
        this.scan.range
      );
      this.scan = {
        ...this.scan,
        status: "SSB Hunter refining",
        dwellMs,
        hunter: {
          ...hunter,
          phase: "refining",
          dwellMs,
          direction,
          belowGateMisses,
          decision: `audio dipped; probing suspect ${belowGateMisses}/${SSB_HUNTER_MIN_STEP_MISS_LIMIT}`,
          samples: [],
          sampleCount: 0
        }
      };
      this.updateState({ scan: this.scan });
      this.tuneHunterFrequency(targetHz, now);
      return;
    }

    const stepHz = reduceHunterStep(hunter.stepHz);
    const dwellMs = hunterDwellForStep(stepHz, hunter.baseDwellMs);
    const direction = hunter.direction === -1 ? 1 : -1;
    const targetHz = clampHunterRefineFrequency(
      nextUnskippedHunterFrequency(hunter.bestHz ?? this.scan.currentHz, direction, stepHz, this.scan.range, hunter),
      {
        ...hunter,
        phase: "refining"
      },
      this.scan.range
    );
    this.scan = {
      ...this.scan,
      status: "SSB Hunter refining",
      dwellMs,
      hunter: {
        ...hunter,
        phase: "refining",
        stepHz,
        dwellMs,
        direction,
        decision: "overshot; reversing and narrowing",
        samples: []
      }
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(targetHz, now);
  }

  leaveHunterSuspect(now, decision, options = {}) {
    const hunter = this.scan.hunter;
    if (!hunter) {
      return;
    }

    const skipHz = Number.isInteger(options.skipHz) ? options.skipHz : null;
    const skippedHz = normalizeSkippedHunterFrequencies([
      ...(hunter.skippedHz ?? []),
      ...(skipHz === null ? [] : [skipHz])
    ], this.scan.range);
    const dwellMs = hunterDwellForStep(SSB_HUNTER_INITIAL_STEP_HZ, hunter.baseDwellMs);
    const nextHunter = {
      ...hunter,
      phase: "seeking",
      stepHz: SSB_HUNTER_INITIAL_STEP_HZ,
      dwellMs,
      direction: 1,
      bestHz: null,
      bestScore: 0,
      currentScore: 0,
      refinePasses: 0,
      peakMisses: 0,
	      belowGateMisses: 0,
	      lastImprovedAt: null,
	      lockUntil: null,
	      envelope: null,
	      fastCandidates: [],
	      skippedHz,
      decision,
      samples: [],
      sampleCount: 0
    };
    const explicitResumeHz = Number.isInteger(options.resumeHz) ? options.resumeHz : null;
    const resumeBaseHz = explicitResumeHz ?? skipHz ?? postSuspectAnchorFrequency(hunter, this.scan.currentHz, this.scan.range);
    const resumeHz = explicitResumeHz === null || isHunterFrequencySkipped(explicitResumeHz, nextHunter)
      ? nextUnskippedHunterFrequency(
        resumeBaseHz,
        1,
        SSB_HUNTER_INITIAL_STEP_HZ,
        this.scan.range,
        nextHunter
      )
      : explicitResumeHz;
    this.scan = {
      ...this.scan,
      status: "SSB Hunter seeking",
      dwellMs,
      hunter: {
        ...nextHunter,
        resumeHz
      }
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(resumeHz, now);
  }

  processHunterDwell(now) {
    const hunter = this.scan.hunter;
    if (!hunter) {
      return false;
    }

    const samples = hunter.samples ?? [];
    const noiseFloorPercent = estimateHunterNoiseFloor(hunter, this.scan.currentHz);
    const score = scoreSsbHunterSamples(samples, {
      minAudioLevelPercent: hunter.audioThresholdPercent,
      minSignalLiftPercent: hunter.audioLiftGatePercent,
      noiseFloorPercent
    });
    const lastSample = samples[samples.length - 1] ?? {};
    const hasAudioSample = score.sampleCount > 0;
    const floor = hasAudioSample
      ? updateHunterNoiseFloor(hunter, this.scan.currentHz, score, now)
      : hunter.floor;
    const sweep = hasAudioSample
      ? updateHunterSweep(hunter, this.scan.currentHz, score, now)
      : hunter.sweep;
    const nextHunter = {
      ...hunter,
      toneRejected: score.toneRejected,
      broadbandRejected: score.broadbandRejected,
      modulationScore: score.modulationScore,
      audioStrength: score.audioStrength,
      noiseFloorPercent: score.noiseFloorPercent,
      signalLiftPercent: score.signalLiftPercent,
      voiceLikeScore: score.voiceLikeScore,
      spectralVoiceScore: score.spectralVoiceScore,
      currentScore: score.score,
      sampleCount: score.sampleCount,
      floor,
      sweep,
	      decision: score.reason
	    };

    if (hunter.phase === "seeking" && isHunterFastLiftCandidate(samples, hunter, score)) {
      const fastResult = recordHunterFastCandidate({
        hunter: nextHunter,
        hz: this.scan.currentHz,
        score,
        samples,
        now,
        range: this.scan.range
      });
      const fastScore = hunterFastLiftScore(samples, hunter, score);
      const candidatePassCount = fastResult.candidate?.passIds?.length ?? 1;
      const fastSweep = updateHunterSweep(nextHunter, this.scan.currentHz, {
        ...score,
        accepted: fastResult.confirmed,
        fastCandidate: true,
        passCount: candidatePassCount,
        score: fastScore,
        spectralVoiceScore: hunterFastSpectrumScore(samples, score)
      }, now);
      const fastHunter = {
        ...nextHunter,
        fastCandidates: fastResult.candidates,
        sweep: fastSweep,
        currentScore: Math.max(nextHunter.currentScore ?? 0, fastScore),
        decision: fastResult.confirmed
          ? `three-pass suspect confirmed ${candidatePassCount}/${SSB_HUNTER_FAST_CONFIRM_PASSES}`
          : `fast lift candidate ${candidatePassCount}/${SSB_HUNTER_FAST_CONFIRM_PASSES} passes`
      };
      if (fastResult.confirmed) {
        this.beginHunterEnvelopeSurvey(now, {
          ...fastHunter,
          bestHz: fastResult.candidate.bestHz,
          bestScore: fastResult.candidate.bestScore,
          lastHeardAt: now
        }, {
          ...score,
          accepted: true,
          fastCandidate: true,
          passCount: candidatePassCount,
          score: fastResult.candidate.bestScore,
          reason: "three-pass lift"
        });
        return true;
      }

      this.scan = {
        ...this.scan,
        hunter: fastHunter
      };
      this.updateState({ scan: this.scan });
      this.advanceScanChannel(now);
      return true;
    }

	    const envelopeCandidate = hunter.phase === "mapping" && isHunterEnvelopeCandidate(score, hunter);
    if (score.accepted) {
      this.acceptHunterScore(now, nextHunter, score, lastSample);
      return true;
    }

	    if (envelopeCandidate) {
	      this.continueHunterEnvelopeSurvey(now, nextHunter, {
        ...score,
        score: hunterEnvelopeCandidateScore(score),
        envelopeCandidate: true
      });
	      return true;
	    }

	    if ((score.toneRejected || score.broadbandRejected) && hunter.phase !== "seeking" && score.sampleCount >= SSB_HUNTER_MIN_SAMPLES) {
	      const resumeHz = postSuspectResumeFrequency(nextHunter, this.scan.currentHz, this.scan.range);
	      this.leaveHunterSuspect(now, `${score.reason}; resuming wide hunt`, { resumeHz });
	      return true;
	    }

    this.scan = {
      ...this.scan,
      hunter: {
        ...nextHunter,
        decision: hunter.phase === "seeking"
          ? `${score.reason}; hunting +${hunter.stepHz ?? SSB_HUNTER_INITIAL_STEP_HZ} Hz`
          : hunter.phase === "mapping"
          ? `${score.reason}; mapping envelope`
          : `${score.reason}; reversing and narrowing`
      }
    };
    this.updateState({ scan: this.scan });

    if (hunter.phase === "mapping") {
      this.handleHunterEnvelopeNoHit(now, nextHunter);
      return true;
    }

    if (hunter.phase === "refining") {
      this.handleHunterNoHit(now);
      return true;
    }

	    this.advanceScanChannel(now);
    return true;
  }

  acceptHunterScore(now, hunter, score, sample = {}) {
    const hz = this.scan.currentHz;
    if (!Number.isInteger(hz)) {
      return;
    }

    const rawValue = Math.round((score.audioStrength / 100) * MAX_RF_GAIN);
    this.upsertScanHit({
      hz,
      channel: null,
      rawValue,
      metrics: this.scan.metrics,
      sampleCount: 0,
      busyCount: 0,
      busySampleCount: 0,
      averageRaw: rawValue,
      score: score.score,
      verified: true,
      preserveScanState: true,
      audioScore: score.voiceLikeScore,
      audioLevelPercent: score.audioStrength,
      audioLiftPercent: score.signalLiftPercent,
      audioNoiseFloorPercent: score.noiseFloorPercent,
      audioVoiceLikeScore: score.voiceLikeScore,
      audioPeakHz: Number.isFinite(sample.peakHz) ? Math.round(sample.peakHz) : null,
      audioCentroidHz: Number.isFinite(sample.centroidHz) ? Math.round(sample.centroidHz) : null,
      audioMidRatio: Number.isFinite(sample.midRatio) ? Math.round(sample.midRatio * 100) : null,
      audioLowRatio: Number.isFinite(sample.lowRatio) ? Math.round(sample.lowRatio * 100) : null,
      audioHighRatio: Number.isFinite(sample.highRatio) ? Math.round(sample.highRatio * 100) : null,
      voiceCount: 1,
      audioSampleCount: Math.max(1, score.sampleCount ?? 1)
    });

    const improved = score.score >= (hunter.bestScore ?? 0);
    const bestHz = improved ? hz : hunter.bestHz;
    const bestScore = improved ? score.score : hunter.bestScore;
    const resumeHz = forwardHunterResumeFrequency(hunter.resumeHz, hz, this.scan.range, hunter);
    const refining = hunter.phase === "refining";
    const nextRefinePasses = (refining ? hunter.refinePasses ?? 0 : 0) + 1;
    const nextPeakMisses = improved ? 0 : (hunter.peakMisses ?? 0) + 1;

	    if (hunter.phase === "locked") {
	      this.lockHunterSignal(now, {
        ...hunter,
        bestHz,
        bestScore,
        lastHeardAt: now,
        resumeHz,
        belowGateMisses: 0,
        decision: "signal returned"
      });
      return;
    }

    if (hunter.phase === "seeking") {
      this.beginHunterEnvelopeSurvey(now, {
        ...hunter,
        bestHz,
        bestScore,
        lastHeardAt: now,
        resumeHz
      }, score);
      return;
    }

    if (hunter.phase === "mapping") {
      this.continueHunterEnvelopeSurvey(now, {
        ...hunter,
        bestHz,
        bestScore,
        lastHeardAt: now,
        resumeHz
      }, score);
      return;
    }

    if (isMinimumHunterStep(hunter.stepHz) && refining && nextRefinePasses >= SSB_HUNTER_LOCK_CONFIRM_PASSES && nextPeakMisses >= 2) {
      this.lockHunterSignal(now, {
        ...hunter,
        bestHz,
        bestScore,
        lastHeardAt: now,
        resumeHz,
        refinePasses: nextRefinePasses,
        peakMisses: nextPeakMisses,
        belowGateMisses: 0,
        lastImprovedAt: improved ? now : hunter.lastImprovedAt,
        decision: "peak confirmed"
      });
      return;
    }

    const stepHz = isMinimumHunterStep(hunter.stepHz) ? hunter.stepHz : reduceHunterStep(hunter.stepHz);
    const dwellMs = hunterDwellForStep(stepHz, hunter.baseDwellMs);
    const direction = improved ? hunter.direction : hunter.direction === -1 ? 1 : -1;
    const targetBaseHz = improved ? hz : bestHz ?? hz;
    const targetHz = clampHunterRefineFrequency(
      nextUnskippedHunterFrequency(targetBaseHz, direction, stepHz, this.scan.range, hunter),
      {
        ...hunter,
        phase: "refining"
      },
      this.scan.range
    );
    this.scan = {
      ...this.scan,
      status: "SSB Hunter refining",
      dwellMs,
      hunter: {
        ...hunter,
        phase: "refining",
        stepHz,
        dwellMs,
        direction,
        bestHz,
        bestScore,
        lastHeardAt: now,
        refinePasses: nextRefinePasses,
        peakMisses: nextPeakMisses,
        belowGateMisses: 0,
        lastImprovedAt: improved ? now : hunter.lastImprovedAt,
        resumeHz,
        decision: isMinimumHunterStep(stepHz)
          ? improved
            ? `${stepHz} Hz walk: stronger; continuing`
            : `${stepHz} Hz walk: weaker; reversing`
          : improved
          ? "audio found; narrowing step"
          : "score dropped; reversing"
      }
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(targetHz, now);
  }

  writeSetFrequencyCommand(command, targetHz, stepHz, options = {}) {
    if (!this.port.isOpen) {
      return;
    }

    this.updateState({ lastCommand: command, lastNudgeHz: stepHz });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
        return;
      }

      const channel = options.channel ?? findChannelForHz(this.bandProfile, targetHz);
      this.updateState({
        frequency: parseCatFrame(command).display,
        hz: targetHz,
        raw: command,
        channel: channel ? publicChannel(channel) : null
      });

      if (options.verify !== false) {
        this.writeReadCommand("FA;");
      }

      if (typeof options.afterWrite === "function") {
        options.afterWrite();
      }
    });
  }

  writeAntennaTunerCommand(command) {
    if (!this.port.isOpen) {
      return;
    }

    this.updateState({ lastCommand: command });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
        return;
      }

      this.updateState({
        raw: command,
        updatedAt: new Date().toISOString()
      });
    });
  }

  applyBandPreset(bandId = this.bandProfile.id, options = {}) {
    if (this.pttActive) {
      this.broadcastError("Release PTT before applying a band preset.");
      return;
    }

    clearTimeout(this.autoTuneTimer);
    this.autoTuneTimer = null;
    const previousBandId = this.bandProfile.id;
    if (options.customChannels !== undefined) {
      this.customChannels = options.customChannels;
    }
    this.bandProfile = profileWithCustomChannels(getBandProfile(bandId), this.customChannels);
    const rfCommand = formatSetRfGainCommand(this.bandProfile.defaultRfGain);
    const targetHz = normalizeBandTargetHz(options.targetHz, this.bandProfile);
    const frequencyCommand = formatSetVfoAFrequencyCommand(targetHz);
    const channel = findChannelForHz(this.bandProfile, targetHz);

    this.stopScan("preset");
    if (previousBandId !== this.bandProfile.id || this.scan.bandId !== this.bandProfile.id) {
      this.scan = createIdleScanState(this.bandProfile.scanRange, this.bandProfile);
    }
    this.updateState({ band: publicBandProfile(this.bandProfile), scan: this.scan });
    if (this.bandProfile.defaultMode) {
      this.writeModeCommand(formatSetModeCommand(this.bandProfile.defaultMode));
    }
    this.writeRfGainCommand(rfCommand, this.bandProfile.defaultRfGain);
    this.writeSetFrequencyCommand(frequencyCommand, targetHz, 0, {
      channel,
      afterWrite: options.autoTune
        ? () => {
          if (this.bandProfile.id === bandId) this.scheduleAutoAntennaTune(bandId);
        }
        : null
    });
  }

  writeModeCommand(command) {
    if (!this.port.isOpen) {
      return;
    }

    const parsed = parseCatFrame(command);
    this.updateState({
      lastCommand: command,
      mode: parsed.mode,
      raw: command
    });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
        return;
      }

      this.writeReadCommand("MD0;");
    });
  }

  writeRfGainCommand(command, value) {
    if (!this.port.isOpen) {
      return;
    }

    this.updateState({
      lastCommand: command,
      rfGain: {
        value,
        percent: Math.round((value / MAX_RF_GAIN) * 100)
      },
      raw: command
    });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
        return;
      }

      this.writeReadCommand("RG0;");
    });
  }

  writeTxAudioValueCommand(command, patch, readbackCommand = null) {
    if (!this.port.isOpen) {
      return;
    }

    this.updateTxAudioState(patch, {
      lastCommand: command,
      raw: command
    });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
        return;
      }

      if (readbackCommand) {
        this.writeReadCommand(readbackCommand);
      }
    });
  }

  writeReadCommand(command) {
    if (!READ_ONLY_COMMANDS.includes(command)) {
      this.broadcastError(`Blocked non-read-only CAT command: ${command}`);
      return;
    }

    if (!this.port.isOpen) {
      return;
    }

    this.updateState({ lastCommand: command });
    this.port.write(command, (error) => {
      if (error) {
        this.broadcastError(error.message);
      }
    });
  }

  handleData(chunk) {
    this.readBuffer += chunk.toString("ascii");
    const { frames, remainder } = splitCatFrames(this.readBuffer);
    this.readBuffer = remainder;

    for (const frame of frames) {
      this.framesSeen += 1;
      this.applyFrame(parseCatFrame(frame));
    }
  }

  rememberHunterTune(hz, now = Date.now()) {
	    this.recentHunterTunes = [
	      ...(this.recentHunterTunes ?? []),
	      { hz, at: now }
	    ].filter((entry) => now - entry.at <= RECENT_HUNTER_TUNE_WINDOW_MS).slice(-800);
	  }

	  isRecentHunterTuneReadback(hz, now = Date.now()) {
	    this.recentHunterTunes = (this.recentHunterTunes ?? [])
	      .filter((entry) => now - entry.at <= RECENT_HUNTER_TUNE_WINDOW_MS);
	    const stepHz = Math.max(1, Number(this.scan?.hunter?.stepHz) || SSB_HUNTER_INITIAL_STEP_HZ);
	    const toleranceHz = Math.max(25, Math.ceil(stepHz / 2));
	    return this.recentHunterTunes.some((entry) => Math.abs(entry.hz - hz) <= toleranceHz);
	  }

  handleHunterFrequencyReadback(hz) {
    if (!this.scan.active || this.scan.intent !== "ssbHunter" || !this.scan.hunter || !Number.isInteger(hz)) {
      return null;
    }

    if (hz === this.scan.currentHz || this.isRecentHunterTuneReadback(hz)) {
      return null;
    }

    const now = Date.now();
    const inRangeHz = Math.min(this.scan.range.endHz, Math.max(this.scan.range.startHz, hz));
	    this.scan = {
	      ...this.scan,
	      currentHz: inRangeHz,
	      tunedAt: now,
	      hunter: {
	        ...this.scan.hunter,
	        phase: "manual",
	        resumeHz: inRangeHz,
	        sweep: {
	          points: [],
	          maxLevelPercent: 0,
	          passStartedAt: now
	        },
	        samples: [],
	        sampleCount: 0,
	        decision: "manual VFO override; hunter stopped"
      }
    };
    this.stopScan("manual VFO override");
    return this.scan;
  }

  applyFrame(frame) {
    if (frame.type === "id") {
      this.updateState({ modelId: frame.modelId, raw: frame.raw });
      return;
    }

    if (frame.type === "frequency" && frame.vfo === "A") {
      const channel = findChannelForHz(this.bandProfile, frame.hz);
      this.handleHunterFrequencyReadback(frame.hz);
      this.updateState({
        frequency: frame.display,
        hz: frame.hz,
        raw: frame.raw,
        channel: channel ? publicChannel(channel) : null
      });
      return;
    }

    if (frame.type === "mode") {
      this.updateState({ mode: frame.mode, raw: frame.raw });
      return;
    }

    if (frame.type === "meter" && frame.meter === "0") {
      this.recordScanMeter(frame.rawValue);
      this.updateState({
        meter: {
          rawValue: frame.rawValue,
          percent: frame.percent,
          source: "SM0"
        },
        raw: frame.raw
      });
      return;
    }

    if (frame.type === "readMeter") {
      if (frame.name === "s") {
        this.recordScanMeter(frame.rawValue);
        this.updateState({
          meter: {
            rawValue: frame.rawValue,
            percent: frame.percent,
            source: "RM1"
          },
          raw: frame.raw
        });
        return;
      }

      if (frame.name === "power") {
        this.updateState({
          powerMeter: {
            rawValue: frame.rawValue,
            percent: frame.percent,
            source: "RM5"
          },
          raw: frame.raw
        });
        return;
      }

      if (frame.name === "swr") {
        this.updateState({
          swrMeter: {
            rawValue: frame.rawValue,
            percent: frame.percent,
            source: "RM6"
          },
          raw: frame.raw
        });
        return;
      }
    }

    if (frame.type === "rfGain") {
      this.updateState({
        rfGain: {
          value: frame.value,
          percent: frame.percent
        },
        raw: frame.raw
      });
      return;
    }

    if (frame.type === "micGain") {
      this.updateTxAudioState({
        micGain: {
          value: frame.value,
          percent: frame.percent
        }
      }, { raw: frame.raw });
      return;
    }

    if (frame.type === "monitorLevel") {
      const monitorPatch = frame.target === "enabled"
        ? { enabled: frame.enabled }
        : { level: frame.value };
      this.updateTxAudioState({
        monitor: monitorPatch
      }, { raw: frame.raw });
      return;
    }

    if (frame.type === "processorLevel") {
      this.updateTxAudioState({
        processor: {
          level: frame.value
        }
      }, { raw: frame.raw });
      return;
    }

    if (frame.type === "processorStatus") {
      this.updateTxAudioState({
        [frame.target]: {
          enabled: frame.enabled
        }
      }, { raw: frame.raw });
      return;
    }

    if (frame.type === "busy") {
      this.recordScanBusy(frame.busy);
      this.currentBusy = {
        busy: frame.busy,
        updatedAt: Date.now()
      };
      this.updateState({
        busy: {
          value: frame.busy,
          label: frame.busy ? "BUSY" : "CLEAR"
        },
        raw: frame.raw
      });
      return;
    }

    if (frame.type === "powerSwitch") {
      this.updateState({
        radioPowerSwitch: {
          on: frame.on,
          pending: false,
          updatedAt: new Date().toISOString()
        },
        raw: frame.raw
      });
      return;
    }

    this.updateState({ raw: frame.raw });
  }

  recordScanMeter(rawValue) {
    if (!this.scan.active) {
      return;
    }

    const scanSample = this.pendingScanMeter;
    this.pendingScanMeter = null;
    const now = Date.now();
    const nextMetrics = {
      ...this.scan.metrics,
      meterResponseCount: this.scan.metrics.meterResponseCount + 1
    };

    if (!scanSample) {
      this.updateScanMetrics({
        ...nextMetrics,
        untargetedSampleCount: nextMetrics.untargetedSampleCount + 1
      });
      return;
    }

    const sampleAgeMs = now - scanSample.tunedAt;
    const responseLatencyMs = Number.isFinite(scanSample.requestedAt) ? now - scanSample.requestedAt : null;
    const settled = sampleAgeMs >= SCAN_SETTLE_MS;
    const onChannel = sampleAgeMs <= scanSample.dwellMs;
    if (!settled || !onChannel) {
      this.updateScanMetrics({
        ...nextMetrics,
        earlySampleCount: nextMetrics.earlySampleCount + (settled ? 0 : 1),
        lateSampleCount: nextMetrics.lateSampleCount + (onChannel ? 0 : 1),
        lastSampleLatencyMs: responseLatencyMs,
        lastSampleAgeMs: sampleAgeMs
      });
      return;
    }

    const hz = this.scan.active && Number.isInteger(scanSample.hz)
      ? scanSample.hz
      : this.lastState.hz;
    const scanRange = this.scan.range ?? this.bandProfile.scanRange;
    const scanChannel = scanSample.channel;
    if (hz < scanRange.startHz || hz > scanRange.endHz) {
      this.updateScanMetrics(nextMetrics);
      return;
    }

    const validMetrics = {
      ...nextMetrics,
      validSampleCount: nextMetrics.validSampleCount + 1,
      lastSampleLatencyMs: responseLatencyMs,
      lastSampleAgeMs: sampleAgeMs
    };

    if (!this.scan.smartList) {
      this.updateScanMetrics(validMetrics);
      return;
    }

    if (this.scan.intent === "busy") {
      if (this.scan.busyHold?.active) {
        this.upsertScanHit({
          hz,
          channel: scanChannel,
          rawValue,
          metrics: validMetrics,
          sampleCount: 1,
          busyCount: 0,
          busySampleCount: 0,
          averageRaw: rawValue,
          score: rawValue + 12,
          verified: true,
          preserveScanState: true
        });
      } else {
        this.updateScanMetrics(validMetrics);
      }
      return;
    }

    const busy = this.scan.useBusy ? isRecentBusy(this.currentBusy) : null;
    if (this.scan.readableMode) {
      if (this.scan.verify?.active) {
        this.updateReadableVerify({ rawValue, busy, now });
        this.updateScanMetrics(validMetrics);
        return;
      }

      if (rawValue >= this.scan.thresholdRaw || busy) {
        this.startReadableVerify({ rawValue, busy, hz, channel: scanChannel, now });
        this.updateScanMetrics(validMetrics);
        return;
      }

      this.updateScanMetrics(validMetrics);
      return;
    }

    if (rawValue < this.scan.thresholdRaw) {
      this.updateScanMetrics(validMetrics);
      return;
    }

    const hitMetrics = {
      ...validMetrics,
      aboveThresholdCount: validMetrics.aboveThresholdCount + 1
    };
    this.upsertScanHit({
      hz,
      channel: scanChannel,
      rawValue,
      metrics: hitMetrics,
      sampleCount: 1,
      busyCount: busy ? 1 : 0,
      busySampleCount: busy === null ? 0 : 1,
      score: rawValue,
      verified: false
    });
  }

  recordAudioScanSample(sample) {
    if (!this.scan.active || !["smart", "regular", "ssbHunter"].includes(this.scan.intent)) {
      if (sample?.manualStudy === true) {
        this.recordManualSsbHunterAudioSample(sample);
      }
      return;
    }

    if (String(sample.bandId ?? this.bandProfile.id) !== this.bandProfile.id) {
      return;
    }

    const ssbHunterSample = this.scan.intent === "ssbHunter";
    const hz = Number.isInteger(sample.hz) ? sample.hz : this.scan.currentHz;
    if (!Number.isInteger(hz) || (!ssbHunterSample && hz !== this.scan.currentHz)) {
      return;
    }

    const tunedAt = Number.isFinite(sample.tunedAt) ? sample.tunedAt : this.scan.tunedAt;
    if (!Number.isFinite(tunedAt) || (!ssbHunterSample && Math.abs(tunedAt - this.scan.tunedAt) > AUDIO_SAMPLE_STALE_MS)) {
      return;
    }

    const now = Date.now();
    const sampleAgeMs = now - (ssbHunterSample ? tunedAt : this.scan.tunedAt);
    const regularAudioHoldActive = this.scan.intent === "regular"
      && this.scan.audioHold?.active
      && this.scan.audioHold.hz === hz;
    const maxUsefulSampleAgeMs = regularAudioHoldActive
      ? Number.POSITIVE_INFINITY
      : this.scan.intent === "ssbHunter" && this.scan.hunter?.phase === "locked"
      ? this.scan.hunter?.lockMs ?? SSB_HUNTER_LOCK_MS
      : this.scan.intent === "ssbHunter" && this.scan.hunter?.phase === "seeking"
      ? 1500
      : Math.max(this.scan.dwellMs, READABLE_VERIFY_MS);
    const settleMs = this.scan.intent === "ssbHunter" && this.scan.hunter?.phase === "seeking"
      ? 0
      : SCAN_SETTLE_MS;
    if (sampleAgeMs < settleMs || sampleAgeMs > maxUsefulSampleAgeMs) {
      return;
    }

    const scanRange = this.scan.range ?? this.bandProfile.scanRange;
    if (hz < scanRange.startHz || hz > scanRange.endHz) {
      return;
    }

    const voiceScore = clampNumber(sample.voiceScore, 0, 100);
    const levelPercent = clampNumber(sample.levelPercent, 0, 100);
    const voiceLikely = Boolean(sample.voiceLikely) || voiceScore >= AUDIO_VOICE_SCORE_MIN;
    const backtrackCbTarget = !this.scan.audioHold?.active && shouldBacktrackCbRegularAudioTarget({
      bandId: this.bandProfile.id,
      intent: this.scan.intent,
      scanMode: this.scan.scanMode,
      levelPercent,
      sampleAgeMs,
      previousTarget: this.scan.previousTarget
    });
    const audioTarget = backtrackCbTarget
      ? this.scan.previousTarget
      : { hz, channel: this.scan.currentChannel };
    const targetHz = Number.isInteger(audioTarget?.hz) ? audioTarget.hz : hz;
    const channel = audioTarget?.channel ?? this.scan.currentChannel;
    const metrics = {
      ...this.scan.metrics,
      audioSampleCount: this.scan.metrics.audioSampleCount + 1,
      voiceSampleCount: this.scan.metrics.voiceSampleCount + (voiceLikely ? 1 : 0)
    };

    if (this.scan.intent === "ssbHunter") {
      this.recordSsbHunterAudioSample({
        hz,
        voiceScore,
        levelPercent,
        metrics,
        sample
      });
      return;
    }

    if (this.scan.intent === "regular") {
      this.recordRegularAudioScanSample({
        hz: targetHz,
        channel,
        voiceLikely,
        levelPercent,
        voiceScore,
        metrics,
        sample,
        backtrackVerify: backtrackCbTarget
      });
      return;
    }

    if (!this.scan.smartList) {
      this.updateScanMetrics(metrics);
      return;
    }

    if (!voiceLikely || levelPercent < 2) {
      this.recordScanAudioObservation({ channel, hz, voice: false, metrics });
      return;
    }

    const rawValue = Math.round((levelPercent / 100) * MAX_RF_GAIN);
    this.upsertScanHit({
      hz,
      channel,
      rawValue,
      metrics,
      sampleCount: 0,
      busyCount: 0,
      busySampleCount: 0,
      averageRaw: rawValue,
      score: Math.round(voiceScore * 3 + rawValue),
      verified: true,
      audioScore: voiceScore,
      audioLevelPercent: levelPercent,
      audioPeakHz: Number.isFinite(sample.peakHz) ? Math.round(sample.peakHz) : null,
      audioCentroidHz: Number.isFinite(sample.centroidHz) ? Math.round(sample.centroidHz) : null,
      audioMidRatio: Number.isFinite(sample.midRatio) ? Math.round(sample.midRatio * 100) : null,
      audioLowRatio: Number.isFinite(sample.lowRatio) ? Math.round(sample.lowRatio * 100) : null,
      audioHighRatio: Number.isFinite(sample.highRatio) ? Math.round(sample.highRatio * 100) : null,
      voiceCount: 1,
      audioSampleCount: 1
    });
  }

  recordSsbHunterAudioSample({ hz, voiceScore, levelPercent, metrics, sample }) {
    const hunter = this.scan.hunter;
    if (!hunter) {
      this.updateScanMetrics(metrics);
      return;
    }

    const sampleHz = Number.isInteger(hz) ? hz : this.scan.currentHz;
    const previousSamples = sampleHz === this.scan.currentHz ? (hunter.samples ?? []) : [];
    const updateLiveSamples = sampleHz === this.scan.currentHz || hunter.phase !== "seeking";
    const sampleEntry = {
      levelPercent,
      voiceScore,
      peakHz: Number.isFinite(sample.peakHz) ? sample.peakHz : null,
      centroidHz: Number.isFinite(sample.centroidHz) ? sample.centroidHz : null,
      midRatio: Number.isFinite(sample.midRatio) ? sample.midRatio : null,
      lowRatio: Number.isFinite(sample.lowRatio) ? sample.lowRatio : null,
      highRatio: Number.isFinite(sample.highRatio) ? sample.highRatio : null,
      voiceTextureScore: Number.isFinite(sample.voiceTextureScore) ? sample.voiceTextureScore : null,
      voiceSpread: Number.isFinite(sample.voiceSpread) ? sample.voiceSpread : null,
      voicePeakToMean: Number.isFinite(sample.voicePeakToMean) ? sample.voicePeakToMean : null
    };
    const samples = [
      ...previousSamples,
      sampleEntry
    ].slice(-8);
    const noiseFloorPercent = estimateHunterNoiseFloor(hunter, sampleHz);
    const score = scoreSsbHunterSamples(samples, {
      minAudioLevelPercent: hunter.audioThresholdPercent,
      minSignalLiftPercent: hunter.audioLiftGatePercent,
      noiseFloorPercent
    });
    let floor = updateHunterNoiseFloor(hunter, sampleHz, score, Date.now());
    let sweep = updateHunterSweep(hunter, sampleHz, score, Date.now());
    let fastCandidates = hunter.fastCandidates ?? [];
    let currentScore = score.score;
    let decision = score.reason;

    if (hunter.phase === "seeking" && isHunterFastLiftCandidate(samples, hunter, score)) {
      const now = Date.now();
      const fastResult = recordHunterFastCandidate({
        hunter,
        hz: sampleHz,
        score,
        samples,
        now,
        range: this.scan.range
      });
      const fastScore = hunterFastLiftScore(samples, hunter, score);
      const candidatePassCount = fastResult.candidate?.passIds?.length ?? 1;
      fastCandidates = fastResult.candidates;
      currentScore = Math.max(score.score, fastScore);
      decision = fastResult.confirmed
        ? `three-pass suspect confirmed ${candidatePassCount}/${SSB_HUNTER_FAST_CONFIRM_PASSES}`
        : `fast voice candidate ${candidatePassCount}/${SSB_HUNTER_FAST_CONFIRM_PASSES} passes`;
      sweep = updateHunterSweep(hunter, sampleHz, {
        ...score,
        accepted: fastResult.confirmed,
        fastCandidate: true,
        passCount: candidatePassCount,
        score: currentScore,
        spectralVoiceScore: hunterFastSpectrumScore(samples, score),
        voiceTextureScore: sampleEntry.voiceTextureScore
      }, now);

      if (fastResult.confirmed) {
        const confirmedHunter = {
          ...hunter,
          samples,
          sampleCount: score.sampleCount,
          toneRejected: score.toneRejected,
          broadbandRejected: score.broadbandRejected,
          modulationScore: score.modulationScore,
          audioStrength: score.audioStrength,
          noiseFloorPercent: score.noiseFloorPercent,
          signalLiftPercent: score.signalLiftPercent,
          voiceLikeScore: score.voiceLikeScore,
          spectralVoiceScore: score.spectralVoiceScore,
          currentScore,
          floor,
          sweep,
          fastCandidates,
          bestHz: fastResult.candidate.bestHz,
          bestScore: fastResult.candidate.bestScore,
          lastHeardAt: now,
          decision
        };
        this.scan = {
          ...this.scan,
          metrics,
          hunter: confirmedHunter
        };
        this.updateState({ scan: this.scan });
        this.beginHunterEnvelopeSurvey(now, confirmedHunter, {
          ...score,
          accepted: true,
          fastCandidate: true,
          passCount: candidatePassCount,
          score: fastResult.candidate.bestScore,
          reason: "three-pass voice texture"
        });
        return;
      }
    }

    this.scan = {
      ...this.scan,
      metrics,
      hunter: {
        ...hunter,
        samples: updateLiveSamples ? samples : (hunter.samples ?? []),
        sampleCount: updateLiveSamples ? score.sampleCount : (hunter.sampleCount ?? 0),
        toneRejected: score.toneRejected,
        broadbandRejected: score.broadbandRejected,
        modulationScore: score.modulationScore,
        audioStrength: score.audioStrength,
        noiseFloorPercent: score.noiseFloorPercent,
        signalLiftPercent: score.signalLiftPercent,
        voiceLikeScore: score.voiceLikeScore,
        spectralVoiceScore: score.spectralVoiceScore,
        currentScore,
        floor,
        sweep,
        fastCandidates,
        decision
      }
    };
    this.updateState({ scan: this.scan });
    this.adjustHunterAutoRfGain(score);
  }

		  recordManualSsbHunterAudioSample(sample) {
		    if (this.scan.active || this.scan.intent !== "ssbHunter" || !this.scan.hunter) {
		      return;
		    }
		    if (String(sample.bandId ?? this.bandProfile.id) !== this.bandProfile.id) {
		      return;
		    }

	    const hz = Number.isInteger(sample.hz)
	      ? sample.hz
	      : Number.isInteger(this.lastState.hz)
	      ? this.lastState.hz
	      : null;
	    const scanRange = this.scan.range ?? this.bandProfile.scanRange;
	    if (!Number.isInteger(hz) || hz < scanRange.startHz || hz > scanRange.endHz) {
	      return;
	    }

    const hunter = this.scan.hunter;
    const previousSamples = hz === this.scan.currentHz ? (hunter.samples ?? []) : [];
    const voiceScore = clampNumber(sample.voiceScore, 0, 100);
    const levelPercent = clampNumber(sample.levelPercent, 0, 100);
    const samples = [
      ...previousSamples,
      {
        levelPercent,
        voiceScore,
        peakHz: Number.isFinite(sample.peakHz) ? sample.peakHz : null,
        centroidHz: Number.isFinite(sample.centroidHz) ? sample.centroidHz : null,
        midRatio: Number.isFinite(sample.midRatio) ? sample.midRatio : null,
        lowRatio: Number.isFinite(sample.lowRatio) ? sample.lowRatio : null,
        highRatio: Number.isFinite(sample.highRatio) ? sample.highRatio : null,
        voiceTextureScore: Number.isFinite(sample.voiceTextureScore) ? sample.voiceTextureScore : null,
        voiceSpread: Number.isFinite(sample.voiceSpread) ? sample.voiceSpread : null,
        voicePeakToMean: Number.isFinite(sample.voicePeakToMean) ? sample.voicePeakToMean : null
      }
	    ].slice(-8);
	    const now = Date.now();
	    const noiseFloorPercent = estimateHunterNoiseFloor(hunter, hz);
	    const score = scoreSsbHunterSamples(samples, {
	      minAudioLevelPercent: hunter.audioThresholdPercent,
	      minSignalLiftPercent: hunter.audioLiftGatePercent,
	      noiseFloorPercent
	    });
	    const metrics = {
	      ...this.scan.metrics,
	      audioSampleCount: this.scan.metrics.audioSampleCount + 1,
	      voiceSampleCount: this.scan.metrics.voiceSampleCount + (score.accepted || sample.voiceLikely === true ? 1 : 0)
	    };
	    const floor = updateHunterNoiseFloor(hunter, hz, score, now);
	    const sweep = updateHunterSweep(hunter, hz, score, now);
	    this.scan = {
	      ...this.scan,
	      currentHz: hz,
	      tunedAt: now,
	      metrics,
	      hunter: {
	        ...hunter,
	        phase: "manual",
	        samples,
	        sampleCount: score.sampleCount,
	        toneRejected: score.toneRejected,
	        broadbandRejected: score.broadbandRejected,
	        modulationScore: score.modulationScore,
	        audioStrength: score.audioStrength,
	        noiseFloorPercent: score.noiseFloorPercent,
	        signalLiftPercent: score.signalLiftPercent,
	        voiceLikeScore: score.voiceLikeScore,
	        spectralVoiceScore: score.spectralVoiceScore,
	        currentScore: score.score,
	        floor,
	        sweep,
	        decision: `manual study: ${score.reason}`
	      }
	    };
	    this.updateState({ scan: this.scan });
	  }

  adjustHunterAutoRfGain(score) {
    const hunter = this.scan?.hunter;
    if (!this.scan.active || this.scan.intent !== "ssbHunter" || !hunter?.autoRfGainEnabled || !this.port.isOpen) {
      return;
    }
    if ((score?.sampleCount ?? 0) < SSB_HUNTER_MIN_SAMPLES) {
      return;
    }

    const now = Date.now();
    if (now - (hunter.lastAutoRfGainAt ?? 0) < HUNTER_AUTO_RF_GAIN_INTERVAL_MS) {
      return;
    }

    const currentValue = Number.isInteger(this.lastState.rfGain?.value)
      ? this.lastState.rfGain.value
      : this.bandProfile.defaultRfGain ?? DEFAULT_RF_GAIN;
    const targetLift = normalizeHunterAutoRfGainTargetPercent(hunter.rfGainTargetLiftPercent);
    const lift = Number(score.signalLiftPercent ?? 0);
    const audioLevel = Number(score.audioStrength ?? 0);
    let delta = 0;
    if (audioLevel >= 88 || lift > targetLift + HUNTER_AUTO_RF_GAIN_DEADBAND_PERCENT * 2) {
      delta = -5;
    } else if (lift < targetLift - HUNTER_AUTO_RF_GAIN_DEADBAND_PERCENT && audioLevel < 78) {
      delta = 5;
    }

    if (delta === 0) {
      this.scan = {
        ...this.scan,
        hunter: {
          ...hunter,
          lastAutoRfGainAt: now
        }
      };
      this.updateState({ scan: this.scan });
      return;
    }

    const nextValue = Math.round(clampNumber(currentValue + delta, MIN_RF_GAIN, MAX_RF_GAIN));
    this.scan = {
      ...this.scan,
      hunter: {
        ...hunter,
        lastAutoRfGainAt: now,
        decision: `auto RF ${delta > 0 ? "up" : "down"}: lift ${Math.round(lift)}% target +${targetLift}%`
      }
    };
    this.updateState({ scan: this.scan });
    if (nextValue !== currentValue) {
      this.writeRfGainCommand(formatSetRfGainCommand(nextValue), nextValue);
    }
  }

  lockHunterSignal(now, hunterPatch) {
    const bestHz = hunterPatch.bestHz ?? this.scan.currentHz;
    const resumeHz = postSuspectResumeFrequency(hunterPatch, bestHz, this.scan.range);
    const dwellMs = hunterDwellForStep(SSB_HUNTER_MIN_STEP_HZ, hunterPatch.baseDwellMs ?? this.scan.hunter?.baseDwellMs);
    const lockMs = normalizeHunterLockMs(hunterPatch.lockMs ?? this.scan.hunter?.lockMs);
    const hunter = {
      ...this.scan.hunter,
      ...hunterPatch,
      phase: "locked",
      stepHz: SSB_HUNTER_MIN_STEP_HZ,
      dwellMs,
      bestHz,
	      resumeHz,
	      lockMs,
	      lockUntil: now + lockMs,
	      samples: [],
      decision: hunterPatch.decision ?? "locked"
    };

    this.scan = {
      ...this.scan,
      status: "SSB Hunter locked",
      dwellMs,
      hunter
    };
    this.updateState({ scan: this.scan });
    this.tuneHunterFrequency(bestHz, now, hunter);
  }

  recordRegularAudioScanSample({ hz, channel, voiceLikely, levelPercent, voiceScore, metrics, sample, backtrackVerify = false }) {
    const now = Date.now();
    const label = channel?.label ?? parseCatFrame(formatSetVfoAFrequencyCommand(hz)).display;
    const cbRegularAudioScan = isCbRegularAudioScan({
      bandId: this.bandProfile.id,
      intent: this.scan.intent
    });
    const cbAudioTrigger = shouldHoldCbRegularAudioScan({
      bandId: this.bandProfile.id,
      intent: this.scan.intent,
      levelPercent
    });
    const audioTrigger = cbRegularAudioScan ? cbAudioTrigger : voiceLikely && levelPercent >= 2;

    if (!audioTrigger) {
      if (this.scan.audioHold?.active && this.scan.audioHold.verifying === true && this.scan.audioHold.hz === hz) {
        this.scan = {
          ...this.scan,
          metrics
        };
        this.updateState({ scan: this.scan });
        return;
      }

      if (this.scan.audioHold?.active && this.scan.audioHold.hz === hz && !Number.isFinite(this.scan.audioHold.holdUntil)) {
        this.scan = {
          ...this.scan,
          audioHold: {
            ...this.scan.audioHold,
            clearSince: this.scan.audioHold.clearSince ?? now
          },
          metrics
        };
        this.updateState({ scan: this.scan });
        return;
      }

      this.recordScanAudioObservation({ channel, hz, voice: false, metrics });
      return;
    }

    const rawValue = Math.round((levelPercent / 100) * MAX_RF_GAIN);
    if (cbAudioTrigger && backtrackVerify) {
      this.scan = {
        ...this.scan,
        currentHz: hz,
        currentChannel: channel,
        status: `audio verify ${label} ${Math.round(levelPercent)}%`,
        tunedAt: now,
        audioHold: {
          active: true,
          verifying: true,
          channel,
          hz,
          startedAt: now,
          lastVoiceAt: null,
          thresholdPercent: CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT,
          triggerLevelPercent: Math.round(levelPercent),
          clearMs: CB_REGULAR_AUDIO_CLEAR_MS,
          holdUntil: null,
          verifyUntil: now + CB_REGULAR_AUDIO_BACKTRACK_VERIFY_MS,
          clearSince: null
        },
        metrics
      };
      this.updateState({ scan: this.scan });
      this.writeSetFrequencyCommand(formatSetVfoAFrequencyCommand(hz), hz, 0, { verify: false, channel });
      return;
    }

    const clearMs = cbRegularAudioScan ? CB_REGULAR_AUDIO_CLEAR_MS : BUSY_SCAN_CLEAR_MS;
    this.scan = {
      ...this.scan,
      currentHz: hz,
      currentChannel: channel,
      status: cbAudioTrigger
        ? `audio hold ${label} ${Math.round(levelPercent)}%`
        : `audio hold ${label}`,
      audioHold: {
        active: true,
        verifying: false,
        channel,
        hz,
        startedAt: this.scan.audioHold?.startedAt ?? now,
        lastVoiceAt: now,
        thresholdPercent: cbAudioTrigger ? CB_REGULAR_AUDIO_HOLD_THRESHOLD_PERCENT : null,
        triggerLevelPercent: cbAudioTrigger ? Math.round(levelPercent) : null,
        clearMs,
        holdUntil: null,
        clearSince: null
      },
      metrics
    };

    if (this.scan.smartList) {
      this.upsertScanHit({
        hz,
        channel,
        rawValue,
        metrics,
        sampleCount: 0,
        busyCount: 0,
        busySampleCount: 0,
        averageRaw: rawValue,
        score: Math.round(voiceScore * 3 + rawValue),
        verified: true,
        preserveScanState: true,
        audioScore: voiceScore,
        audioLevelPercent: levelPercent,
        audioPeakHz: Number.isFinite(sample.peakHz) ? Math.round(sample.peakHz) : null,
        audioCentroidHz: Number.isFinite(sample.centroidHz) ? Math.round(sample.centroidHz) : null,
        audioMidRatio: Number.isFinite(sample.midRatio) ? Math.round(sample.midRatio * 100) : null,
        audioLowRatio: Number.isFinite(sample.lowRatio) ? Math.round(sample.lowRatio * 100) : null,
        audioHighRatio: Number.isFinite(sample.highRatio) ? Math.round(sample.highRatio * 100) : null,
        voiceCount: voiceLikely ? 1 : 0,
        audioSampleCount: 1
      });
      return;
    }

    this.updateState({ scan: this.scan });
  }

  recordScanBusy(busy) {
    if (this.scan.active && this.scan.intent === "busy") {
      this.recordBusyScanState(busy, this.pendingScanBusy);
      return;
    }

    if (!this.scan.active || !this.scan.smartList || !this.scan.readableMode || !this.scan.useBusy) {
      return;
    }

    const now = Date.now();
    if (this.scan.verify?.active) {
      this.updateReadableVerify({ busy, now });
      return;
    }

    if (busy && this.scan.currentChannel) {
      this.startReadableVerify({
        rawValue: 0,
        busy,
        hz: this.scan.currentHz,
        channel: this.scan.currentChannel,
        now
      });
    }
  }

  recordBusyScanState(busy, target) {
    const now = Date.now();
    this.pendingScanBusy = null;
    if (!target || !Number.isInteger(target.hz)) {
      this.scheduleBusyRead(this.scan.busyHold?.active ? BUSY_SCAN_POLL_MS : BUSY_SCAN_DWELL_MS);
      return;
    }

    const channel = target.channel;
    const label = channel?.label ?? parseCatFrame(formatSetVfoAFrequencyCommand(target.hz)).display;
    if (channel && isSkippedChannel(channel, this.scan.skippedChannelNumbers)) {
      this.advanceScanChannel(now);
      this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
      return;
    }

    if (busy) {
      const hold = {
        active: true,
        channel,
        hz: target.hz,
        startedAt: this.scan.busyHold?.startedAt ?? now,
        lastBusyAt: now,
        clearSince: null
      };
      this.scan = {
        ...this.scan,
        currentHz: target.hz,
        currentChannel: channel,
        status: `holding ${label}`,
        busyHold: hold,
        tunedAt: now
      };
      this.updateState({ scan: this.scan });
      if (this.scan.smartList) {
        this.upsertScanHit({
          hz: target.hz,
          channel,
          rawValue: channel && this.scan.strongest?.channelNumber === channel.number ? this.scan.strongest.peakRaw : 0,
          metrics: this.scan.metrics,
          sampleCount: 0,
          busyCount: 1,
          busySampleCount: 1,
          averageRaw: 0,
          score: 12,
          verified: true,
          preserveScanState: true
        });
        this.scheduleScanMeterRead(0);
      }
      this.scheduleBusyRead(BUSY_SCAN_POLL_MS);
      return;
    }

    if (this.scan.busyHold?.active) {
      if (this.scan.smartList) {
        this.recordScanTrafficObservation({ channel, hz: target.hz, busy: false });
      }
      const clearSince = this.scan.busyHold.clearSince ?? now;
      if (now - clearSince >= BUSY_SCAN_CLEAR_MS) {
        const advanceAt = Date.now();
        this.scan = {
          ...this.scan,
          status: "busy scanning",
          busyHold: null,
          tunedAt: advanceAt - this.scan.dwellMs
        };
        this.updateState({ scan: this.scan });
        this.advanceScanChannel(advanceAt);
        this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
        return;
      }

      this.scan = {
        ...this.scan,
        busyHold: {
          ...this.scan.busyHold,
          clearSince
        }
      };
      this.updateState({ scan: this.scan });
      this.scheduleBusyRead(BUSY_SCAN_POLL_MS);
      return;
    }

    this.advanceScanChannel(now);
    if (this.scan.smartList) {
      this.recordScanTrafficObservation({ channel, hz: target.hz, busy: false });
    }
    this.scheduleBusyRead(BUSY_SCAN_DWELL_MS);
  }

  startReadableVerify({ rawValue, busy, hz, channel, now }) {
    const score = scoreReadableSample({ rawValue, busy, thresholdRaw: this.scan.thresholdRaw });
    this.scan = {
      ...this.scan,
      status: "verifying",
      currentHz: hz,
      currentChannel: channel ? publicChannel(channel) : null,
      verify: {
        active: true,
        hz,
        channel: channel ? publicChannel(channel) : null,
        startedAt: now,
        until: now + READABLE_VERIFY_MS,
        nextSampleAt: now + READABLE_VERIFY_SAMPLE_MS,
        sampleCount: rawValue > 0 ? 1 : 0,
        busyCount: busy ? 1 : 0,
        busySampleCount: busy === null ? 0 : 1,
        strongCount: rawValue >= this.scan.thresholdRaw ? 1 : 0,
        peakRaw: rawValue,
        rawTotal: rawValue,
        score
      }
    };
    this.updateState({ scan: this.scan });
  }

  updateReadableVerify({ rawValue = null, busy = null, now }) {
    const verify = this.scan.verify;
    if (!verify?.active) {
      return;
    }

    const hasRaw = Number.isInteger(rawValue);
    const nextRawTotal = verify.rawTotal + (hasRaw ? rawValue : 0);
    const nextSampleCount = verify.sampleCount + (hasRaw ? 1 : 0);
    const nextBusyCount = verify.busyCount + (busy ? 1 : 0);
    const nextBusySampleCount = verify.busySampleCount + (busy === null ? 0 : 1);
    const nextStrongCount = verify.strongCount + (hasRaw && rawValue >= this.scan.thresholdRaw ? 1 : 0);
    const nextPeakRaw = hasRaw ? Math.max(verify.peakRaw, rawValue) : verify.peakRaw;
    const nextScore = verify.score + scoreReadableSample({
      rawValue: hasRaw ? rawValue : 0,
      busy,
      thresholdRaw: this.scan.thresholdRaw
    });

    this.scan = {
      ...this.scan,
      verify: {
        ...verify,
        sampleCount: nextSampleCount,
        busyCount: nextBusyCount,
        busySampleCount: nextBusySampleCount,
        strongCount: nextStrongCount,
        peakRaw: nextPeakRaw,
        rawTotal: nextRawTotal,
        score: nextScore,
        lastSampleAt: now
      }
    };
    this.updateState({ scan: this.scan });
  }

  finalizeReadableVerify() {
    const verify = this.scan.verify;
    if (!verify?.active) {
      return;
    }

    const averageRaw = verify.sampleCount > 0 ? Math.round(verify.rawTotal / verify.sampleCount) : 0;
    const readable = verify.score >= READABLE_SCORE_MIN || verify.strongCount >= 2 || (this.scan.useBusy && verify.busyCount > 0);
    if (readable) {
      this.upsertScanHit({
        hz: verify.hz,
        channel: verify.channel,
        rawValue: verify.peakRaw,
        metrics: {
          ...this.scan.metrics,
          aboveThresholdCount: this.scan.metrics.aboveThresholdCount + 1
        },
        sampleCount: verify.sampleCount,
        busyCount: verify.busyCount,
        busySampleCount: verify.busySampleCount,
        averageRaw,
        score: verify.score,
        verified: true
      });
      return;
    }

    this.scan = {
      ...this.scan,
      status: "scanning",
      verify: null,
      tunedAt: Date.now() - this.scan.dwellMs
    };
    this.updateState({ scan: this.scan });
  }

  upsertScanHit({
    hz,
    channel,
    rawValue,
    metrics,
    sampleCount,
    busyCount,
    busySampleCount = busyCount,
    averageRaw = rawValue,
    score = rawValue,
    verified,
    preserveScanState = false,
    audioScore = null,
    audioLevelPercent = null,
    audioLiftPercent = null,
    audioNoiseFloorPercent = null,
    audioVoiceLikeScore = null,
    audioPeakHz = null,
    audioCentroidHz = null,
    audioMidRatio = null,
    audioLowRatio = null,
    audioHighRatio = null,
    voiceCount = 0,
    audioSampleCount = 0
  }) {
    if (!this.scan.smartList) {
      this.updateScanMetrics(metrics);
      return;
    }

    if (channel && isSkippedChannel(channel, this.scan.skippedChannelNumbers)) {
      this.updateScanMetrics(metrics);
      return;
    }

    const groupHz = Math.max(this.bandProfile.topHitSpacingHz ?? SCAN_GROUP_MIN_HZ, this.scan.stepHz * 2);
    const nowIso = new Date().toISOString();
    const existing = this.scan.scanMode === "channels" && channel
      ? this.scan.hits.find((hit) => hit.channelNumber === channel.number)
      : this.scan.hits.find((hit) => Math.abs(hit.peakHz - hz) <= groupHz);
    let hits;

    if (existing) {
      hits = this.scan.hits.map((hit) => {
        if (hit.id !== existing.id) {
          return hit;
        }

        const stronger = rawValue > hit.peakRaw || (Number.isFinite(audioScore) && audioScore > (hit.audioScore ?? -1));
        const nextScore = Math.max(hit.score ?? 0, score);
        return {
          ...hit,
          lastSeenAt: nowIso,
          seenCount: hit.seenCount + 1,
          peakHz: stronger ? hz : hit.peakHz,
          peakDisplay: stronger ? parseCatFrame(formatSetVfoAFrequencyCommand(hz)).display : hit.peakDisplay,
          channelNumber: channel?.number ?? hit.channelNumber,
          channelLabel: channel?.label ?? hit.channelLabel,
          peakRaw: stronger ? rawValue : hit.peakRaw,
          peakPercent: stronger ? rawToPercent(rawValue) : hit.peakPercent,
          averageRaw,
          sampleCount: (hit.sampleCount ?? 0) + sampleCount,
          busyCount: (hit.busyCount ?? 0) + busyCount,
          busySampleCount: (hit.busySampleCount ?? 0) + busySampleCount,
          voiceCount: (hit.voiceCount ?? 0) + voiceCount,
          audioSampleCount: (hit.audioSampleCount ?? 0) + audioSampleCount,
          audioScore: Number.isFinite(audioScore) ? Math.max(hit.audioScore ?? 0, audioScore) : hit.audioScore,
          audioLevelPercent: Number.isFinite(audioLevelPercent) && stronger ? audioLevelPercent : hit.audioLevelPercent,
          audioLiftPercent: Number.isFinite(audioLiftPercent) && stronger ? audioLiftPercent : hit.audioLiftPercent,
          audioNoiseFloorPercent: Number.isFinite(audioNoiseFloorPercent) && stronger ? audioNoiseFloorPercent : hit.audioNoiseFloorPercent,
          audioVoiceLikeScore: Number.isFinite(audioVoiceLikeScore) && stronger ? audioVoiceLikeScore : hit.audioVoiceLikeScore,
          audioPeakHz: Number.isFinite(audioPeakHz) && stronger ? audioPeakHz : hit.audioPeakHz,
          audioCentroidHz: Number.isFinite(audioCentroidHz) && stronger ? audioCentroidHz : hit.audioCentroidHz,
          audioMidRatio: Number.isFinite(audioMidRatio) && stronger ? audioMidRatio : hit.audioMidRatio,
          audioLowRatio: Number.isFinite(audioLowRatio) && stronger ? audioLowRatio : hit.audioLowRatio,
          audioHighRatio: Number.isFinite(audioHighRatio) && stronger ? audioHighRatio : hit.audioHighRatio,
          score: nextScore,
          verified: hit.verified || verified
        };
      });
    } else {
      hits = [
        {
          id: `${nowIso}-${hz}`,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          seenCount: 1,
          peakHz: hz,
          peakDisplay: parseCatFrame(formatSetVfoAFrequencyCommand(hz)).display,
          channelNumber: channel?.number ?? null,
          channelLabel: channel?.label ?? null,
          peakRaw: rawValue,
          peakPercent: rawToPercent(rawValue),
          averageRaw,
          sampleCount,
          busyCount,
          busySampleCount,
          voiceCount,
          audioSampleCount,
          audioScore: Number.isFinite(audioScore) ? audioScore : null,
          audioLevelPercent: Number.isFinite(audioLevelPercent) ? audioLevelPercent : null,
          audioLiftPercent: Number.isFinite(audioLiftPercent) ? audioLiftPercent : null,
          audioNoiseFloorPercent: Number.isFinite(audioNoiseFloorPercent) ? audioNoiseFloorPercent : null,
          audioVoiceLikeScore: Number.isFinite(audioVoiceLikeScore) ? audioVoiceLikeScore : null,
          audioPeakHz: Number.isFinite(audioPeakHz) ? audioPeakHz : null,
          audioCentroidHz: Number.isFinite(audioCentroidHz) ? audioCentroidHz : null,
          audioMidRatio: Number.isFinite(audioMidRatio) ? audioMidRatio : null,
          audioLowRatio: Number.isFinite(audioLowRatio) ? audioLowRatio : null,
          audioHighRatio: Number.isFinite(audioHighRatio) ? audioHighRatio : null,
          score,
          verified
        },
        ...this.scan.hits
      ];
    }

    hits = rankScanHits(hits).slice(0, MAX_SCAN_HITS);
    this.scan = {
      ...this.scan,
      ...(preserveScanState ? {} : {
        status: this.scan.intent === "busy"
          ? "busy scanning"
          : this.scan.intent === "regular"
          ? "audio scanning"
          : this.scan.audioAssist
          ? "audio smart scanning"
          : "smart scanning",
        verify: null,
        tunedAt: Date.now() - this.scan.dwellMs
      }),
      metrics,
      hits,
      strongest: hits.reduce((strongest, hit) => {
        if (!strongest || (hit.score ?? hit.peakRaw) > (strongest.score ?? strongest.peakRaw)) {
          return hit;
        }
        return strongest;
      }, null)
    };
    this.updateState({ scan: this.scan });
  }

  recordScanTrafficObservation({ channel, hz, busy }) {
    if (!this.scan.smartList) {
      return;
    }

    const existing = this.scan.scanMode === "channels" && channel
      ? this.scan.hits.find((hit) => hit.channelNumber === channel.number)
      : this.scan.hits.find((hit) => Math.abs(hit.peakHz - hz) <= Math.max(this.bandProfile.topHitSpacingHz ?? SCAN_GROUP_MIN_HZ, this.scan.stepHz * 2));
    if (!existing) {
      return;
    }

    const nowIso = new Date().toISOString();
    const hits = this.scan.hits.map((hit) => {
      if (hit.id !== existing.id) {
        return hit;
      }

      return {
        ...hit,
        lastSeenAt: nowIso,
        busyCount: (hit.busyCount ?? 0) + (busy ? 1 : 0),
        busySampleCount: (hit.busySampleCount ?? 0) + 1
      };
    });
    this.scan = {
      ...this.scan,
      hits: rankScanHits(hits).slice(0, MAX_SCAN_HITS)
    };
    this.updateState({ scan: this.scan });
  }

  recordScanAudioObservation({ channel, hz, voice, metrics }) {
    if (!this.scan.smartList) {
      this.updateScanMetrics(metrics);
      return;
    }

    const existing = this.scan.scanMode === "channels" && channel
      ? this.scan.hits.find((hit) => hit.channelNumber === channel.number)
      : this.scan.hits.find((hit) => Math.abs(hit.peakHz - hz) <= Math.max(this.bandProfile.topHitSpacingHz ?? SCAN_GROUP_MIN_HZ, this.scan.stepHz * 2));
    if (!existing) {
      this.updateScanMetrics(metrics);
      return;
    }

    const nowIso = new Date().toISOString();
    const hits = this.scan.hits.map((hit) => {
      if (hit.id !== existing.id) {
        return hit;
      }

      return {
        ...hit,
        lastSeenAt: nowIso,
        voiceCount: (hit.voiceCount ?? 0) + (voice ? 1 : 0),
        audioSampleCount: (hit.audioSampleCount ?? 0) + 1
      };
    });
    this.scan = {
      ...this.scan,
      metrics,
      hits: rankScanHits(hits).slice(0, MAX_SCAN_HITS)
    };
    this.updateState({ scan: this.scan });
  }

  updateScanMetrics(metrics) {
    this.scan = {
      ...this.scan,
      metrics
    };
    this.updateState({ scan: this.scan });
  }

  updateTxAudioState(txAudioPatch, extraPatch = {}) {
    const current = this.lastState.txAudio ?? createEmptyTxAudioState();
    this.updateState({
      ...extraPatch,
      txAudio: {
        ...current,
        ...txAudioPatch,
        monitor: {
          ...current.monitor,
          ...(txAudioPatch.monitor ?? {})
        },
        processor: {
          ...current.processor,
          ...(txAudioPatch.processor ?? {})
        },
        parametricEq: {
          ...current.parametricEq,
          ...(txAudioPatch.parametricEq ?? {})
        }
      }
    });
  }

  updateState(patch) {
    this.lastState = {
      ...this.lastState,
      ...patch,
      rxCount: this.framesSeen,
      updatedAt: new Date().toISOString()
    };
    this.broadcastState();
  }

  broadcastState({ force = false } = {}) {
    const now = Date.now();
    const intervalMs = this.lastState?.scan?.intent === "ssbHunter" && this.lastState.scan.active
      ? HUNTER_STATE_BROADCAST_MS
      : 0;

    if (!force && intervalMs > 0 && now - this.lastStateBroadcastAt < intervalMs) {
      if (!this.pendingStateBroadcastTimer) {
        const delayMs = Math.max(1, intervalMs - (now - this.lastStateBroadcastAt));
        this.pendingStateBroadcastTimer = setTimeout(() => {
          this.pendingStateBroadcastTimer = null;
          this.broadcastState({ force: true });
        }, delayMs);
      }
      return;
    }

    this.lastStateBroadcastAt = now;
    this.broadcast(this.lastState);
  }

  broadcastError(message) {
    this.broadcast({
      type: "error",
      message,
      updatedAt: new Date().toISOString()
    });
  }

  broadcast(message) {
    const outgoing = compactStateForClient(message);
    for (const client of this.clients) {
      send(client, outgoing);
    }
  }

  isCatWriteBackpressured() {
    return Number(this.port?.writableLength ?? 0) > CAT_FAST_WRITE_BUFFER_LIMIT_BYTES;
  }

  noteHunterBackpressure(now = Date.now()) {
    if (now - this.lastHunterBackpressureAt < 1000 || this.scan.intent !== "ssbHunter" || !this.scan.hunter) {
      return;
    }

    this.lastHunterBackpressureAt = now;
    this.scan = {
      ...this.scan,
      hunter: {
        ...this.scan.hunter,
        decision: "CAT queue draining; old data pruned"
      }
    };
    this.updateState({ scan: this.scan });
  }
}

function createIdleScanState(range, profile = null) {
  const channels = profile?.channels ?? [];
  return {
    active: false,
    bandId: profile?.id ?? null,
    status: "idle",
    range,
    scanSource: profile?.defaultScanSource ?? "frequency",
    scanMode: scanSourceToMode(profile?.defaultScanSource ?? "frequency"),
    channels: channels.map(publicChannel),
    skippedChannelNumbers: [],
    thresholdS: 0,
    thresholdRaw: approxSToRawMeter(0),
    readableMode: false,
    smartList: true,
    useBusy: false,
    audioAssist: false,
    verify: null,
    busyHold: null,
    audioHold: null,
    cbAudioAdaptive: null,
    hunter: null,
    stepHz: 1000,
    dwellMs: 400,
    direction: 1,
    currentHz: null,
    channelIndex: channels.length ? findChannelIndex(channels, profile.defaultChannel) : -1,
    currentChannel: null,
    previousTarget: null,
    topHitIndex: -1,
    tuneCount: 0,
    ratePerSecond: 0,
    metrics: createScanMetrics(),
    startedAt: null,
    durationMs: null,
    endsAt: null,
    hits: [],
    strongest: null
  };
}

function createEmptyTxAudioState() {
  return {
    micGain: null,
    monitor: {
      enabled: null,
      level: null
    },
    processor: {
      enabled: null,
      level: null
    },
    parametricEq: {
      enabled: null
    }
  };
}

function createScanMetrics() {
  return {
    meterRequestCount: 0,
    meterResponseCount: 0,
    validSampleCount: 0,
    aboveThresholdCount: 0,
    earlySampleCount: 0,
    lateSampleCount: 0,
    missedSampleCount: 0,
    untargetedSampleCount: 0,
    audioSampleCount: 0,
    voiceSampleCount: 0,
    lastSampleLatencyMs: null,
    lastSampleAgeMs: null
  };
}

function normalizeScanDurationMs(value) {
  const durationMs = Number.parseInt(value, 10);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return SMART_SCAN_DURATION_MS;
  }

  return Math.min(120_000, Math.max(5_000, durationMs));
}

function normalizeScanDwellMs(value) {
  const dwellMs = Number.parseInt(value, 10);
  if (!Number.isFinite(dwellMs)) {
    return DEFAULT_SCAN_DWELL_MS;
  }

  return Math.min(MAX_SCAN_DWELL_MS, Math.max(MIN_SCAN_DWELL_MS, dwellMs));
}

function normalizeHunterDwellMs(value) {
  const dwellMs = Number(value);
  if (!Number.isFinite(dwellMs)) {
    return SSB_HUNTER_DWELL_MS;
  }

  return Math.min(SSB_HUNTER_DWELL_MAX_MS, Math.max(SSB_HUNTER_DWELL_MIN_MS, dwellMs));
}

function normalizeConnectTuneTarget(message) {
  const requestedBandId = String(message?.tuneTarget?.bandId ?? message?.bandId ?? DEFAULT_BAND_ID);
  const profile = profileWithCustomChannels(getBandProfile(requestedBandId), message?.customChannels);
  const hz = normalizeBandTargetHz(Number.parseInt(message?.tuneTarget?.hz, 10), profile);

  return {
    bandId: profile.id,
    hz
  };
}

function normalizeBandTargetHz(hz, profile) {
  const range = profile?.scanRange;
  if (!range || !Number.isInteger(hz) || hz < range.startHz || hz > range.endHz) {
    return profile?.centerHz ?? BAND_PROFILES[DEFAULT_BAND_ID].centerHz;
  }

  return snapToScanStep(hz, FREQUENCY_SLIDER_STEP_HZ, range);
}

function snapToScanStep(hz, stepHz, range) {
  const offset = Math.round((hz - range.startHz) / stepHz) * stepHz;
  return Math.min(range.endHz, Math.max(range.startHz, range.startHz + offset));
}

function nextScanFrequency(currentHz, _direction, stepHz, range) {
  const safeStepHz = Math.abs(stepHz);
  const nextHz = currentHz + safeStepHz;

  return {
    hz: nextHz > range.endHz ? range.startHz : nextHz,
    direction: 1
  };
}

function nextScanChannel(currentIndex, direction, channels, skippedChannelNumbers = []) {
  const safeChannels = channels ?? [];
  if (safeChannels.length === 0) {
    return {
      hz: null,
      channelIndex: -1,
      channel: null,
      direction
    };
  }

  const skipped = new Set(skippedChannelNumbers.map(Number));
  if (safeChannels.every((channel) => skipped.has(channel.number))) {
    return {
      hz: null,
      channelIndex: -1,
      channel: null,
      direction
    };
  }

  const safeIndex = Number.isInteger(currentIndex) && currentIndex >= 0 ? currentIndex : -1;
  for (let offset = 1; offset <= safeChannels.length; offset += 1) {
    const nextIndex = (safeIndex + offset) % safeChannels.length;
    const channel = safeChannels[nextIndex];
    if (skipped.has(channel.number)) {
      continue;
    }

    return {
      hz: channel.hz,
      channelIndex: nextIndex,
      channel,
      direction: 1
    };
  }

  return {
    hz: null,
    channelIndex: -1,
    channel: null,
    direction
  };
}

function nextTopHit(currentIndex, direction, hits) {
  const safeHits = rankScanHits(hits ?? []).filter((hit) => Number.isInteger(hit.peakHz));
  if (safeHits.length === 0) {
    return {
      hz: null,
      topHitIndex: -1,
      channel: null,
      direction
    };
  }

  const safeIndex = Number.isInteger(currentIndex) && currentIndex >= 0 ? currentIndex : -1;
  const nextIndex = (safeIndex + 1) % safeHits.length;
  const hit = safeHits[nextIndex];
  return {
    hz: hit.peakHz,
    topHitIndex: nextIndex,
    channel: null,
    direction: 1
  };
}

function normalizeScanSource(scanSource, profile, hits = []) {
  const requested = String(scanSource ?? profile?.defaultScanSource ?? "frequency");
  if (requested === "presets" && hasChannels(profile)) {
    return "presets";
  }

  if (requested === "top5" && (hits?.length ?? 0) > 0) {
    return "top5";
  }

  return "frequency";
}

function scanSourceToMode(scanSource) {
  if (scanSource === "presets") {
    return "channels";
  }

  if (scanSource === "top5") {
    return "topHits";
  }

  return "range";
}

function findTopHitStart(hits, hz) {
  const safeHits = rankScanHits(hits ?? []).filter((hit) => Number.isInteger(hit.peakHz));
  if (safeHits.length === 0) {
    return null;
  }

  if (!Number.isInteger(hz)) {
    return safeHits[0];
  }

  return safeHits.reduce((nearest, hit) => {
    if (!nearest || Math.abs(hit.peakHz - hz) < Math.abs(nearest.peakHz - hz)) {
      return hit;
    }
    return nearest;
  }, null);
}

function findTopHitIndex(hits, id) {
  if (!id) {
    return -1;
  }

  return rankScanHits(hits ?? []).findIndex((hit) => hit.id === id);
}

function nextUnskippedHunterFrequency(hz, direction, stepHz, range, hunter = null) {
  let nextHz = nextHunterFrequency(hz, direction, stepHz, range);
  const maxAttempts = Math.min(5000, Math.ceil((range.endHz - range.startHz) / Math.max(1, Math.abs(stepHz))) + 2);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!isHunterFrequencySkipped(nextHz, hunter)) {
      return nextHz;
    }
    nextHz = nextHunterFrequency(nextHz, direction, stepHz, range);
  }

  return nextHz;
}

function nextHunterScanTarget(scan, now = Date.now()) {
  const hunter = scan.hunter;
  const range = scan.range;
  const stepHz = hunter?.stepHz ?? scan.stepHz ?? SSB_HUNTER_INITIAL_STEP_HZ;
  const direction = hunter?.direction ?? 1;
  const nextHz = nextUnskippedHunterFrequencyNoWrap(scan.currentHz, direction, stepHz, range, hunter);
  if (Number.isInteger(nextHz)) {
    return {
      hz: nextHz,
      direction: 1,
      channel: null
    };
  }

  const nextPassId = Number.isInteger(hunter?.passId) ? hunter.passId + 1 : 2;
  const resetSweep = pruneHunterSweepForPass(hunter?.sweep, nextPassId, now);
  const resetHunter = hunter
    ? {
      ...hunter,
      skippedHz: [],
      passId: nextPassId,
      sweep: resetSweep,
      fastCandidates: pruneHunterFastCandidates(hunter.fastCandidates, nextPassId),
      decision: `new pass ${nextPassId}; cleared skipped targets`
    }
    : hunter;
  return {
    hz: nextUnskippedHunterFrequency(
      range.startHz - SSB_HUNTER_INITIAL_STEP_HZ,
      1,
      SSB_HUNTER_INITIAL_STEP_HZ,
      range,
      resetHunter
    ),
    direction: 1,
    channel: null,
    hunterPatch: resetHunter ? {
      skippedHz: [],
      passId: nextPassId,
      sweep: resetSweep,
      fastCandidates: resetHunter.fastCandidates,
      decision: resetHunter.decision
    } : null
  };
}

function forwardHunterResumeFrequency(preferredHz, anchorHz, range, hunter = null) {
  const safeAnchorHz = Number.isInteger(anchorHz) ? anchorHz : range.startHz - SSB_HUNTER_INITIAL_STEP_HZ;
  if (
    Number.isInteger(preferredHz)
      && preferredHz > safeAnchorHz
      && preferredHz >= range.startHz
      && preferredHz <= range.endHz
      && !isHunterFrequencySkipped(preferredHz, hunter)
  ) {
    return preferredHz;
  }

  return firstUnskippedHunterFrequencyAtOrAfter(
    safeAnchorHz + SSB_HUNTER_INITIAL_STEP_HZ,
    SSB_HUNTER_INITIAL_STEP_HZ,
    range,
    hunter
  ) ?? nextUnskippedHunterFrequency(
    range.startHz - SSB_HUNTER_INITIAL_STEP_HZ,
    1,
    SSB_HUNTER_INITIAL_STEP_HZ,
    range,
    hunter
  );
}

function firstUnskippedHunterFrequencyAtOrAfter(hz, stepHz, range, hunter = null) {
  const safeStepHz = Math.max(1, Math.abs(Number(stepHz) || 1));
  let nextHz = Math.round(Number(hz));
  if (!Number.isInteger(nextHz)) {
    nextHz = range.startHz;
  }
  nextHz = Math.min(range.endHz, Math.max(range.startHz, nextHz));
  const offsetHz = nextHz - range.startHz;
  const remainderHz = ((offsetHz % safeStepHz) + safeStepHz) % safeStepHz;
  if (remainderHz !== 0) {
    nextHz += safeStepHz - remainderHz;
  }
  if (nextHz > range.endHz) {
    return null;
  }

  const maxAttempts = Math.min(5000, Math.ceil((range.endHz - nextHz) / safeStepHz) + 2);
  for (let attempt = 0; attempt < maxAttempts && nextHz <= range.endHz; attempt += 1) {
    if (!isHunterFrequencySkipped(nextHz, hunter)) {
      return nextHz;
    }
    nextHz += safeStepHz;
  }

  return null;
}

function nextUnskippedHunterFrequencyNoWrap(hz, direction, stepHz, range, hunter = null) {
  let nextHz = nextHunterFrequencyNoWrap(hz, direction, stepHz, range);
  const maxAttempts = Math.min(5000, Math.ceil((range.endHz - range.startHz) / Math.max(1, Math.abs(stepHz))) + 2);
  for (let attempt = 0; attempt < maxAttempts && Number.isInteger(nextHz); attempt += 1) {
    if (!isHunterFrequencySkipped(nextHz, hunter)) {
      return nextHz;
    }
    nextHz = nextHunterFrequencyNoWrap(nextHz, direction, stepHz, range);
  }

  return null;
}

function firstIntegerInRange(values, range) {
  return (values ?? []).find((hz) => Number.isInteger(hz) && hz >= range.startHz && hz <= range.endHz) ?? null;
}

function highestIntegerInRange(values, range) {
  const hertz = (values ?? [])
    .filter((hz) => Number.isInteger(hz) && hz >= range.startHz && hz <= range.endHz);
  return hertz.length > 0 ? Math.max(...hertz) : null;
}

	function postSuspectAnchorFrequency(hunter, fallbackHz, range) {
	  return highestIntegerInRange([
	    hunter?.resumeHz,
	    hunter?.envelope?.highEdgeHz,
	    hunter?.envelope?.lastHeardHz,
	    hunter?.envelope?.surveyEndHz,
	    hunter?.envelope?.bestHz,
    hunter?.bestHz,
    fallbackHz
  ], range) ?? (Number.isInteger(fallbackHz) ? fallbackHz : range.startHz);
}

function postSuspectResumeFrequency(hunter, fallbackHz, range) {
  const anchorHz = postSuspectAnchorFrequency(hunter, fallbackHz, range);
  return forwardHunterResumeFrequency(
    hunter?.resumeHz,
    anchorHz,
    range,
    hunter
  );
}

function updateHunterSweep(hunter, hz, score, now) {
  const previousPoints = Array.isArray(hunter?.sweep?.points) ? hunter.sweep.points : [];
  const passId = Number.isInteger(hunter?.passId) ? hunter.passId : 1;
  const levelPercent = Number.isFinite(score?.signalLiftPercent)
    ? score.signalLiftPercent
    : Number.isFinite(score?.audioStrength)
    ? score.audioStrength
    : 0;
  const nextPoint = {
    hz,
    passId,
    levelPercent,
    audioLevelPercent: Number.isFinite(score?.audioStrength) ? score.audioStrength : 0,
    noiseFloorPercent: Number.isFinite(score?.noiseFloorPercent) ? score.noiseFloorPercent : null,
    signalLiftPercent: Number.isFinite(score?.signalLiftPercent) ? score.signalLiftPercent : 0,
    voiceLikeScore: Number.isFinite(score?.voiceLikeScore) ? score.voiceLikeScore : 0,
    spectralVoiceScore: Number.isFinite(score?.spectralVoiceScore) ? score.spectralVoiceScore : 0,
    voiceTextureScore: Number.isFinite(score?.voiceTextureScore) ? score.voiceTextureScore : 0,
    modulationScore: Number.isFinite(score?.modulationScore) ? score.modulationScore : 0,
    score: Number.isFinite(score?.score) ? score.score : 0,
	    accepted: score?.accepted === true,
	    fastCandidate: score?.fastCandidate === true,
	    passCount: Number.isInteger(score?.passCount) ? score.passCount : null,
	    toneRejected: score?.toneRejected === true,
    broadbandRejected: score?.broadbandRejected === true,
    at: now
  };
  const minPassId = Math.max(1, passId - SSB_HUNTER_ROLLING_SWEEPS + 1);
  let nextPoints = previousPoints;
  let recalculateMax = false;
  const lastPoint = nextPoints[nextPoints.length - 1];
  if (lastPoint?.hz === hz && (lastPoint.passId ?? passId) === passId) {
    recalculateMax = (lastPoint.levelPercent ?? 0) >= (hunter?.sweep?.maxLevelPercent ?? 0);
    nextPoints[nextPoints.length - 1] = nextPoint;
  } else {
    nextPoints.push(nextPoint);
  }

  if ((hunter?.sweep?.oldestPassId ?? minPassId) < minPassId) {
    nextPoints = nextPoints.filter((point) => {
      const pointPassId = Number.isInteger(point?.passId) ? point.passId : passId;
      return Number.isInteger(point?.hz) && pointPassId >= minPassId;
    });
    recalculateMax = true;
  }

  if (nextPoints.length > SSB_HUNTER_SWEEP_MAX_POINTS) {
    nextPoints = nextPoints.slice(-SSB_HUNTER_SWEEP_MAX_POINTS);
    recalculateMax = true;
  }

  const maxLevelPercent = recalculateMax
    ? nextPoints.reduce((max, point) => Math.max(max, point.levelPercent ?? 0), 0)
    : Math.max(hunter?.sweep?.maxLevelPercent ?? 0, levelPercent);

  return {
    points: nextPoints,
    maxLevelPercent,
    passStartedAt: hunter?.sweep?.passStartedAt ?? now,
    rollingPasses: SSB_HUNTER_ROLLING_SWEEPS,
    oldestPassId: minPassId,
    newestPassId: passId
  };
}

function pruneHunterSweepForPass(sweep, passId, now = Date.now()) {
  if (!sweep) {
    return sweep;
  }

  const safePassId = Number.isInteger(passId) ? passId : 1;
  const minPassId = Math.max(1, safePassId - SSB_HUNTER_ROLLING_SWEEPS + 1);
  const points = (sweep.points ?? [])
    .filter((point) => {
      const pointPassId = Number.isInteger(point?.passId) ? point.passId : safePassId;
      return Number.isInteger(point?.hz) && pointPassId >= minPassId;
    })
    .slice(-SSB_HUNTER_SWEEP_MAX_POINTS);
  const maxLevelPercent = points.reduce((max, point) => Math.max(max, point.levelPercent ?? 0), 0);

  return {
    ...sweep,
    points,
    maxLevelPercent,
    passStartedAt: now,
    rollingPasses: SSB_HUNTER_ROLLING_SWEEPS,
    oldestPassId: minPassId,
    newestPassId: safePassId
  };
}

function pruneHunterFastCandidates(candidates, passId) {
  const safePassId = Number.isInteger(passId) ? passId : 1;
  return (candidates ?? [])
    .filter((candidate) => (
      Number.isInteger(candidate?.bucketHz)
        && safePassId - (candidate.lastSeenPass ?? safePassId) <= SSB_HUNTER_FAST_CANDIDATE_MAX_PASS_AGE
    ))
    .slice(0, 80);
}

function latestHunterSample(samples) {
  const safeSamples = Array.isArray(samples) ? samples : [];
  for (let index = safeSamples.length - 1; index >= 0; index -= 1) {
    const sample = safeSamples[index];
    if (Number.isFinite(Number(sample?.levelPercent))) {
      return sample;
    }
  }

  return null;
}

function hunterFastSpectrumScore(samples, score = {}) {
  const sample = latestHunterSample(samples);
  if (!sample) {
    return 0;
  }

  const midRatio = Number.isFinite(Number(sample.midRatio)) ? Number(sample.midRatio) : 0;
  const lowRatio = Number.isFinite(Number(sample.lowRatio)) ? Number(sample.lowRatio) : 0;
  const highRatio = Number.isFinite(Number(sample.highRatio)) ? Number(sample.highRatio) : 0;
  const texture = Number.isFinite(Number(sample.voiceTextureScore)) ? Number(sample.voiceTextureScore) : 0;
  const spread = Number.isFinite(Number(sample.voiceSpread)) ? Number(sample.voiceSpread) : 0;
  const peakToMean = Number.isFinite(Number(sample.voicePeakToMean)) ? Number(sample.voicePeakToMean) : 0;
  const serverScore = Number.isFinite(Number(score.spectralVoiceScore)) ? Number(score.spectralVoiceScore) : 0;

  return Math.round(clampNumber(
    serverScore * 0.28
      + texture * 0.44
      + clampNumber((midRatio - 0.42) * 95, 0, 30)
      + spread * 18
      + clampNumber((peakToMean - 1.15) * 9, 0, 10)
      - clampNumber((highRatio - 0.34) * 80, 0, 22)
      - clampNumber((lowRatio - 0.42) * 45, 0, 14),
    0,
    100
  ));
}

function hunterFastLiftScore(samples, hunter, score = {}) {
  const sample = latestHunterSample(samples);
  const audioStrength = Number.isFinite(Number(score.audioStrength))
    ? Number(score.audioStrength)
    : Number.isFinite(Number(sample?.levelPercent))
    ? Number(sample.levelPercent)
    : 0;
  const noiseFloorPercent = Number.isFinite(Number(score.noiseFloorPercent))
    ? Number(score.noiseFloorPercent)
    : Math.max(0, Number(hunter?.audioThresholdPercent ?? SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT) - 6);
  const signalLiftPercent = Number.isFinite(Number(score.signalLiftPercent))
    ? Number(score.signalLiftPercent)
    : Math.max(0, audioStrength - noiseFloorPercent);
  const spectralVoiceScore = hunterFastSpectrumScore(samples, score);
  const voiceScore = Number.isFinite(Number(sample?.voiceScore)) ? Number(sample.voiceScore) : Number(score.voiceLikeScore ?? 0);
  const modulationScore = Number.isFinite(Number(score.modulationScore)) ? Number(score.modulationScore) : 0;

  return Math.round(
    signalLiftPercent * 4.2
      + spectralVoiceScore * 1.55
      + voiceScore * 0.42
      + modulationScore * 0.55
  );
}

function isHunterFastLiftCandidate(samples, hunter, score = {}) {
  const sample = latestHunterSample(samples);
  if (!sample) {
    return false;
  }

  const audioStrength = Number.isFinite(Number(score.audioStrength))
    ? Number(score.audioStrength)
    : Number(sample.levelPercent);
  const noiseFloorPercent = Number.isFinite(Number(score.noiseFloorPercent))
    ? Number(score.noiseFloorPercent)
    : Math.max(0, Number(hunter?.audioThresholdPercent ?? SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT) - 6);
  const signalLiftPercent = Number.isFinite(Number(score.signalLiftPercent))
    ? Number(score.signalLiftPercent)
    : Math.max(0, audioStrength - noiseFloorPercent);
  const thresholdPercent = Math.max(
    SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT,
    Number(hunter?.audioThresholdPercent ?? SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT)
  );
  const liftGatePercent = normalizeHunterAudioLiftGatePercent(hunter?.audioLiftGatePercent);
  const spectralVoiceScore = hunterFastSpectrumScore(samples, score);
  const midRatio = Number.isFinite(Number(sample.midRatio)) ? Number(sample.midRatio) : 0;
  const highRatio = Number.isFinite(Number(sample.highRatio)) ? Number(sample.highRatio) : 0;
  const lowRatio = Number.isFinite(Number(sample.lowRatio)) ? Number(sample.lowRatio) : 0;
  const voiceSpread = Number.isFinite(Number(sample.voiceSpread)) ? Number(sample.voiceSpread) : 0;
  const peakToMean = Number.isFinite(Number(sample.voicePeakToMean)) ? Number(sample.voicePeakToMean) : 0;
  const toneLike = score?.toneRejected === true
    || (midRatio > 0.75 && highRatio < 0.16 && lowRatio < 0.18 && voiceSpread < 0.56 && peakToMean > 2.35);
  const broadbandNoise = score?.broadbandRejected === true
    || (highRatio > 0.42 && spectralVoiceScore < 54);

  return audioStrength >= thresholdPercent
    && signalLiftPercent >= liftGatePercent
    && spectralVoiceScore >= 50
    && !toneLike
    && !broadbandNoise;
}

function recordHunterFastCandidate({ hunter, hz, score, samples, now, range }) {
  const passId = Number.isInteger(hunter?.passId) ? hunter.passId : 1;
  const bucketHz = Math.max(1, SSB_HUNTER_FAST_BUCKET_HZ);
  const rangeStartHz = Number.isInteger(range?.startHz) ? range.startHz : 0;
  const bucketIndex = Math.floor((hz - rangeStartHz) / bucketHz);
  const bucketCenterHz = rangeStartHz + bucketIndex * bucketHz + Math.floor(bucketHz / 2);
  const existingCandidates = (hunter?.fastCandidates ?? [])
    .filter((candidate) => (
      Number.isInteger(candidate?.bucketHz)
        && passId - (candidate.lastSeenPass ?? passId) <= SSB_HUNTER_FAST_CANDIDATE_MAX_PASS_AGE
    ));
  const existing = existingCandidates.find((candidate) => candidate.bucketHz === bucketCenterHz);
  const candidateScore = hunterFastLiftScore(samples, hunter, score);
  const passIds = [...new Set([...(existing?.passIds ?? []), passId])]
    .filter((id) => Number.isInteger(id))
    .slice(-SSB_HUNTER_FAST_CONFIRM_PASSES);
  const improved = candidateScore >= (existing?.bestScore ?? 0);
  const nextCandidate = {
    bucketHz: bucketCenterHz,
    passIds,
    seenCount: (existing?.seenCount ?? 0) + 1,
    bestHz: improved ? hz : existing.bestHz,
    bestScore: improved ? candidateScore : existing.bestScore,
    lastScore: candidateScore,
    lastSeenPass: passId,
    lastSeenAt: now,
    spectralVoiceScore: hunterFastSpectrumScore(samples, score)
  };
  const candidates = [
    ...existingCandidates.filter((candidate) => candidate.bucketHz !== bucketCenterHz),
    nextCandidate
  ]
    .sort((left, right) => (right.bestScore ?? 0) - (left.bestScore ?? 0))
    .slice(0, 80);

  return {
    candidates,
    candidate: nextCandidate,
    confirmed: passIds.length >= SSB_HUNTER_FAST_CONFIRM_PASSES
  };
}

function isHunterEnvelopeCandidate(score, hunter) {
  if (score?.accepted) {
    return true;
  }

  const liftGate = normalizeHunterAudioLiftGatePercent(hunter?.audioLiftGatePercent);
  return Number(score?.audioStrength ?? 0) >= Math.max(8, (hunter?.audioThresholdPercent ?? SSB_HUNTER_MIN_AUDIO_LEVEL_PERCENT) * 0.6)
    && Number(score?.signalLiftPercent ?? 0) >= liftGate
    && (
      Number(score?.modulationScore ?? 0) >= 18
        || Number(score?.voiceLikeScore ?? 0) >= 28
    )
    && score?.toneRejected !== true
    && score?.broadbandRejected !== true;
}

function hunterEnvelopeCandidateScore(score) {
  return Math.round(
    Number(score?.signalLiftPercent ?? 0) * 4
      + Number(score?.modulationScore ?? 0) * 0.9
      + Number(score?.voiceLikeScore ?? 0)
  );
}

function hunterEnvelopeDwellForStep(envelope, baseDwellMs) {
  const step = Math.max(1, Number(envelope?.stepHz) || SSB_HUNTER_ENVELOPE_STEP_HZ);
  const studyFloor = Number.isInteger(envelope?.firstHeardHz)
    ? SSB_HUNTER_ENVELOPE_STUDY_DWELL_MS
    : SSB_HUNTER_ENVELOPE_DWELL_MS;
  return Math.max(studyFloor, Math.min(hunterDwellForStep(step, baseDwellMs), SSB_HUNTER_ENVELOPE_STUDY_DWELL_MS));
}

function isHunterFrequencySkipped(hz, hunter) {
  return (hunter?.skippedHz ?? []).some((skippedHz) => Math.abs(skippedHz - hz) <= SSB_HUNTER_SKIP_SPAN_HZ);
}

function normalizeSkippedHunterFrequencies(frequencies, range) {
  return [...new Set((frequencies ?? []).map(Number))]
    .filter((hz) => Number.isInteger(hz) && hz >= range.startHz && hz <= range.endHz)
    .slice(-40);
}

function normalizeSkippedChannelNumbers(channelNumbers, channels) {
  const validNumbers = new Set((channels ?? []).map((channel) => channel.number));
  return [...new Set((channelNumbers ?? []).map(Number))]
    .filter((channelNumber) => Number.isInteger(channelNumber) && validNumbers.has(channelNumber))
    .sort((a, b) => a - b);
}

function isSkippedChannel(channel, skippedChannelNumbers = []) {
  return Number.isInteger(channel?.number) && skippedChannelNumbers.includes(channel.number);
}

function rawToPercent(rawValue) {
  return Math.round((Math.min(255, Math.max(0, rawValue)) / 255) * 100);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function isRecentBusy(busyState) {
  return Boolean(busyState?.busy) && Date.now() - busyState.updatedAt < 300;
}

function scoreReadableSample({ rawValue, busy, thresholdRaw }) {
  let score = busy ? 3 : 0;
  if (rawValue >= thresholdRaw) {
    score += 2;
  }
  if (rawValue >= thresholdRaw + 28) {
    score += 1;
  }

  return score;
}

function rankScanHits(hits) {
  return [...hits].sort((a, b) => {
    const scoreDelta = (b.score ?? b.peakRaw) - (a.score ?? a.peakRaw);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    if ((b.peakRaw ?? 0) !== (a.peakRaw ?? 0)) {
      return (b.peakRaw ?? 0) - (a.peakRaw ?? 0);
    }

    return Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt);
  });
}

function getBandProfile(bandId) {
  const id = String(bandId ?? DEFAULT_BAND_ID);
  return BAND_PROFILES[Object.hasOwn(BAND_PROFILES, id) ? id : DEFAULT_BAND_ID];
}

function profileWithCustomChannels(profile, customChannels) {
  if (profile?.id === "cb" || !hasChannels(profile)) {
    return profile;
  }

  const channels = normalizeCustomChannels(customChannels, profile);
  if (channels.length === 0) {
    return profile;
  }

  return {
    ...profile,
    channels,
    defaultChannel: channels.some((channel) => channel.number === profile.defaultChannel)
      ? profile.defaultChannel
      : channels[0].number
  };
}

function normalizeCustomChannels(channels, profile) {
  if (!Array.isArray(channels) || !profile?.scanRange) {
    return [];
  }

  return channels
    .map((channel, index) => {
      const hz = Math.round(Number(channel?.hz));
      const number = Number.isInteger(Number(channel?.number)) ? Number(channel.number) : index + 1;
      const nickname = String(channel?.nickname ?? "").trim().slice(0, 24);
      return {
        number,
        hz,
        nickname
      };
    })
    .filter((channel) => Number.isInteger(channel.hz)
      && channel.hz >= profile.scanRange.startHz
      && channel.hz <= profile.scanRange.endHz)
    .sort((left, right) => left.number - right.number)
    .slice(0, 12)
    .map((channel, index) => createChannel(index + 1, channel.hz, "FAV", channel.nickname));
}

function publicBandProfiles() {
  return Object.fromEntries(Object.entries(BAND_PROFILES).map(([id, profile]) => [id, publicBandProfile(profile)]));
}

function publicBandProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    scanLabel: profile.scanLabel,
    centerHz: profile.centerHz,
    centerDisplay: parseCatFrame(formatSetVfoAFrequencyCommand(profile.centerHz)).display,
    defaultRfGain: profile.defaultRfGain,
    defaultRfGainPercent: Math.round((profile.defaultRfGain / MAX_RF_GAIN) * 100),
    defaultMode: profile.defaultMode ?? null,
    defaultChannel: profile.defaultChannel ?? null,
    defaultScanSource: profile.defaultScanSource ?? "frequency",
    scanRange: profile.scanRange,
    scanMode: scanSourceToMode(profile.defaultScanSource ?? "frequency"),
    channels: (profile.channels ?? []).map(publicChannel)
  };
}

function createChannel(number, hz, prefix = "CH", nickname = "") {
  return Object.freeze({
    number,
    hz,
    display: parseCatFrame(formatSetVfoAFrequencyCommand(hz)).display,
    label: `${prefix} ${String(number).padStart(2, "0")}`,
    nickname
  });
}

function publicChannel(channel) {
  return {
    number: channel.number,
    hz: channel.hz,
    display: channel.display,
    label: channel.label,
    nickname: channel.nickname ?? ""
  };
}

async function lookupQrzCallsignWithSession(credentials, call) {
  if (!qrzXmlSession?.key) {
    qrzXmlSession = await qrzXmlLogin(credentials);
  }

  try {
    return await qrzXmlLookupCallsign({
      sessionKey: qrzXmlSession.key,
      callsign: call
    });
  } catch (error) {
    if (!error.retrySession) {
      throw error;
    }

    qrzXmlSession = await qrzXmlLogin(credentials);
    return qrzXmlLookupCallsign({
      sessionKey: qrzXmlSession.key,
      callsign: call
    });
  }
}

function getActiveQrzXmlCredentials() {
  const envCredentials = getQrzXmlCredentials();
  if (envCredentials.configured) {
    return envCredentials;
  }

  if (qrzXmlRuntimeCredentials?.configured) {
    return qrzXmlRuntimeCredentials;
  }

  return {
    username: "",
    password: "",
    configured: false
  };
}

function getActiveQrzLogbookKey() {
  return getQrzLogbookKey() || qrzRuntimeLogbookKey;
}

function hasChannels(profile) {
  return (profile?.channels?.length ?? 0) > 0;
}

function findChannel(profile, channelNumber) {
  return profile?.channels?.find((channel) => channel.number === channelNumber) ?? null;
}

function findChannelForHz(profile, hz) {
  return profile?.channels?.find((channel) => channel.hz === hz) ?? null;
}

function findChannelIndex(channels, channelNumber) {
  const index = channels.findIndex((channel) => channel.number === channelNumber);
  return index >= 0 ? index : 0;
}

function findChannelIndexForHz(channels, hz, fallbackChannelNumber) {
  const byFrequency = channels.findIndex((channel) => channel.hz === hz);
  if (byFrequency >= 0) {
    return byFrequency;
  }

  return findChannelIndex(channels, fallbackChannelNumber);
}

function compactStateForClient(message) {
  if (message?.type !== "state") {
    return message;
  }

  const hunter = message.scan?.hunter;
  const points = hunter?.sweep?.points;
  if (!Array.isArray(points) || points.length <= SSB_HUNTER_BROADCAST_SWEEP_MAX_POINTS) {
    return message;
  }

  const compactedPoints = compactHunterSweepPoints(points, SSB_HUNTER_BROADCAST_SWEEP_MAX_POINTS);
  return {
    ...message,
    scan: {
      ...message.scan,
      hunter: {
        ...hunter,
        sweep: {
          ...hunter.sweep,
          points: compactedPoints,
          compacted: true,
          rawPointCount: points.length,
          broadcastMaxPoints: SSB_HUNTER_BROADCAST_SWEEP_MAX_POINTS
        }
      }
    }
  };
}

function compactHunterSweepPoints(points, maxPoints) {
  if (points.length <= maxPoints) {
    return points;
  }

  const stride = Math.ceil(points.length / maxPoints);
  const compacted = [];
  for (let index = 0; index < points.length; index += stride) {
    let best = points[index];
    let bestWeight = hunterSweepPointWeight(best);
    const end = Math.min(points.length, index + stride);
    for (let scanIndex = index + 1; scanIndex < end; scanIndex += 1) {
      const point = points[scanIndex];
      const weight = hunterSweepPointWeight(point);
      if (weight > bestWeight) {
        best = point;
        bestWeight = weight;
      }
    }
    compacted.push(best);
  }

  return compacted;
}

function hunterSweepPointWeight(point) {
  if (!point) {
    return 0;
  }

  const level = Number(point.levelPercent ?? point.signalLiftPercent ?? 0);
  const voice = Math.max(
    Number(point.voiceLikeScore ?? 0),
    Number(point.spectralVoiceScore ?? 0),
    Number(point.voiceTextureScore ?? 0),
    Number(point.modulationScore ?? 0)
  );
  const acceptedBonus = point.accepted ? 100 : 0;
  const candidateBonus = point.fastCandidate ? 45 : 0;
  const rejectPenalty = point.toneRejected || point.broadbandRejected ? 60 : 0;
  return level + voice + acceptedBonus + candidateBonus - rejectPenalty;
}

function send(socket, message) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  if (socket.bufferedAmount > WEBSOCKET_HARD_BUFFER_LIMIT_BYTES) {
    socket.close(1013, "Client fell behind");
    return;
  }

  if (message?.type === "state" && socket.bufferedAmount > WEBSOCKET_STATE_BUFFER_LIMIT_BYTES) {
    return;
  }

  socket.send(JSON.stringify(compactStateForClient(message)));
}

server.listen(Number(process.env.PORT ?? DEFAULT_PORT), LOOPBACK_ADDRESS, () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : DEFAULT_PORT;
  console.log(`FTdx3000 VFO Display listening on http://localhost:${port}`);
});
