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

### Nitrogen groups

Each dive shows its N2 group, calculated from the *Norske dykke- og
behandlingstabeller* Standardtabell pages and the surface-interval adjustment
table, transcribed from the printed document.

**Coverage is complete**: every Standardtabell depth page from 6 m to 51 m is
loaded (6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51), 201 rows
in total.

Every blank group carries a reason, so a dash is never mistaken for "clean":
no table for this depth, deeper than the loaded tables, bottom time past the
end of the table, or missing depth and times.

Repetitive dives chain automatically. Dives across all shifts are ordered into
one series; the surface interval sets the adjusted group, that group's residual
nitrogen time for the next dive's depth is added to its bottom time, and the
result is looked up on that depth's page. The dive row shows the residual
nitrogen added and the group entered with, so the working is visible rather
than implicit.

Lookups round to the harder case — the next deeper page and the next longer
bottom-time row — and return a reason instead of extrapolating past the end of
a table.

The pages are not uniform, and are transcribed exactly as printed rather than
regularised. Bottom-time rows are not evenly spaced and some are absent — the
27 m page has no 35 min row, the 24 m page no 45 min row — so those times are
read on the next longer row. Group letters do not always advance by one: the
24 m page goes J at 40 min straight to M at 50 min and then repeats M at
55 min, and the 15 m page goes L at 90 min straight to O at 105 min.

Residual-nitrogen footer rows may also stop short: the 6 m page ends at K, so
a repetitive 6 m dive entered in group L or higher reports "no residual
nitrogen figure" rather than a group. The validator allows a short row but
rejects one with a hole in it.

Rows carry the document's own two markers separately: `*` and "below the heavy
rule". They are independent: on the 33 and 36 m pages the first row below the
rule carries no star, and on the 15 m page the 180 min row is starred while
sitting above the rule. The app reports both as printed, without assigning
them a meaning the transcribed pages do not state — the legend explaining
them has not been transcribed.

#### The validator

`validateNDBT()` runs at load and refuses to enable the tables unless every
structural invariant holds:

- one surface-interval band per group, from the entering letter down to A
- surface-interval bands ascend within each row
- bottom times ascend within each depth page
- every depth page has a complete 16-group residual-nitrogen row
- **each row's individual stop times sum to its printed total**

That last check is independent evidence of correct transcription: the "Total
dekomp. tid" column is redundant in the source, so agreement across all 201
rows is a real cross-check rather than a restatement. If any check fails the
tables switch off entirely and the app says so, rather than answering from
half-read data.

#### Adding the remaining depths

Add a page to `NDBT.standard` in the script — depth, its bottom-time rows with
stops at 15/12/9/6/3 m, the printed total, the group, the `star` and
`beyondRule` markers, and the page's own residual-nitrogen footer row — then
lower `floorDepth` to the next depth still missing. The validator will catch a
malformed page.

Still missing: the legend explaining the `*` and heavy-rule markers.

## After the last dive

The Dives tab shows the highest N2 group of the 24 hours ending with your most
recent dive, and what it means for travel:

- **Flying** — the minimum hours from the end of that dive, per *Tid før
  flyging etter dykking*. A dive that was never assigned a group requires 24 h.
- **Altitude** — the five bands from *Forflytning til moderate høyder*, each
  showing when you may travel to it.

Both count elapsed time, so a wait that has already passed reads as clear
rather than as advice to keep waiting.

The multi-level dive table (*flernivå-dykk*) is **not** implemented. It is a
planning table rather than a logging one, and the regulations printed beside it
require a dive computer with continuous depth monitoring and digital profile
recording — conditions this app cannot verify.

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
