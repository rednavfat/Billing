# Bottom Time

A phone-first time and dive log for commercial diving, built around a billing
cycle that runs from the **16th to the 15th of the following month**.

Entry is a guided descent: one question per screen, with a depth-gauge rail
showing how far through you are. The log view opens on the current billing
period's totals.

`index.html` is the whole app — one self-contained file, no build step and no
server. Open it directly in a browser, or publish it and add it to your phone's
home screen.

## What it tracks

Per shift:

| Field | Notes |
| --- | --- |
| Date | Shifts running past midnight belong to the day they started |
| Client / job | Period totals are grouped by this |
| Vessel / site | Optional |
| On shift → off shift | Hours worked; midnight crossings handled |
| Dives | Any number, each with in/out times and max depth |
| Standby / tender hours | Optional, billable |
| Travel hours | Optional, billable |
| Notes | Optional |

Per billing period: hours worked, total bottom time, dive count, days worked,
max depth, total billable hours, and a per-client hours breakdown.

`Total billable = hours worked + standby + travel`.

## Billing periods

The cycle start day is configurable under **Data → Settings** (1–28, default 16).
A period runs from that day to the day before it in the following month, so the
default gives 16 Aug → 15 Sep. Year rollovers and short months are handled;
`‹` and `›` on the period header move between periods.

## Getting existing data in

**Data → Import from your sheet** accepts rows pasted straight from Google
Sheets or Excel. Include the header row — columns are matched by name, so extra
columns are ignored and order doesn't matter. Recognised headers include:

- **Date** (required) — `2026-08-21`, `21/08/2026`, or `21-8-26`
- **Client** / Job / Customer / Project
- **Vessel** / Site / Location / Rig
- **Start** / On shift / Time in, and **End** / Off shift / Time out — `08:00` or `0800`
- **Hours worked** — used when start/end times are absent
- **Dive in** / **Dive out**, or **Bottom time** in minutes
- **Dives** (count), **Max depth**
- **Standby**, **Travel**, **Notes**

## Getting data out

**Data → Export** shows the current period as CSV. *Copy period* / *Copy all*
put it on the clipboard, ready to paste into a spreadsheet. Inside the claude.ai
viewer a *Save CSV file* button also appears, which hands you a real `.csv`.

## Where data lives

Entries are stored in your browser's `localStorage`, on the device you enter
them on. They are not uploaded anywhere and are not shared between devices or
viewers. Clearing site data for the page will erase them, so export a period
once you've billed it.
