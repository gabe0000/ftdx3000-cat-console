export const READ_ONLY_COMMANDS = Object.freeze([
  "ID;",
  "FA;",
  "MD0;",
  "SM0;",
  "RM1;",
  "RM5;",
  "RM6;",
  "RG0;",
  "BY;",
  "PS;",
  "MG;",
  "ML0;",
  "ML1;",
  "PL;",
  "PR0;",
  "PR1;"
]);
export const MIN_FREQUENCY_HZ = 30_000;
export const MAX_FREQUENCY_HZ = 60_000_000;
export const MIN_RF_GAIN = 0;
export const MAX_RF_GAIN = 255;
export const MIN_PERCENT_CONTROL = 0;
export const MAX_PERCENT_CONTROL = 100;
export const MIN_MONITOR_LEVEL = 1;
export const MAX_MONITOR_LEVEL = 100;
export const NUDGE_STEPS_HZ = Object.freeze([-10, -5, -1, 1, 5, 10]);
export const S_UNITS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
export const MODE_COMMANDS = Object.freeze({
  LSB: "MD01;",
  USB: "MD02;",
  AM: "MD05;"
});

const MODE_NAMES = Object.freeze({
  "1": "LSB",
  "2": "USB",
  "3": "CW",
  "4": "FM",
  "5": "AM",
  "6": "FSK",
  "7": "CW-R",
  "8": "PKT-L",
  "9": "FSK-R",
  A: "PKT-FM",
  B: "FM-N",
  C: "PKT-U",
  D: "AM-N"
});

const READ_METER_NAMES = Object.freeze({
  "1": "s",
  "5": "power",
  "6": "swr"
});

export function parseCatFrame(frame) {
  const clean = String(frame ?? "").trim().toUpperCase();

  if (/^ID\d{4};$/.test(clean)) {
    return {
      type: "id",
      modelId: clean.slice(2, 6),
      raw: clean
    };
  }

  const frequencyMatch = clean.match(/^F([AB])(\d{7,11});$/);
  if (frequencyMatch) {
    const hz = Number.parseInt(frequencyMatch[2], 10);
    return {
      type: "frequency",
      vfo: frequencyMatch[1],
      hz,
      display: formatFrequency(hz),
      raw: clean
    };
  }

  const modeMatch = clean.match(/^MD0([1-9A-D]);$/);
  if (modeMatch) {
    return {
      type: "mode",
      mode: MODE_NAMES[modeMatch[1]] ?? modeMatch[1],
      code: modeMatch[1],
      raw: clean
    };
  }

  const meterMatch = clean.match(/^SM(\d)(\d{3});$/);
  if (meterMatch) {
    const rawValue = Number.parseInt(meterMatch[2], 10);

    return {
      type: "meter",
      meter: meterMatch[1],
      rawValue,
      percent: Math.round((rawValue / 255) * 100),
      raw: clean
    };
  }

  const rfGainMatch = clean.match(/^RG0(\d{3});$/);
  if (rfGainMatch) {
    const value = Number.parseInt(rfGainMatch[1], 10);

    return {
      type: "rfGain",
      value,
      percent: Math.round((value / MAX_RF_GAIN) * 100),
      raw: clean
    };
  }

  const micGainMatch = clean.match(/^MG(\d{3});$/);
  if (micGainMatch) {
    const value = Number.parseInt(micGainMatch[1], 10);

    return {
      type: "micGain",
      value,
      percent: value,
      raw: clean
    };
  }

  const monitorMatch = clean.match(/^ML([01])(\d{3});$/);
  if (monitorMatch) {
    const p1 = monitorMatch[1];
    const value = Number.parseInt(monitorMatch[2], 10);

    return {
      type: "monitorLevel",
      target: p1 === "0" ? "enabled" : "level",
      enabled: p1 === "0" ? value === 1 : undefined,
      value,
      percent: value,
      raw: clean
    };
  }

  const processorLevelMatch = clean.match(/^PL(\d{3});$/);
  if (processorLevelMatch) {
    const value = Number.parseInt(processorLevelMatch[1], 10);

    return {
      type: "processorLevel",
      value,
      percent: value,
      raw: clean
    };
  }

  const processorStatusMatch = clean.match(/^PR([01])([12]);$/);
  if (processorStatusMatch) {
    return {
      type: "processorStatus",
      target: processorStatusMatch[1] === "0" ? "processor" : "parametricEq",
      enabled: processorStatusMatch[2] === "2",
      raw: clean
    };
  }

  const readMeterMatch = clean.match(/^RM([0-8])(\d{3});$/);
  if (readMeterMatch) {
    const rawValue = Number.parseInt(readMeterMatch[2], 10);

    return {
      type: "readMeter",
      meter: readMeterMatch[1],
      name: READ_METER_NAMES[readMeterMatch[1]] ?? "frontPanel",
      rawValue,
      percent: Math.round((rawValue / 255) * 100),
      raw: clean
    };
  }

  const busyMatch = clean.match(/^BY([01])0;$/);
  if (busyMatch) {
    return {
      type: "busy",
      busy: busyMatch[1] === "1",
      code: busyMatch[1],
      raw: clean
    };
  }

  const powerSwitchMatch = clean.match(/^PS([01]);$/);
  if (powerSwitchMatch) {
    return {
      type: "powerSwitch",
      on: powerSwitchMatch[1] === "1",
      code: powerSwitchMatch[1],
      raw: clean
    };
  }

  return {
    type: "unknown",
    raw: clean
  };
}

export function splitCatFrames(buffer) {
  const text = String(buffer ?? "");
  const frames = [];
  let start = 0;
  let semicolonIndex = text.indexOf(";", start);

  while (semicolonIndex !== -1) {
    frames.push(text.slice(start, semicolonIndex + 1));
    start = semicolonIndex + 1;
    semicolonIndex = text.indexOf(";", start);
  }

  return {
    frames,
    remainder: text.slice(start)
  };
}

export function formatFrequency(hz) {
  if (!Number.isFinite(hz)) {
    return "--.---.---";
  }

  const mhz = Math.floor(hz / 1_000_000);
  const khz = Math.floor((hz % 1_000_000) / 1_000);
  const rest = hz % 1_000;

  return `${mhz}.${String(khz).padStart(3, "0")}.${String(rest).padStart(3, "0")}`;
}

export function formatSetVfoAFrequencyCommand(hz) {
  if (!Number.isInteger(hz) || hz < MIN_FREQUENCY_HZ || hz > MAX_FREQUENCY_HZ) {
    throw new Error(`Frequency must be between ${MIN_FREQUENCY_HZ} and ${MAX_FREQUENCY_HZ} Hz.`);
  }

  return `FA${String(hz).padStart(8, "0")};`;
}

export function formatSetModeCommand(mode) {
  const command = MODE_COMMANDS[String(mode ?? "").toUpperCase()];
  if (!command) {
    throw new Error("Mode must be AM, USB, or LSB.");
  }

  return command;
}

export function formatSetRfGainCommand(value) {
  const gain = Number.parseInt(value, 10);
  if (!Number.isInteger(gain) || gain < MIN_RF_GAIN || gain > MAX_RF_GAIN) {
    throw new Error(`RF gain must be between ${MIN_RF_GAIN} and ${MAX_RF_GAIN}.`);
  }

  return `RG0${String(gain).padStart(3, "0")};`;
}

export function formatSetMicGainCommand(value) {
  const gain = Number.parseInt(value, 10);
  if (!Number.isInteger(gain) || gain < MIN_PERCENT_CONTROL || gain > MAX_PERCENT_CONTROL) {
    throw new Error(`Mic gain must be between ${MIN_PERCENT_CONTROL} and ${MAX_PERCENT_CONTROL}.`);
  }

  return `MG${String(gain).padStart(3, "0")};`;
}

export function formatSetMonitorEnabledCommand(enabled) {
  return enabled === true ? "ML0001;" : "ML0000;";
}

export function formatSetMonitorLevelCommand(value) {
  const level = Number.parseInt(value, 10);
  if (!Number.isInteger(level) || level < MIN_MONITOR_LEVEL || level > MAX_MONITOR_LEVEL) {
    throw new Error(`Monitor level must be between ${MIN_MONITOR_LEVEL} and ${MAX_MONITOR_LEVEL}.`);
  }

  return `ML1${String(level).padStart(3, "0")};`;
}

export function formatSetProcessorLevelCommand(value) {
  const level = Number.parseInt(value, 10);
  if (!Number.isInteger(level) || level < MIN_PERCENT_CONTROL || level > MAX_PERCENT_CONTROL) {
    throw new Error(`Processor level must be between ${MIN_PERCENT_CONTROL} and ${MAX_PERCENT_CONTROL}.`);
  }

  return `PL${String(level).padStart(3, "0")};`;
}

export function formatSetProcessorEnabledCommand(enabled) {
  return enabled === true ? "PR02;" : "PR01;";
}

export function formatSetParametricEqEnabledCommand(enabled) {
  return enabled === true ? "PR12;" : "PR11;";
}

export function formatSetTransmitCommand(transmitting) {
  return transmitting ? "TX1;" : "TX0;";
}

export function formatStartAntennaTunerCommand() {
  return "AC002;";
}

export function formatSetPowerSwitchCommand(powered) {
  return powered === true ? "PS1;" : "PS0;";
}

export function rawMeterToApproxS(rawValue) {
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(9, Math.max(0, Math.round((value / 255) * 9)));
}

export function approxSToRawMeter(sUnit) {
  const value = Number.parseInt(sUnit, 10);
  if (!S_UNITS.includes(value)) {
    return approxSToRawMeter(3);
  }

  return Math.round((value / 9) * 255);
}

export function isLikelyRiskyTxPort(path) {
  return /usbserial-[\w-]+1$/i.test(String(path ?? ""));
}

export function toMacCalloutPath(path) {
  return String(path ?? "").replace(/^\/dev\/tty\./, "/dev/cu.");
}

export function normalizePollMs(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 250;
  }

  return Math.min(Math.max(parsed, 100), 5000);
}
