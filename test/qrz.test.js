import assert from "node:assert/strict";
import test from "node:test";
import {
  bandFromFrequencyMhz,
  buildFetchOption,
  buildQrzContactAdif,
  dateRangeForPreset,
  isCbQrzContact,
  maidenheadToLatLon,
  parseAdifRecords,
  parseQrzNameValueResponse,
  parseQrzXmlResponse,
  radioModeToAdif,
  normalizeQrzXmlCallsign,
  validateQrzContact
} from "../src/qrz.js";

test("builds ADIF for a USB contact using SSB submode", () => {
  const adif = buildQrzContactAdif({
    stationCallsign: "n0call",
    call: "k1abc",
    qsoDate: "20260530",
    timeOn: "2345",
    freq: "28.4",
    band: "10m",
    mode: "USB",
    rstSent: "59",
    rstRcvd: "57",
    potaLocation: "US-1234"
  });

  assert.match(adif, /<station_callsign:6>N0CALL/);
  assert.match(adif, /<call:5>K1ABC/);
  assert.match(adif, /<mode:3>SSB/);
  assert.match(adif, /<submode:3>USB/);
  assert.match(adif, /<sig:4>POTA/);
  assert.match(adif, /<sig_info:7>US-1234/);
  assert.match(adif, /<app_yeasu_cat_pota_location:7>US-1234/);
  assert.match(adif, /<eor>$/);
});

test("validates required QRZ contact fields", () => {
  const result = validateQrzContact({
    stationCallsign: "N0CALL",
    call: "K1ABC",
    qsoDate: "20260530",
    timeOn: "2345",
    freq: "50.125",
    mode: "USB"
  });

  assert.equal(result.valid, true);
  assert.equal(result.contact.band, "6m");
});

test("identifies CB contacts as local-only QRZ blocked records", () => {
  assert.equal(isCbQrzContact({ band: "11m", freq: "27.025" }), true);
  assert.equal(isCbQrzContact({ band: "cb" }), true);
  assert.equal(isCbQrzContact({ freq: "27.385" }), true);
  assert.equal(isCbQrzContact({ band: "10m", freq: "28.4" }), false);
});

test("parses QRZ name value responses", () => {
  const result = parseQrzNameValueResponse("RESULT=OK&COUNT=1&LOGID=12345&REASON=Good+upload");
  assert.equal(result.RESULT, "OK");
  assert.equal(result.LOGID, "12345");
  assert.equal(result.REASON, "Good upload");
});

test("parses QRZ FETCH responses with escaped ADIF", () => {
  const result = parseQrzNameValueResponse("COUNT=1&RESULT=OK&ADIF=&lt;call:5&gt;K1ABC&lt;qso_date:8&gt;20260530&lt;eor&gt;");
  const records = parseAdifRecords(result.ADIF);

  assert.equal(result.RESULT, "OK");
  assert.equal(result.COUNT, "1");
  assert.equal(records.length, 1);
  assert.equal(records[0].call, "K1ABC");
});

test("parses and normalizes QRZ XML callsign lookup data", () => {
  const parsed = parseQrzXmlResponse(`<?xml version="1.0" ?>
    <QRZDatabase version="1.34">
      <Callsign>
        <call>K1ABC</call>
        <fname>Jane</fname>
        <name>Smith</name>
        <addr2>Atlanta</addr2>
        <state>GA</state>
        <country>United States</country>
        <grid>EM73</grid>
        <lat>33.75</lat>
        <lon>-84.39</lon>
      </Callsign>
      <Session><Key>abc123</Key></Session>
    </QRZDatabase>`);
  const record = normalizeQrzXmlCallsign(parsed.callsign);

  assert.equal(parsed.session.Key, "abc123");
  assert.equal(record.call, "K1ABC");
  assert.equal(record.name, "Jane Smith");
  assert.equal(record.qth, "Atlanta, GA");
  assert.equal(record.grid, "EM73");
  assert.equal(record.lat, "33.75");
  assert.equal(record.lon, "-84.39");
});

test("parses ADIF records and enriches QRZ links and grid coordinates", () => {
  const records = parseAdifRecords("<call:5>K1ABC<qso_date:8>20260530<time_on:4>2345<gridsquare:6>FN31pr<app_qrzlog_logid:5>12345<eor>");
  assert.equal(records.length, 1);
  assert.equal(records[0].call, "K1ABC");
  assert.equal(records[0].logid, "12345");
  assert.equal(records[0].qrzUrl, "https://www.qrz.com/db/K1ABC");
  assert.ok(records[0].coordinates.lat > 40);
  assert.ok(records[0].coordinates.lon < -70);
});

test("builds fetch options for presets", () => {
  const today = new Date(Date.UTC(2026, 4, 30));
  assert.equal(buildFetchOption({ range: "today", max: 100, today }), "BETWEEN:2026-05-30+2026-05-30;MAX:100;AFTERLOGID:0;TYPE:ADIF;STATUS:ALL");
  assert.equal(dateRangeForPreset("7d", today).start, "2026-05-24");
  assert.equal(buildFetchOption({ range: "all", max: 500 }), "MAX:250;AFTERLOGID:0;TYPE:ADIF;STATUS:ALL");
});

test("maps radio modes and frequency bands", () => {
  assert.deepEqual(radioModeToAdif("LSB"), { mode: "SSB", submode: "LSB" });
  assert.deepEqual(radioModeToAdif("AM"), { mode: "AM", submode: "" });
  assert.equal(bandFromFrequencyMhz("28.4"), "10m");
  assert.equal(bandFromFrequencyMhz("50.125"), "6m");
  assert.equal(bandFromFrequencyMhz("27.025"), "11m");
  assert.ok(maidenheadToLatLon("EM73").lat > 33);
});
