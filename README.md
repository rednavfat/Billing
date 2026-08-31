# Bottom Time

A phone-first time and dive log for commercial diving, built around a billing
cycle that runs from the **16th to the 15th of the following month**.

Entry is a guided descent: one question per screen, with a depth-gauge rail
showing how far through you are. The log view opens on the current billing
period's totals.

`index.html` is the whole app — one self-contained file, no build step and no
server.

## Installing it on a phone

Served over HTTPS the app installs as a standalone web app: its own icon, no
browser chrome, and it opens and runs with no signal.

1. Serve this directory over HTTPS. GitHub Pages works: repository
   **Settings → Pages**, source **Deploy from a branch**, pick the branch and
   the `/ (root)` folder.
2. Open the resulting URL on the phone.
   - **iPhone:** Safari → Share → *Add to Home Screen*.
   - **Android:** Chrome → menu → *Install app* / *Add to Home screen*.

`sw.js` precaches the app shell and caches the web fonts on first online
visit, so later opens work offline. The page itself is fetched network-first,
so a new deploy is picked up on the next open rather than being pinned to a
stale cache. Bump `VERSION` in `sw.js` when the shell file list changes.

`index.html` declares its own `<meta charset="utf-8">`, so en dashes and middle
dots survive being served by anything, including opening the file directly.

**Data does not move between installs.** Entries live in `localStorage`, which
is per origin. Opening the app from a different URL — or on iOS, from the home
screen rather than a Safari tab — is a separate store that starts empty. Export
from the old one (Data → Copy all) and paste into the new one via the importer
before switching.

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
| Övertid / overtime | A **subset** of the shift, not extra time on top |
| Traktamente | None / half / full; a daily allowance, never an hour |
| Notes | Optional |

## Billing categories

**Working hours and bottom time are separate categories and are never added
together.** A diver on an 11 hour shift who spends 2.5 hours underwater worked
11 hours, of which 2.5 were wet. That is 11 and 2.5 — never 13.5.

Overtime is likewise a subset:

```
total working hours = regular hours + övertid
```

so an 8 + 3 shift is 11 hours, not 14. On the money side, regular bills at the
working rate and övertid at the overtime rate, which together cover the shift
exactly once. Bottom time is charged on top as its own category because it is
*paid* differently, not because it is *extra time*.

There is deliberately **no combined hours total anywhere** in the app, the CSV
or the summary. The only total is monetary, reached by applying a distinct rate
per category.

The period summary keeps five blocks apart: Arbetstid, Dyktid, Other time,
Traktamente, and — when any rate is set — a Financial summary. With no rates
configured the app shows hours and no amounts at all.

### What is stamped

Two values are stamped onto a shift when it is saved, so later configuration
changes cannot rewrite an invoiced period:

- the **unpaid break** actually deducted
- the **traktamente amount** actually claimed

`null` means not yet stamped; a stamped `0` is a real value and survives — that
distinction matters when an allowance is claimed with no rate configured.

Traktamente is counted **per date**, not per shift, so two shifts on one day
cannot produce two allowances. The larger wins and the clash is reported rather
than silently dropped.

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

The tables are transcribed exactly as printed and are treated as correct as
they read. Bottom-time rows are spaced as the tables space them rather than at
a fixed interval, and group letters advance as the tables advance them — the
27 m page has no 35 min row, the 24 m page runs J at 40 min to M at 50 min and
repeats M at 55 min, the 15 m page runs L at 90 min to O at 105 min. A bottom
time between printed rows is read on the next longer row, and a depth between
pages on the next deeper page, which is the direction these conservatively
based tables already lean.

Residual-nitrogen footer rows may also stop short: the 6 m page ends at K, so a
repetitive 6 m dive entered in group L or higher reports "no residual nitrogen
figure" rather than a group. The validator allows a short row but rejects one
with a hole in it.

Rows carry the document's own two markers separately: `*` and "below the heavy
rule". They are independent markers: on the 33 and 36 m pages the first row
below the rule carries no star, and on the 15 m page the 180 min row is
starred while sitting above the rule. The app reports both exactly as printed
and assigns them no meaning, since the legend defining them is not among the
transcribed pages.

#### The validator

`validateNDBT()` runs at load and refuses to enable the tables unless every
structural invariant holds:

- one surface-interval band per group, from the entering letter down to A
- surface-interval bands ascend within each row
- bottom times ascend within each depth page
- every residual-nitrogen row starts at A, ascends, and has no holes (it may
  stop short, as the 6 m page does at K)
- **each row's individual stop times sum to its printed total**

That last check is independent evidence of correct transcription: the "Total
dekomp. tid" column is redundant in the source, so agreement across all 201
rows is a real cross-check rather than a restatement. If any check fails the
tables switch off entirely and the app says so, rather than answering from
half-read data.

#### Editing a page

A page in `NDBT.standard` carries its depth, its bottom-time rows with stops at
15/12/9/6/3 m, the printed total, the group, the `star` and `beyondRule`
markers, and the page's own residual-nitrogen footer row. `floorDepth` is the
depth at or below which no page is transcribed; it is 0, since every page is.
The validator will catch a malformed page.

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

## Storage and schema

State lives in `bottomtime.state.v2`, one versioned document holding shifts,
people, customers, closed periods and settings.

The v1 keys (`bottomtime.entries.v1`, `bottomtime.settings.v1`) are **read once
and then left in place** — never rewritten, never deleted — so rolling back is
loading the old key again.

### Migrating from v1

On first open with v1 data the app stops and explains what it is about to do,
shows what it found, and offers a backup before doing anything. Nothing is
written until you confirm.

The migration gives every dive an id, derives customer records from the
free-text client strings (matching case-insensitively, so `Peab` and `PEAB`
stay one company), converts the string hour fields to numbers, and seeds the
overtime and per-diem fields. Nothing is dropped: the original client string is
kept alongside the id, blank depths stay blank rather than becoming `0`, and the
CSV import fallback fields are carried through untouched.

`verifyMigration()` then compares shift count, dive count, total bottom time,
total worked time and the set of shift dates either side of the copy, and
checks every dive came out with an id. Any mismatch aborts, leaves v1
authoritative and says so. Once `schemaVersion` is recorded the migration never
runs again.

Backups written before v2 (`dataSchema: 1`) still restore — they are migrated
on the way in by the same code, and the restore panel says the format is older.

## Dive detail

Every dive is its own record with its own id, opened by tapping it in the Dives
tab. The page reads as a logbook entry: dive number (chronological across the
whole log), date, in and out times, bottom time, depth, client, project, site
and work performed.

**Dyklag · team** — four roles per dive: Dykare, Reservdykare, Dykledare,
Dykskötare. Nobody is tied to a role; the same person can be diver on one dive
and tender on the next.

**Kvävegrupp · nitrogen** shows the chain the app already computes rather than
recalculating anything: surface interval, entering group, residual nitrogen
added, the adjusted bottom time as arithmetic (`30 + 30 = 60 min`), the
resulting group, and which table page and row it was read from.

**Duplicate** copies what repeats — task, notes, and the whole team — and
deliberately clears what must not be assumed: times and depth. Nitrogen is
never copied; it is recomputed from the new times.

## People and customers

Reusable directories under **Data → People and customers**. A person is typed
once: assigning an unknown name from the picker adds them to your people list
in the same tap. The picker shows recents for that role first, then everyone,
with search.

Customers are created as you log shifts, matched case-insensitively so one
company does not fragment across spellings.

Both list how often each record is used. Deleting one says what it costs first:
deleting a person clears their roles on the dives that referenced them but keeps
the dives; deleting a customer keeps the client name as text on the shifts.

## Backup and restore

**Data → Backup** writes a complete JSON copy of every shift, every dive and your settings.
Save it as a file, or copy it. The card shows when this device last backed up and turns
amber after 30 days.

Backups are serialised with sorted keys, so two backups of unchanged data are byte-identical
and can be diffed. The envelope carries metadata that legitimately changes between exports —
the timestamp, the counts, the date range — while the `data` object is what round-trips exactly.
When the device last backed up is deliberately kept **outside** `settings`, in its own key, so
a backup never records the previous backup and break determinism.

**Restore** takes a file or pasted text. It parses and describes the backup — shifts, dives,
date range, when it was written — and shows what you currently have, before you confirm.
Nothing is replaced until then, and every rejection says exactly what is wrong rather than
failing silently.

Restoring and erasing both write a one-step snapshot first, so **Undo** in the Danger zone puts
back what was there. The snapshot is not a substitute for a file backup: it survives only until
the next destructive action.

## Where data lives

Entries are stored in your browser's `localStorage`, on the device you enter
them on. They are not uploaded anywhere and are not shared between devices or
viewers. Clearing site data for the page will erase them, so export a period
once you've billed it.
