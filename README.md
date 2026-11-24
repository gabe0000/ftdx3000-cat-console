# FTdx3000 VFO Display

A local operator console for the Yaesu FTdx3000, with CAT tuning, audio-based
scanning, station logging, and POTA spots. It is not a hosted service.

## Owner's Manual

The living operator manual is maintained at [docs/owners-manual.md](docs/owners-manual.md). Update it as controls, defaults, and safety behavior change.
For development and Codex handoff, start with [AGENTS.md](AGENTS.md).

Station-specific quick-start exports and screenshots are kept out of Git.

## Safety Model

- The server binds only to loopback and rejects cross-origin API and CAT WebSocket requests. It controls transmit and is intended for one trusted local operator. Do not expose it through a tunnel, proxy, or port forward; it does not authenticate local users.
- The app does not auto-connect to the radio.
- The browser UI cannot send arbitrary CAT commands.
- The serial bridge only allows these documented read commands:
  - `ID;` radio identification
  - `FA;` VFO-A frequency
  - `MD0;` operating mode
  - `SM0;` alternate receive meter reading
  - `RM1;` receive meter reading through the read-meter command
  - `RM5;` power output meter
  - `RM6;` SWR meter
  - `RG0;` RF gain reading
  - `BY;` RX busy reading for diagnostics
- When Tune keys is enabled, the serial bridge also allows `FA########;` to set VFO-A frequency from the current readout.
- The RF Gain slider sends throttled live `RG0###;` updates while it is moved.
- The active band page applies its preset on CAT connect. The 10 Meter page sets VFO-A to 28.400 MHz, USB, and RF Gain to 45%.
- While connected, the Apply band preset button sends the active page's `FA########;` and `RG0###;` preset.
- While connected, switching band pages automatically applies that band's preset frequency, mode when defined, and RF Gain. Any active scan is stopped first.
- While connected, switching bands automatically starts the antenna tuner after the preset frequency command succeeds. The tuner can transmit a carrier.
- PTT is hold-to-talk on the backtick key. It sends `TX1;` only while held and sends `TX0;` on key release, page blur, page hide, disconnect, scan start, session close, or the 2 minute timeout.
- QRZ Logbook integration is server-side. Put the key in `.env.local` as `QRZ_LOGBOOK_KEY`; the browser never receives it. Optional callsign lookup uses QRZ XML credentials from `QRZ_XML_USERNAME` and `QRZ_XML_PASSWORD`, also server-side only.
- Hardware flow control stays off.
- The RTS line defaults high because this matches the current RUMlogNG CAT setting on this Mac.
- The DTR line is held low.
- Stop bits default to 2 because this matches the current RUMlogNG serial setting on this Mac.
- VFO-A frequency polling can run as fast as 0.1 seconds; mode is read about every 5 seconds.
- The run view meter stack starts with the live RX audio meter. The CAT receive meter is kept only as diagnostic telemetry and is not used for scan decisions.
- The 10 Meter scanner sweeps 28.300-28.500 MHz by setting VFO-A with `FA########;` and logging audio-derived hits.
- The 6 Meter page uses the voice-capable 50.100-54.000 MHz segment, centered at 52.050 MHz, with USB and the same 45% RF Gain preset.
- The CB page uses the 40 eCFR CBRS channel center frequencies, opens on CH 06 at 27.025 MHz in AM, and scans by channel instead of by frequency step.
- CB scan wraps from CH 40 back to CH 01, starts regular audio scan at 5 ms dwell, adapts slower after false stops, quickly walks back toward 5 ms after good stops, logs audio hits against the channel that was actually sampled, and keeps only the top five strongest channel hits.
- Smart scan and regular scan require browser audio and do not fall back to S-meter or BUSY readings.
- The regular Scan button uses RX audio modulation; CB resumes after audio stays below the 25% gate for half a second. Smart scan has a separate 30 second dwell setting for building the top five list.
- SSB Hunter is a dedicated main-console tab, requires USB or LSB, actively hunts the active band range with CAT frequency steps, and only starts close-in refinement when RX audio reaches the live RX lift gate. It shows/selects the RX input, has live RX lift gate, lock hold, manual RF Gain, opt-in Auto RF target lift, `H` start, run-page tuning keys, backtick PTT, and a Spaceballs-style speed meter. Its broad sweep uses 0.001 MHz / 1 kHz steps with a 0.4 MHz-per-second target pace, remembers fast voice-like candidates across three passes, then backs up from a confirmed suspect and maps forward across a capped local two-sided audio envelope, currently max 5 kHz per side, with 250 Hz steps. It raises dwell after the first lift, brackets the far edge after a few quiet steps, then starts refinement at 250 Hz before narrowing toward 10 Hz. It defaults to a 5 second lock hold, stops hunting on manual VFO knob override, and has a Skip Target button for a narrow current-pass skip pocket. It tracks the local noise floor around nearby frequencies and scores lift plus voice-like modulation and voice-shaped spectrum texture instead of raw loudness alone, rejecting steady tones, tone-like digital audio, and broadband noise. The sweep lane keeps five rolling passes internally, burns older data, and broadcasts a compact visual subset to the browser so long hunts do not pile up memory. The lane heat-maps lift above floor across the current pass, normalized so that pass's strongest lift is 100%; cyan/blue marks voice-like candidates, red/white marks accepted peak-quality audio, and dim gray/blue marks noise or rejected tones. Its cursor follows VFO-A readback after manual takeover while the Hunter tab/window is visible.
- The run page and SSB Hunter frequency counters include Log Contact and Manual Freq popouts. The contact logger has segmented UTC date/time fields, can auto-fill name/QTH/grid from QRZ XML when configured, includes a POTA location field, uploads ADIF to QRZ, converts USB/LSB to SSB submodes, and supports QRZ replace mode. Manual Freq sends the normal VFO-A set-frequency command.
- The run page and SSB Hunter frequency counters also include POTA. The POTA tab fetches current spots from `https://api.pota.app/spot/activator`, filters them to the active band page's scan range, hides QRT spots by default, links park references to POTA, opens the Logger prefilled from a spot, and tunes VFO-A only when Tune is clicked.
- The Logbook tab fetches QRZ records for today, last 7 days, last 30 days, or all time using 250-record QRZ pages; renders QRZ callsign links; supports edit/replace and confirmed delete; and maps contacts with ADIF lat/lon or Maidenhead grid squares.
- The CB speed test runs short channel scans at several dwell settings and reports actual channel rate plus audio sample and modulation counts.
- The CB channel slider sends throttled live `FA########;` updates while connected and not scanning.
- It does not include VFO swap, keyer, memory, or menu controls.
- macOS serial devices ending in `1` are blocked because Yaesu documents the Standard COM Port as usable for TX controls.

## Run

```sh
npm ci
npm start
```

Then open:

```text
http://localhost:3030
```

If RUMlogNG is already connected to the FTdx3000 CAT port, this app may not be able to open the same serial port at the same time.

Optional QRZ settings are listed in [`.env.example`](.env.example). Put
values in the ignored `.env.local` file, never in committed files or issues.
Browser logs and station data are not part of the repository.

To personalize the station readouts, use the ignored
`public/station-settings.local.json` file. Its optional string fields are
`callsign`, `grid`, and `cbStationId`. This file is served to the local
browser, so it must never contain credentials.

## Official References Used

- Yaesu FTdx3000 CAT Operation Reference Book:
  - `FA;` read VFO-A frequency
  - `FA14250000;` set VFO-A frequency
  - `MD0;` read operating mode
  - `ID;` read radio identification
  - `SM0;` read alternate receive meter value
  - `RM1;` read receive meter value through the read-meter command
  - `RM5;` read PO meter value
  - `RM6;` read SWR meter value
  - `RG0;` read RF gain / `RG0###;` set RF gain
  - `MG;` / `MG###;` read/set MIC gain
  - `ML0;`, `ML1;`, `ML0000;`, `ML0001;`, `ML1###;` read/set radio MONI on/off and level
  - `PL;` / `PL###;` read/set speech processor level
  - `PR0;`, `PR1;`, `PR01;`, `PR02;`, `PR11;`, `PR12;` read/set speech processor and parametric mic EQ on/off
  - `BY;` read RX busy status
  - `TX1;` transmit on / `TX0;` transmit off
- Yaesu virtual COM port driver documentation:
  - Enhanced COM Port is used for CAT/frequency/mode operation.
  - Standard COM Port is used for TX controls.
- eCFR 47 CFR 95.963:
  - CBRS channel center frequencies for channels 1-40.
- QRZ Logbook API:
  - `https://www.qrz.com/docs/logbook/QRZLogbookAPI.html`
  - Server-side POST endpoint, required User-Agent, and `STATUS`/`INSERT`/`FETCH`/`DELETE` actions.
  - FETCH uses semicolon-separated options here and QRZ returns escaped ADIF that the app decodes before import.
- QRZ XML API:
  - `https://www.qrz.com/docs/xml/current_spec.html`
  - Server-side session login and callsign lookup for contact name, QTH, and grid.
- Parks on the Air:
  - `https://docs.pota.app/` for POTA hunter workflow.
  - `https://docs.pota.app/api/index.html` public API note.
  - `https://api.pota.app/spot/activator` current activator spot feed used by the app.
- Map base layer: [Natural Earth public-domain land data](https://www.naturalearthdata.com/about/terms-of-use/).
