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
| Unpaid lunch | Checkbox; deducts the break length from hours worked |
| Dives | Any number, each with in/out times, max depth and task |
| Standby / tender hours | Optional, billable |
| Travel hours | Optional, billable |
| Notes | Optional |

Per billing period: hours worked, total bottom time, dive count, days worked,
max depth, total billable hours, and a per-client hours breakdown.

`Total billable = hours worked + standby + travel`, where
`hours worked = shift length − unpaid lunch`.

The unpaid-break length is configurable (default 60 min), but the deduction
actually applied is **stamped onto each shift when it is saved**, so changing
the setting never rewrites hours on a period you have already billed.

## Dive log

The **Dives** tab lists every dive as its own record — depth, task worked on,
in/out times, duration, client and site — scoped to the current billing period
or all time, and exportable as its own CSV. Dives are entered as part of a
shift but chained into one chronological series across shifts, so the
**surface interval** between consecutive dives is shown between them.

### Nitrogen groups — not yet enabled

The repetitive-group machinery is built (surface-interval chaining, residual
nitrogen time, repetitive-dive lookup) but **the tables ship empty**, so every
group reads `—`.

This is deliberate. Repetitive-group values are decompression data, and a
plausible-looking wrong letter is more dangerous than a blank one. Nothing is
guessed, and no other table set is substituted — US Navy and PADI RDP values
are *not* interchangeable with NDBT.

To enable, fill the three tables in the `NDBT` block near the top of the
script from the official *Norske dykke- og behandlingstabeller*, and set
`loaded: true` with the `edition` string. The block documents the exact shape
each table expects:

- `noDecoGroup` — group letter by depth (msw) and bottom-time band
- `surfaceCredit` — group after a surface interval
- `residualNitrogen` — RNT in minutes, by group and depth
- `seriesResetMin` — interval after which a diver counts as clean

Lookups round to the harder case (deeper depth row, longer time band) and
return `null` rather than extrapolating past the end of a table.

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
- **Worked on** / Task — what the dive was for
- **Lunch** / Unpaid break — `yes`, `1`, `0.5`, `60` all count as taken
- **Standby**, **Travel**, **Notes**

Exact header matches win over partial ones, so a `Worked on` column binds to
the dive task rather than being swallowed by `Hours worked`.

## Getting data out

**Data → Export** shows the current period as CSV. *Copy period* / *Copy all*
put it on the clipboard, ready to paste into a spreadsheet. The **Dives** tab
has its own export button for the dive log, with surface interval and nitrogen
group columns. Inside the claude.ai viewer a *Save CSV file* button also
appears, which hands you a real `.csv`.

## Where data lives

Entries are stored in your browser's `localStorage`, on the device you enter
them on. They are not uploaded anywhere and are not shared between devices or
viewers. Clearing site data for the page will erase them, so export a period
once you've billed it.
