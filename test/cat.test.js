import assert from "node:assert/strict";
import test from "node:test";
import {
  formatFrequency,
  formatSetVfoAFrequencyCommand,
  isLikelyRiskyTxPort,
  normalizePollMs,
  rawMeterToApproxS,
  approxSToRawMeter,
  parseCatFrame,
  formatSetMicGainCommand,
  formatSetModeCommand,
  formatSetMonitorEnabledCommand,
  formatSetMonitorLevelCommand,
  formatSetParametricEqEnabledCommand,
  formatSetProcessorEnabledCommand,
  formatSetProcessorLevelCommand,
  formatSetPowerSwitchCommand,
  formatSetRfGainCommand,
  formatSetTransmitCommand,
  formatStartAntennaTunerCommand,
  splitCatFrames,
  toMacCalloutPath
} from "../src/cat.js";

test("parses VFO A frequency readback", () => {
  assert.deepEqual(parseCatFrame("FA014074000;"), {
    type: "frequency",
    vfo: "A",
    hz: 14074000,
    display: "14.074.000",
    raw: "FA014074000;"
  });
});

test("parses mode readback", () => {
  assert.deepEqual(parseCatFrame("MD02;"), {
    type: "mode",
    mode: "USB",
    code: "2",
    raw: "MD02;"
  });
});

test("formats allowed mode commands", () => {
  assert.equal(formatSetModeCommand("AM"), "MD05;");
  assert.equal(formatSetModeCommand("usb"), "MD02;");
  assert.equal(formatSetModeCommand("LSB"), "MD01;");
  assert.throws(() => formatSetModeCommand("FM"), /Mode must be/);
});

test("parses S-meter readback", () => {
  assert.deepEqual(parseCatFrame("SM0128;"), {
    type: "meter",
    meter: "0",
    rawValue: 128,
    percent: 50,
    raw: "SM0128;"
  });
});

test("parses read meter S, PO, and SWR readbacks", () => {
  assert.deepEqual(parseCatFrame("RM1128;"), {
    type: "readMeter",
    meter: "1",
    name: "s",
    rawValue: 128,
    percent: 50,
    raw: "RM1128;"
  });
  assert.deepEqual(parseCatFrame("RM5128;"), {
    type: "readMeter",
    meter: "5",
    name: "power",
    rawValue: 128,
    percent: 50,
    raw: "RM5128;"
  });
  assert.deepEqual(parseCatFrame("RM6064;"), {
    type: "readMeter",
    meter: "6",
    name: "swr",
    rawValue: 64,
    percent: 25,
    raw: "RM6064;"
  });
});

test("parses RF gain readback", () => {
  assert.deepEqual(parseCatFrame("RG0128;"), {
    type: "rfGain",
    value: 128,
    percent: 50,
    raw: "RG0128;"
  });
});

test("parses RX busy readback", () => {
  assert.deepEqual(parseCatFrame("BY10;"), {
    type: "busy",
    busy: true,
    code: "1",
    raw: "BY10;"
  });
  assert.deepEqual(parseCatFrame("BY00;"), {
    type: "busy",
    busy: false,
    code: "0",
    raw: "BY00;"
  });
});

test("parses and formats radio power switch commands", () => {
  assert.deepEqual(parseCatFrame("PS1;"), {
    type: "powerSwitch",
    on: true,
    code: "1",
    raw: "PS1;"
  });
  assert.deepEqual(parseCatFrame("PS0;"), {
    type: "powerSwitch",
    on: false,
    code: "0",
    raw: "PS0;"
  });
  assert.equal(formatSetPowerSwitchCommand(true), "PS1;");
  assert.equal(formatSetPowerSwitchCommand(false), "PS0;");
});

test("maps raw S-meter values to approximate S-units", () => {
  assert.equal(rawMeterToApproxS(0), 0);
  assert.equal(rawMeterToApproxS(128), 5);
  assert.equal(rawMeterToApproxS(255), 9);
  assert.equal(approxSToRawMeter(3), 85);
});

test("splits complete CAT frames and keeps partial remainder", () => {
  assert.deepEqual(splitCatFrames("FA014074000;MD02;FA0"), {
    frames: ["FA014074000;", "MD02;"],
    remainder: "FA0"
  });
});

test("formats hertz with MHz groups", () => {
  assert.equal(formatFrequency(7300000), "7.300.000");
  assert.equal(formatFrequency(50000000), "50.000.000");
});

test("formats VFO A set commands using Yaesu CAT frequency parameters", () => {
  assert.equal(formatSetVfoAFrequencyCommand(14250000), "FA14250000;");
  assert.equal(formatSetVfoAFrequencyCommand(30000), "FA00030000;");
});

test("formats RF gain set commands", () => {
  assert.equal(formatSetRfGainCommand(0), "RG0000;");
  assert.equal(formatSetRfGainCommand(128), "RG0128;");
  assert.equal(formatSetRfGainCommand(255), "RG0255;");
  assert.throws(() => formatSetRfGainCommand(256), /RF gain must be/);
});

test("parses and formats Yaesu TX audio controls", () => {
  assert.deepEqual(parseCatFrame("MG045;"), {
    type: "micGain",
    value: 45,
    percent: 45,
    raw: "MG045;"
  });
  assert.deepEqual(parseCatFrame("ML0001;"), {
    type: "monitorLevel",
    target: "enabled",
    enabled: true,
    value: 1,
    percent: 1,
    raw: "ML0001;"
  });
  assert.deepEqual(parseCatFrame("ML1032;"), {
    type: "monitorLevel",
    target: "level",
    enabled: undefined,
    value: 32,
    percent: 32,
    raw: "ML1032;"
  });
  assert.deepEqual(parseCatFrame("PL075;"), {
    type: "processorLevel",
    value: 75,
    percent: 75,
    raw: "PL075;"
  });
  assert.deepEqual(parseCatFrame("PR12;"), {
    type: "processorStatus",
    target: "parametricEq",
    enabled: true,
    raw: "PR12;"
  });
  assert.equal(formatSetMicGainCommand(45), "MG045;");
  assert.equal(formatSetMonitorEnabledCommand(true), "ML0001;");
  assert.equal(formatSetMonitorEnabledCommand(false), "ML0000;");
  assert.equal(formatSetMonitorLevelCommand(32), "ML1032;");
  assert.equal(formatSetProcessorLevelCommand(75), "PL075;");
  assert.equal(formatSetProcessorEnabledCommand(true), "PR02;");
  assert.equal(formatSetProcessorEnabledCommand(false), "PR01;");
  assert.equal(formatSetParametricEqEnabledCommand(true), "PR12;");
  assert.equal(formatSetParametricEqEnabledCommand(false), "PR11;");
  assert.throws(() => formatSetMonitorLevelCommand(0), /Monitor level must be/);
});

test("formats PTT transmit commands", () => {
  assert.equal(formatSetTransmitCommand(true), "TX1;");
  assert.equal(formatSetTransmitCommand(false), "TX0;");
});

test("formats antenna tuner start command", () => {
  assert.equal(formatStartAntennaTunerCommand(), "AC002;");
});

test("rejects VFO A set commands outside radio CAT frequency range", () => {
  assert.throws(() => formatSetVfoAFrequencyCommand(29999), /Frequency must be/);
  assert.throws(() => formatSetVfoAFrequencyCommand(60000001), /Frequency must be/);
});

test("blocks likely standard TX control port", () => {
  assert.equal(isLikelyRiskyTxPort("/dev/cu.usbserial-AH046H3L1101811"), true);
  assert.equal(isLikelyRiskyTxPort("/dev/cu.usbserial-AH046H3L1101810"), false);
});

test("normalizes polling interval", () => {
  assert.equal(normalizePollMs("50"), 100);
  assert.equal(normalizePollMs("100"), 100);
  assert.equal(normalizePollMs("2500"), 2500);
  assert.equal(normalizePollMs("9999"), 5000);
});

test("normalizes macOS serial paths to callout devices", () => {
  assert.equal(toMacCalloutPath("/dev/tty.usbserial-AH046H3L1101810"), "/dev/cu.usbserial-AH046H3L1101810");
  assert.equal(toMacCalloutPath("/dev/cu.usbserial-AH046H3L1101810"), "/dev/cu.usbserial-AH046H3L1101810");
});
