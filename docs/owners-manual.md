# FTdx3000 CAT Console Owner's Manual

Living manual started May 30, 2026. Keep this file updated as controls, defaults, and operating behavior change.

## Quick Start Copy

A picture-first quick start guide is available in PDF, HTML, and Markdown:

- `docs/quick-start-guide.pdf`
- `docs/quick-start-guide.html`
- `docs/quick-start-guide.md`

## What This App Is

This is a local browser console for operating the Yaesu FTdx3000 over CAT from a Mac. It is being built as a practical front panel for band presets, VFO-A tuning, meter display, audio monitoring, scanning, and operator shortcuts.

The app runs locally at:

```text
http://localhost:3030
```

## Safety Basics

- The app does not auto-connect to the radio.
- The app sends only the CAT commands that have been intentionally wired into the bridge.
- Scan start releases PTT before scanning.
- PTT is hold-to-talk only on the backtick key.
- PTT has a 2 minute timeout timer.
- PTT releases on key up, page blur, page hide, disconnect, session close, scan start, or timeout.
- CAT is blocked from likely Yaesu Standard COM Port paths ending in `1`; use the Enhanced COM Port path ending in `0`.

## Page Defaults

On page load:

- 10 Meter page is selected.
- VFO-A display starts centered at `28.400.000`.
- Mode display defaults to USB.
- RF Gain display defaults to `45%`.
- Tune keys are on.
- PTT is armed, but not transmitting.
- Audio monitor is on at `50%`.

On CAT connect, mode change, or band change:

- Audio monitor is turned on.
- Audio monitor volume is reset to `50%`.
- The active band preset is applied when appropriate, but CAT connect tunes the radio to the frequency/channel currently shown in the browser instead of forcing the band center.
- 10 Meter and 6 Meter default to USB.
- RF Gain returns to that band's default `45%`.

On a connected band switch from the run page:

- The band preset is applied first.
- The antenna tuner starts automatically after the frequency command succeeds.

## Band Pages

### HF Phone Selector

The former 10 Meter tab is now **HF Phone**. Use **Phone band** above the
frequency counter to choose a band. Its frequency slider, scan range,
favorites, Active POTA list, and band logbook follow the selection. The
dedicated 6 Meter and CB tabs are still available. Opening SSB Hunter from the
scan controls stages the selected amateur band.

The default remains **10 Meter (Technician)**, 28.300-28.500 MHz. The
**10 Meter (Extra)** profile and the other phone profiles use the U.S. Amateur
Extra phone allocations applicable to this station: 160 m (1.800-2.000),
75 m (3.600-4.000), 40 m (7.125-7.300), 20 m (14.150-14.350),
17 m (18.110-18.168), 15 m (21.200-21.450), 12 m (24.930-24.990),
10 m (28.300-29.700), and 6 m (50.100-54.000 MHz). 160, 75, and 40 m
default to LSB; the others default to USB. 75 m QSOs use the ADIF band
`80m`, and both 10 m profiles use `10m`.

These are tuning and scan profiles, not transmit authorization or a license
interlock. 30 m is omitted because it has no phone allocation. 60 m is
marked as rig memories rather than treated as an ordinary continuous CAT
band; refer to the [Yaesu operating manual](https://yaesu.com/product-detail.aspx?CatName=Legacy&Model=FT+DX+3000)
and the [FCC 60 m rules](https://www.govinfo.gov/content/pkg/FR-2026-01-14/html/2026-00587.htm).
See [47 CFR 97.305](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97/subpart-D/section-97.305)
for the phone allocations.

With CAT connected, the RF Gain slider and percentage follow the gain
reported by the radio, including changes made with the front-panel knob.
In Hunter Auto RF mode, the slider still sets the algorithm's target rather
than mirroring the knob.

### 10 Meter

- Center frequency: `28.400.000`
- Scan range: `28.300.000` to `28.500.000`
- Default mode: USB
- Default RF Gain: `45%`
- Mode buttons: AM, USB, LSB
- Favorites are available as preset channels and can be edited from the favorite cards. Each favorite can have a name and frequency, saved in this browser.

### 6 Meter

- Voice allocation scan range: `50.100.000` to `54.000.000`
- Center frequency: `52.050.000`
- Default mode: USB
- Default RF Gain: `45%`
- Mode buttons: AM, USB, LSB
- Favorites are available as preset channels and can be edited from the favorite cards. Each favorite can have a name and frequency, saved in this browser.

### CB

- Opens on channel 6.
- Default mode is AM.
- Uses the 40 CB channel center frequencies as presets.
- The top frequency-area slider has a CB-only Channel Mode / Frequency Mode switch.
- Channel Mode moves through CB channels; Frequency Mode moves through the CB range in 10 Hz steps.
- Scan wraps from channel 40 back to channel 1.
- Regular CB scan starts at a 5 ms dwell rate, adapts upward if it false-stops too often, and quickly walks back toward 5 ms after good stops.
- If a CB audio hit turns out to be a blip, two quiet channel passes clear that penalty and snap the dwell back toward the 5 ms floor.
- Regular CB scan pauses when RX audio reaches `25%` or higher, then resumes after audio stays below that threshold for half a second.
- Regular CB scan uses one-channel backtrack verification for fast audio hits. If audio lands just after the scanner has already advanced, the app steps back to verify the previous channel before committing to the audio hold.
- CB contacts are saved to the local CB log only. The app intentionally blocks CB/11m contacts from QRZ upload/sync.
- The Logger keeps the local CB identity separate from the ham/QRZ station callsign.

## Main Controls

The console uses a red/white/blue Yaesu-inspired display treatment. The station callsign is shown on the main frequency readout, SSB Hunter, the QRZ Logger tab, the POTA tab, and manual popouts.

The top-right HF Stack power button is a soft shutdown for radio work. When it is off, the browser page stays available, the run pages stay visible in a faded standby state, and the Logger/Logbook remain usable. CAT connect, radio polling, scanning, PTT, audio capture, and SSB Hunter are stopped or blocked until the HF Stack is turned back on.

When HF Stack is turned back on, the app reconnects CAT if a port is already selected. If the active band supports the tuner, the band preset is applied and the antenna tuner is started.

The separate Rig Power button sends the Yaesu CAT `PS` power-switch command directly. Per the Yaesu CAT reference, the app sends `PS;` first as the required dummy/read command, then sends `PS1;` or `PS0;` about 1.2 seconds later.

### Frequency Display

The large display shows the current VFO-A frequency. During fast scans, the display follows the app's commanded frequency instead of waiting for radio polling.

The frequency counter area also has:

- POTA: opens the POTA tab for the current band plan.
- Log Contact: opens the QRZ Logger tab with the current band, mode, and VFO-A frequency filled in.
- Manual Freq: opens a direct VFO-A frequency entry popout.

At the bottom of each band page, the Band Logbook panel shows recent loaded contacts for that band so the operator can check whether a station has already been worked. On 10m and 6m it reads from the loaded QRZ Logbook data. On CB it reads from the local-only CB log and never sends those records to QRZ.

### Mode Buttons

AM, USB, and LSB buttons send the corresponding mode command to the radio. Changing mode also resets RF Gain to the current band's default.

### Tune Keys

Tune keys are on by default.

- Left arrow: down 5 Hz
- Right arrow: up 5 Hz
- Up arrow: up 10 Hz
- Down arrow: down 10 Hz
- Comma: down 1 Hz
- Period: up 1 Hz

Tune keys are disabled while scanning.

### PTT

PTT is armed by default.

- Hold backtick to transmit.
- Release backtick to return to receive.
- Backtick PTT is captured before focused sliders, buttons, or text fields can consume it.
- The app sends `TX1;` for transmit and `TX0;` for receive.
- The app forces receive after 2 minutes even if the key state gets stuck.

The PTT status indicator shows:

- `Ready`: armed and receiving.
- `TX`: transmitting.
- `Disarmed`: keyboard PTT is disabled.

## Meter Stack

The meter stack shows:

- RX audio level from the browser audio input
- Power meter from `RM5;`
- SWR meter from `RM6;`

The audio meter is the scan signal source. Smart scan, Regular scan, and SSB Hunter use RX audio level movement/modulation rather than S units.

## Audio Monitor

The audio monitor listens to the selected browser audio input, preferably the USB Audio CODEC from the radio.

Default:

- Monitor on
- Volume `50%`

If audio does not start:

- Use Chrome if the in-app browser cannot get microphone permission.
- Confirm macOS allows the browser or Codex to use microphone/audio input.
- Refresh audio inputs from Nerd Stuff.

If the audio level rises when the app monitor volume or speaker volume is turned up, the browser is probably listening to an output, loopback, or room microphone instead of the radio's receive audio. Pick the USB Audio CODEC or equivalent radio receive input before scanning.

### Transmit Audio Monitor

For transmit audio quality, use headphones plugged into the radio PHONES jack with the radio's MONI/Monitor function. That is the preferred confidence path for mic distance, voice tone, compression, and speech level.

- The Audio Test page and Nerd Stuff page can now control the radio-side MONI on/off and MONI level through the Yaesu `ML` CAT command.
- The Audio Test TX Audio Lab can also control Yaesu `MG` MIC gain, `PL` speech processor level, `PR0` speech processor on/off, and `PR1` parametric mic EQ on/off.
- These are real radio settings, not browser listen volume. Move them deliberately and start with radio headphone/monitor level low.
- The app does not change mic source or deep parametric EQ menu band values yet.
- Start with radio headphone/monitor level low and bring it up gently.
- If the Audio Test USB return sounds unlike the radio PHONES monitor, trust the radio PHONES monitor for transmit-audio dialing.

### Audio Test

The Audio Test tab is a real-time diagnostic cockpit for the selected radio audio return.

- Start Audio uses the same selected input as the RX audio monitor.
- The dashboard shows return percent, dBFS, clipping, voice score, modulation movement, peak frequency, centroid frequency, low/voice/high balance, waveform, and spectrum.
- Auto MIC Peak runs an 8-second audio-return check while the operator speaks, then suggests a safer MIC gain target aimed at clean peaks with clipping headroom. It does not key the radio and only applies the suggested MIC gain when the operator presses Apply MIC.
- Browser listen controls only change local browser monitoring. Radio MONI controls change the FTdx3000 monitor setting.
- The Live read panel explains likely causes such as clipping, very low return, high-heavy thin audio, low-heavy rumble, or flattened dynamics.
- If the radio power meter moves while the Audio Test return stays steady, treat the USB return as a monitor/receive path rather than proof of what the other station hears.
- The analyzer is diagnostic; the TX Audio Lab sliders/buttons are the intentional radio-setting controls.

## Scanning

There are three scan tools on the run page.

### Smart Scan

Smart scan builds the Smart Top 5 list.

- Runs for 30 seconds.
- Keeps scanning when it hears activity.
- Requires the browser audio monitor.
- Uses RX audio level modulation; it does not use S units, BUSY, or the CAT receive meter for hit decisions.
- Uses its own Smart dwell setting in Nerd Stuff.
- Keeps only the top five strongest or most modulating audio entries.
- Groups nearby frequency hits so the top five does not fill with the same QSO.

Click a Smart Top 5 entry to tune VFO-A to that frequency or channel.

### Regular Scan

Regular scan is for operator listening.

- Uses the selected scan source: frequency, presets, or top five.
- On 10m and 6m, preset scans use the locally edited favorites and nicknames.
- Uses its own Regular dwell setting in Nerd Stuff.
- Uses RX audio modulation instead of BUSY status or S-meter thresholds.
- Pauses when modulating audio is detected.
- Resumes one second after audio modulation drops on 10m/6m.
- On CB, regular scan is level-triggered instead: it starts at 5 ms dwell, slows itself after false stops, returns toward 5 ms after good stops, holds when RX audio reaches `25%` or higher, and resumes after audio stays below that threshold for half a second.

The operator should still set squelch and RF gain for usable receive behavior.

### SSB Hunter

SSB Hunter is a dedicated tab in the main console. It owns its own browser audio capture and uses the same CAT session as the main console.

- Available on all bands.
- The tab has a band selector at the top. Choosing a band stages that band for the next hunt without changing the radio by itself.
- Requires USB or LSB before it will start.
- Uses VFO-A and the selected band's scan range.
- Starts the broad sweep with 0.001 MHz / 1 kHz steps. The Cycle Dwell slider does not change that step; it changes how long Hunter waits at each step before moving from 28.001 to 28.002 to 28.003, etc.
- Requires a voice-like suspect to show up across three fast passes before it commits to an envelope study.
- Once a suspect is confirmed, it narrows through 250, 100, 50, and 10 Hz while it refines the signal.
- Actively tunes through the selected band range using CAT frequency commands.
- Uses RX audio level modulation as the main signal.
- Tracks the local audio noise floor around nearby frequencies and looks for lift above that floor instead of raw loudness alone.
- Scores voice-like audio by combining RX level movement, mid-band voice energy, voice-spectrum texture, audio peak/centroid movement, and high/low noise rejection.
- Shows the dashboard RX input so the operator can confirm it is the USB Audio CODEC/radio input, not output audio.
- Keeps a 15% absolute RX audio sanity gate, but the main RX gate slider now works as a lift-over-local-floor index.
- When a suspect is heard, it enters an envelope mapping pass before fine tuning.
- Envelope mapping rewinds from the suspect frequency and sweeps forward through a matching study window before fine tuning. The request is still based on 10% of the selected band range, but it is capped to 5 kHz on each side so one suspect cannot consume a large chunk of the band.
- During envelope mapping, it treats strong lift/modulation points as interesting even before they fully pass the voice gate, records the first signal edge, strongest point, and far edge, then confines the fine hunt to that mapped span with a small guard pad.
- The envelope survey uses 250 Hz steps and a quick dwell until it sees lift.
- After the first envelope hit, dwell rises so the pass studies the signal shape.
- Once the signal drops away for a few 250 Hz steps, the survey brackets the peak and starts refinement.
- Fine refinement always starts at 250 Hz, then narrows through 100, 50, and 10 Hz.
- The RX lift gate slider changes the required audio lift above the local noise floor live while the hunt is running.
- The Lock Hold slider changes how long a confirmed lock is held before hunting resumes. The default is 5 seconds.
- The Cycle Dwell slider changes the wide-hunt wait time live while the hunt is running. Lower dwell covers more band faster; higher dwell gives the receiver and browser audio analyzer more time to catch a voice before moving on.
- The RF Gain slider sends live `RG0###;` changes while Auto RF is off.
- Auto RF is opt-in. When enabled, the RF slider becomes a target-lift index and the app nudges RF Gain slowly to keep received audio lift near that target.
- Auto RF is not enabled by default.
- The Sweep Lane cursor follows VFO-A readback after a manual VFO override, so the operator can use the physical dial to inspect visible peaks.
- After a manual VFO override, Envelope Focus switches to a 0.1 MHz study window centered on the live VFO-A readback and prints that frequency inside the graph.
- The Sweep Lane keeps five rolling sweeps, burns older sweep data, and updates each frequency as it is rescanned.
- The server keeps the rolling hunt data needed for the algorithm, but browsers receive a compact visual subset so long hunts do not grow memory without bound.
- The Speed meter shows the live hunt tune rate, up to Ludicrous Speed.
- Increases dwell time as it narrows: about 35 ms at the 1 kHz broad step by default, 35 ms at 500 Hz, 70 ms at 250 Hz, 250 ms at 100 Hz, 450 ms at 50 Hz, and 900 ms at 10 Hz.
- At 10 Hz, keeps walking around the best frequency for several modulation-positive passes before parking.
- If audio dips during the 10 Hz pass, it keeps probing around the suspect for 8 misses before giving up.
- Resets to the 1 kHz broad hunt step whenever it moves on from a suspect.
- Skip Target adds the current suspect to a narrow 100 Hz skip pocket for the current pass and immediately resumes wide hunting forward from the current suspect area. It only wraps to the band start when it reaches the end of the selected range, and skip pockets clear on that new pass.
- Rejects steady audio levels, steady tones, tone-like digital/RTTY-ish audio, and broadband noise, then keeps hunting.
- Sweep colors are intentionally diagnostic: red/white means accepted or peak-quality audio, cyan/blue means voice-like candidate energy, and dim gray/blue means ordinary noise or rejected tone-like energy.
- Parks on the best modulating signal it finds.
- If audio disappears while locked, it stays parked until the Lock Hold timer expires.
- After the lock hold expires, it resumes hunting forward from the resume frequency.
- If a suspect is a dead end, it drops that narrow pocket and moves on without checking back.
- Press `H` in the dashboard to start hunting.
- The Hunter frequency counter also has POTA, Log Contact, and Manual Freq buttons. Log Contact opens the main QRZ Logger tab; POTA opens the main POTA tab; Manual Freq uses the same popout as the run page.
- Hunter dashboard tuning hotkeys match the run page when no scan is active: comma/period move 1 Hz, left/right arrows move 5 Hz, and up/down arrows move 10 Hz.
- Hold backtick to PTT from the Hunter dashboard. Release backtick to return to receive. The 2 minute timeout still applies.
- If the physical VFO knob moves during an active hunt, the dashboard treats that as a manual override, updates to the radio readback, and stops hunting.
- When not hunting, VFO-A frequency is polled aggressively so the dashboard follows the physical knob. Manual study samples are only sent while the SSB Hunter tab/window is visible.

The SSB Hunter dashboard shows:

- Large frequency display
- Hunt phase
- Current step
- Best score and best frequency
- Lock timer and resume frequency
- Audio level and modulation meter
- Tone rejection state
- Score trace and sweep lane
- Sweep lane heat map normalized per pass, where the strongest lift above the local floor in that pass renders as 100%
- Envelope Focus window that shows `HUNTING` during wide search, then zooms into the suspect envelope during mapping/refinement with cursor, edge, and peak markers
- Candidate history and nerd metrics
- Local floor, lift, voice shape, spectrum fit, and wide-noise rejection metrics

## Channel And Frequency Slider

The main band page also has a quick tuning strip beside the frequency counter:

- Frequency slider: tunes VFO-A through the selected band's scan range in 10 Hz steps.
- On the CB page only, this top slider can toggle to Channel Mode and step through channels 1-40.
- Frequency slider follows VFO-A CAT readback when the physical radio dial is moved, except while the browser slider is actively being dragged.
- Clarifier slider: offsets around the current VFO-A frequency by up to `+/-500 Hz`.
- RF Gain slider: live RF gain control using the normal `RG0###;` command.

The tuning sliders are disabled while scanning.

## QRZ Logbook

QRZ integration is handled by the local server. The browser never receives the QRZ logbook key.

Local credential file:

```text
.env.local
```

Expected variable:

```text
QRZ_LOGBOOK_KEY=your-key-here
```

Optional QRZ callsign lookup variables:

```text
QRZ_XML_USERNAME=your-qrz-login
QRZ_XML_PASSWORD=your-qrz-password
```

If those XML variables are not present, the Contact Logger prompts for QRZ XML login the first time a callsign lookup needs it. Those XML credentials are held only in local server memory for the current app session and are cleared when the server stops. The same QRZ Login dialog can also accept a Logbook API key for session-only upload/fetch use.

The QRZ Contact Logger tab:

- Uses the current VFO-A frequency, band, and mode when opened from the run page, SSB Hunter, Logbook edit tools, or a POTA spot.
- On a fresh QSO, the displayed/logged frequency follows live VFO-A until the contact callsign field loses focus.
- When the contact callsign field loses focus, the logger locks the QSO frequency so later tuning does not change that contact's logged frequency.
- Pressing New QSO or successfully logging a contact releases the frequency lock and returns the logger to live VFO-A follow mode.
- Includes a small CAT control strip so the operator can keep working while logging.
- Hold the logger PTT button, or hold backtick while the logger is focused, to transmit. The logger owns the backtick key even while typing in form fields, so it will not enter a backtick character. Release to return to receive. The 2 minute timeout still applies.
- Includes a live RF Gain slider using the normal `RG0###;` command.
- Includes a centered clarifier-style VFO trim slider. It starts at `0 Hz`, spans `-500 Hz` to `+500 Hz`, sends small VFO-A nudge commands as it moves, and updates the displayed/logged frequency live.
- Saves My Callsign locally in the browser after first use.
- Uses segmented UTC date fields for month, day, and year.
- Uses segmented UTC time fields for hour and minute.
- When the contact callsign field loses focus, it can use QRZ XML lookup to auto-fill name, QTH, and grid if `QRZ_XML_USERNAME` and `QRZ_XML_PASSWORD` are configured.
- When the contact callsign field loses focus, the logger also checks QRZ Logbook for that callsign, flags same-UTC-day repeat contacts, and lists previous QSOs with date/time, elapsed time, frequency, and QTH/grid.
- If XML credentials are not configured in `.env.local`, the logger asks for them and holds them only for the running server session.
- The QRZ Login button opens the same session login dialog manually, with an optional field for a session-only Logbook API key.
- QRZ XML auto-fill only fills empty name, QTH, and grid fields.
- Includes a POTA location field for park/reference notes.
- If a recent POTA spot was tuned from the POTA popout and the current frequency is still close to that spot, the logger can prefill the activator callsign and POTA location.
- Uploads ADIF to QRZ Logbook through the local server.
- On CB/11m, saves contacts to the local CB log instead of QRZ. This block is enforced in both the browser logger and the local server QRZ upload route.
- Clicking the Logger tab starts a fresh QSO using the current radio/app context. In CB mode, the Logger treats the contact callsign field as Number, shows a dedicated Handle box, and treats QTH as Location. Clicking Edit on a local CB log row opens that record in the Logger tab for editing. Saving updates the same local CB record and still skips QRZ.
- After a successful Log Contact upload, clears the contact fields for the next QSO, keeps My Callsign, refreshes UTC time/current frequency, and leaves a bottom confirmation message naming the last logged callsign.
- Converts USB and LSB to ADIF `MODE=SSB` with `SUBMODE=USB` or `SUBMODE=LSB`.
- Can replace a matching QRZ record when Replace is enabled.
- Can open the contacted callsign's QRZ page.
- The Queue QSO Card button marks the current contact for a physical QSO card. The queue is local console metadata; it does not write a QRZ field. When the contact is logged or a local CB record is saved, the queue entry is tied to that saved record when possible.

The Manual Freq popout:

- Lets the operator type a frequency in MHz.
- Sends the normal VFO-A set-frequency CAT command through the local server.
- Uses the selected band context for validation and app state.

The Logbook tab:

- Checks QRZ API status.
- Fetches all QRZ Logbook records by default, then filters Today, Last 7 days, Last 30 days, or All time locally in the browser.
- Uses semicolon-separated QRZ FETCH options and decodes QRZ's escaped ADIF response before importing records.
- Uses QRZ paging in 250-record pages, up to 40 pages per refresh.
- Shows callsigns as links to QRZ callsign pages, with the contact name beside the callsign when QRZ provides one.
- Shows a QRZ logbook table with date, time, band, mode, frequency, grid/QTH, and tools.
- Includes a Cards filter for All cards, Queued unsent, and Sent cards.
- Each logbook row can Queue Card, mark a queued card as Card Sent, or Queue Again after a sent card. These buttons update local console metadata only; they do not sync card status to QRZ.
- Opens a contact in the logger for edits/replacement. If a QRZ edit/delete button cannot match a loaded row, the Logbook status line reports that instead of failing silently.
- Can delete QRZ records after a browser confirmation.
- If an existing imported QRZ record is on CB/11m, QRZ write tools are disabled in the interface. New CB contacts should live in the local CB log.
- Includes a Local CB Log section for CB contacts saved in this browser. It never syncs to QRZ.
- Local CB Log rows include an Edit link to edit the local record in the Logger tab and the same local QSO-card Queue/Sent controls. CB log columns are Number, Handle, Location, Frequency, Mode, Date EST, Time EST, and Edit.
- Maps records with `LAT/LON` fields or a valid Maidenhead grid square.
- Uses a local Natural Earth low-resolution land dataset as the map overlay, with logbook pins rendered above it.

## POTA Spots

The POTA button opens the main POTA tab using POTA's public activator spot feed. The same POTA page can still run standalone as a fallback, but normal operation is in the console tab.

- The spot feed is fetched by the local server from `https://api.pota.app/spot/activator`.
- The POTA tab filters spots to the current band page's scan range.
- The POTA tab has a Mode dropdown. USB and LSB include generic POTA `SSB` spots, and the selected sideband is used when sending a spot to the Logger. Changing the dropdown does not move the radio by itself.
- 10 Meter shows spots inside `28.300.000` to `28.500.000`.
- 6 Meter shows spots inside `50.100.000` to `54.000.000`.
- CB uses the CB frequency range and will normally have no POTA spots.
- The amateur band pages also show an Active POTA strip. It refreshes periodically and offers a Tune button for each displayed activation.
- POTA frequencies are received in kHz and converted to VFO-A hertz.
- QRT spots are hidden by default; Show QRT spots can reveal them.
- Worked Today appears only when the QRZ logbook already has that activator callsign at that exact park reference on the current UTC date.
- Clicking Tune sends the selected spot frequency to VFO-A through the normal CAT set-frequency command. This is the only POTA row action that changes the radio frequency.
- The Park link opens the POTA park page in a browser tab.
- The Respot button opens POTA's official site and copies a short spot summary so the operator can finish the respot manually.
- The Log button opens the main QRZ Logger tab with the activator callsign, spot frequency, mode, QTH park label, and POTA park/reference prefilled. It does not tune the radio.
- POTA-originated QRZ logs include `SIG=POTA` and `SIG_INFO=<park reference>` in addition to the app's local POTA location field.

## Nerd Stuff

The Nerd Stuff page is a slower diagnostic dashboard for setup, tuning, and debugging. It updates the main telemetry at about once per second so the operator can actually read the values instead of watching a blur.

It includes:

- CAT link lab: serial port, CAT rate, poll interval, RTS, stop bits, refresh, connect, and disconnect.
- Radio freeze frame: model, band page, VFO-A, raw hertz, mode, RF gain, PTT state, last command, last RX frame, RX frame count, and radio readback age.
- Scanner lab: step, smart dwell, regular dwell, speed test, active intent/source/mode, current scan frequency, sample counts, voice sample counts, missed/late samples, and hit count.
- Audio intake: input selection, refresh/start/stop audio, browser listen level, radio MONI on/off and level, RX level, dBFS, clipping, voice score, modulation, peak, centroid, and sample age.
- Safety rails: CAT command allowlist, tune-key state, PTT arm state, PTT timeout, ATU-band flag, QRZ load status, and local-only CB log count.
- Browser locker: current view, URL hash, stored POTA context, stored logger draft, loaded QRZ counts, and local CB log storage size.
- SSB Hunter internals: a compact formatted summary of phase, gates, scores, envelope state, candidate counts, and sweep size without dumping the full sweep history.
- Readable CAT event log: throttled so incoming frames do not scroll too fast to read.

The Freeze Frame button forces a fresh snapshot. The Hold toggle freezes the displayed telemetry until released. Copy Snapshot copies the current diagnostic JSON to the clipboard. Most operator work should still happen on the band pages.

## Current CAT Commands In Use

Read commands:

- `ID;` radio identification
- `FA;` VFO-A frequency
- `MD0;` operating mode
- `RM1;` CAT receive meter percentage
- `RM5;` power meter
- `RM6;` SWR meter
- `RG0;` RF Gain
- `BY;` RX busy diagnostic
- `PS;` radio power-switch read/dummy command
- `MG;` MIC gain
- `ML0;` monitor on/off
- `ML1;` monitor level
- `PL;` speech processor level
- `PR0;` speech processor on/off
- `PR1;` parametric mic EQ on/off

Write commands:

- `FA########;` set VFO-A frequency
- `MD01;` LSB
- `MD02;` USB
- `MD05;` AM
- `RG0###;` set RF Gain
- `AC002;` start antenna tuner
- `TX1;` transmit
- `TX0;` receive
- `PS1;` radio power on
- `PS0;` radio power off
- `MG###;` set MIC gain
- `ML0000;` / `ML0001;` radio MONI off/on
- `ML1###;` set radio MONI level
- `PL###;` set speech processor level
- `PR01;` / `PR02;` speech processor off/on
- `PR11;` / `PR12;` parametric mic EQ off/on

QRZ Logbook HTTPS actions:

- `STATUS`
- `INSERT`
- `FETCH`
- `DELETE`

POTA HTTPS source:

- `https://api.pota.app/spot/activator`

## Operating Notes

- The antenna tuner runs automatically after connected band switches on 10 meters, 6 meters, and CB.
- The ATU Tune button is still available for manually rerunning the tuner on 10 meters, 6 meters, and CB.
- The app does not decide whether a transmission is legal or appropriate. The operator is responsible for band, mode, power, antenna, and license compliance.
- CB operation is not blocked in software.
- If the display looks plain or unstyled, make sure the browser is on `http://localhost:3030`, not a `file://` URL.

## Desktop Helpers

The optional `YEASU CAT` Desktop folder contains local launcher files:

- `Start YEASU CAT.command`: starts the local server in the background and opens `http://localhost:3030/`.
- `Stop YEASU CAT.command`: stops the local server.
- `README.txt`: basic notes and the site link.
- `yeasu-cat.log`: created when the start helper runs.

## Revision Log

- June 4, 2026: Added a local QSO-card workflow: Logger queue button, Logbook Queue Card/Card Sent row controls, Queued unsent/Sent card filters, and local CB card status support without syncing card status to QRZ.
- June 5, 2026: Added an SSB Hunter Cycle Dwell slider with live dwell updates and funny speed labels, then raised the broad-hunt default to 35 ms/step so it does not skip right over voice QSOs.
- June 5, 2026: Added a dedicated CB Handle field in the Logger, skipped QRZ callsign lookup for CB numbers, and hardened Logbook edit/delete buttons with row fallbacks and visible failure messages.
- June 2, 2026: Optimized SSB Hunter for long fast runs by keeping only five rolling sweeps, compacting browser sweep payloads, throttling high-rate state broadcasts, protecting slow WebSocket clients, avoiding CAT write pileups, and making Nerd Stuff show a compact Hunter summary instead of a full sweep dump.
- May 30, 2026: Added POTA spots popout, current-band filtering, QRT toggle, park links, and one-click VFO-A tune from selected POTA spots.
- May 30, 2026: Added POTA spot Log buttons that open the QRZ Contact Logger prefilled from the selected activation.
- May 31, 2026: Made the POTA popout compact, added same-UTC-day exact call+park Worked Today indicators, added a manual Respot helper, and logged POTA contacts to QRZ with `SIG=POTA` and `SIG_INFO`.
- May 31, 2026: Moved POTA into a main console tab and made POTA Log open the Logger tab prefilled without tuning the radio.
- May 30, 2026: Added QRZ Logbook API backend, contact logger popout, manual-frequency popout, Logbook tab, QRZ callsign links, edit/delete tools, and grid/lat-lon map pins.
- May 30, 2026: Added SSB Hunter local noise-floor tracking, lift-over-floor scoring, voice-shape scoring, broadband-noise rejection, and related dashboard metrics.
- May 30, 2026: Added Desktop start/stop helper scripts and README notes.
- May 30, 2026: Added SSB Hunter RX input selection notes, narrower Skip Target behavior, and the fine-step suspect hold rule.
- May 30, 2026: Added live SSB Hunter RX gate and RF Gain controls.
- May 30, 2026: Extended SSB Hunter refinement to stepped 5 Hz and 1 Hz fine tuning.
- May 30, 2026: Added SSB Hunter lock hold slider, `H` start shortcut, hard idle frequency polling, and manual VFO override stop behavior.
- June 1, 2026: Added real Yaesu radio-side MONI control on Audio Test and Nerd Stuff using `ML`, added TX Audio Lab controls for MIC gain, processor level, processor on/off, parametric EQ on/off, and added Auto MIC Peak analysis with an operator-applied MIC gain suggestion.
- May 31, 2026: Added short in-cockpit descriptions to the SSB Hunter slider controls.
- May 31, 2026: Added the SSB Hunter Envelope Focus window for zooming into suspect envelopes during mapping and refinement.
- May 30, 2026: Moved SSB Hunter into a main-console tab, added staged Hunter band selection, improved Skip Target forward resume behavior, and added logger PTT/RF Gain/clarifier controls.
- May 30, 2026: Added session-only QRZ XML login prompting for callsign lookup, with an optional session Logbook API key field.
- May 30, 2026: Refactored the Logbook tab to fetch all QRZ records once, filter locally, and draw pins over a local Natural Earth map layer.
- May 30, 2026: Fixed SSB Hunter Skip Target to resume forward from the suspect lane, separated RX lift gate updates from Auto RF, widened the Contact Logger as a popout window, added same-day duplicate QSO checks, and made logger clarifier moves update the displayed logged frequency.
- May 30, 2026: Added contact names beside linked callsigns in the Logbook table.
- May 30, 2026: Added main-page frequency, clarifier, and RF Gain controls beside the large frequency counter, and capped automatic SSB Hunter refinement at 10 Hz.
- May 30, 2026: Replaced the old CAT RX meter at the top of the meter stack with the live RX audio meter.
- May 30, 2026: Made the main-page frequency slider follow manual VFO-A dial/readback movement after slider focus.
- May 30, 2026: Removed SSB Hunter lookback/revisit behavior; dead-end suspects now resume forward without checking back.
- June 1, 2026: Changed SSB Hunter envelope mapping to rewind from each suspect with a 5 kHz per-side cap, made post-lock and Skip Target resume forward from the explored suspect area, made current-pass skip pockets clear on wrap, moved Score Trace and Sweep Lane into the cockpit dead space, made Envelope Focus show the whole band while hunting, and made suspect zoom keep the cursor centered while the frequency window moves underneath it.
- May 30, 2026: Made the top quick-tune slider toggle between CB Channel Mode and Frequency Mode only on the CB page.
- May 30, 2026: Made the contact logger clear after successful QRZ upload while preserving the bottom synced-with-QRZ confirmation.
- May 30, 2026: Added station branding, then removed the italic display pass in favor of a scanline station badge treatment.
- May 30, 2026: Moved the main station plate from the topbar to the open space beside the large VFO readout.
- May 30, 2026: Moved the QRZ Contact Logger into a main console tab and routed Log Contact, Logbook edit, POTA, and SSB Hunter logger actions into that tab.
- May 31, 2026: Made the Logger frequency follow live VFO-A until callsign blur, then lock the QSO frequency until New QSO or successful Log Contact resets it.
- May 31, 2026: Added a bottom Band Logbook panel on band pages and made CB contacts save to a local-only CB log with QRZ upload blocked in the UI and server.
- May 31, 2026: Rebuilt Nerd Stuff as a slower one-second diagnostic dashboard with CAT, radio, scanner, audio, safety, storage, SSB Hunter, and readable event-log panels.
- May 31, 2026: Made local CB log callsigns/names editable through the Logger tab while preserving local-only, no-QRZ behavior.
- May 31, 2026: Added a POTA mode dropdown and bottom-of-band active POTA strips on 10m/6m with one-click VFO-A Tune.
- June 1, 2026: Changed regular CB scan to start at 5 ms dwell after 1 ms proved too fast for the audio sample loop, keep adaptive slowdown after false stops, walk back down quickly after good stops, and resume once RX audio stays below the 25% gate for half a second.
- May 31, 2026: Added the HF Stack soft power button so radio polling, CAT, scanning, PTT, SSB Hunter, and audio capture can stand down while the browser visuals and logbook stay available.
- May 31, 2026: Tightened POTA band-context syncing so the embedded POTA page follows the currently selected band and CB cannot keep showing stale 6m spots.
- May 31, 2026: Made 10m and 6m favorites editable from the favorite cards, with browser-saved nicknames and frequencies used by preset scans.
- May 31, 2026: Made backtick PTT capture run before focused sliders/controls on the main console and SSB Hunter so a recently clicked slider cannot steal the PTT key.
- May 31, 2026: Added a separate Rig Power switch using Yaesu `PS`, added HF Stack standby reconnect-plus-ATU behavior, and added CB backtrack verification so fast scan can land on the channel that actually made the audio.
- May 30, 2026: Made the logger capture the backtick PTT key even while typing in contact fields.
- May 30, 2026: Enlarged the main station plate beside the VFO readout to better use the open space.
- May 30, 2026: Tightened the main station plate width so the callsign letters can run larger.
- May 30, 2026: Turned the whole VFO readout header into the station banner with an oversized right-side callsign.
- May 30, 2026: Kept the main callsign on one line and reduced the VFO banner height.
- May 30, 2026: Added an Audio Test tab with realtime waveform, spectrum, return-level metrics, voice/modulation scoring, and live audio diagnosis.
- May 30, 2026: Removed experimental Talkback/Mic Coach controls after settling on the radio PHONES jack plus MONI as the transmit-audio confidence monitor.
- May 30, 2026: Initial living manual created. Covers current band pages, scanning model, audio monitor defaults, tune keys, PTT, meters, and Nerd Stuff.
