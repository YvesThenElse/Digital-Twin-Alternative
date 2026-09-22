# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

Product code landed on 21 Sept 2026. Two commands, both containerised — **neither the .NET SDK nor Node is installed on the machine**:

| Command | What it does |
|---|---|
| `./test.sh` | builds `src/DigitalTwin.slnx`, then runs **each** `src/*.Tests` project |
| `./web.sh test` | runs the Vitest suite under `web/` |
| `./dotnet.sh <args>` | any `dotnet` command, in `mcr.microsoft.com/dotnet/sdk:10.0` |
| `docker compose up -d` | PostgreSQL 17 on host port **5433** (not 5432 — a locally installed Postgres must not silently decide what the app talks to) |
| `./session.sh <nom>` | runs the app for a **user-test session** (Phase 2) and prints the URL with a fresh profile; `--mesures <profil>` prints that profile's KPIs |
| `./session.sh --reseau [<nom>]` | same, but bound to the **Tailscale address** and detached, so a phone on the tailnet can reach it; `--arret` stops it |
| `./e2e.sh` | the single end-to-end journey, on both layouts |

⚠️ **`--reseau` binds the front to the Tailscale IP, never `0.0.0.0`.** The API stays on loopback — Vite's proxy reaches it server-side, so there is no second surface to open. The LAN interface is in a closed firewall zone, but relying on that would make the app's reach depend on a setting it does not control. Vite's `allowedHosts` is opened to `.ts.net` only; `true` would disable a check that exists to stop a third-party domain resolving to this machine. **There is no authentication**: whoever reaches the address reads and writes any profile, so the tailnet is the whole boundary — and it is also what keeps the borrowed cover art inside the "bounded distribution" condition of `VERIFICATION-JURIDIQUE.md` §3.3. Tailscale Funnel would not.

⚠️ **`e2e.sh` and `session.sh` share `services.sh`** — one copy of the orchestration, so the journey starts the app *exactly* as a tester receives it. Two traps found by rehearsing the protocol, both of which had already fired: `exec` at the end of `e2e.sh` meant its EXIT trap never ran, so containers survived every **successful** run; and the readiness probe accepted any server on the port, so a two-hour-old leftover served a session that believed it had just started. The probe now refuses a busy port and checks its own container is still alive.

⚠️ **`test.sh` loops over the test projects on purpose.** `dotnet test src/DigitalTwin.slnx` runs only **one** of them and still prints `Passed!` — when `DigitalTwin.Api.Tests` was added, the domain's 382 tests silently stopped running. Never replace the loop with a solution-level `dotnet test`.

`calibration/` holds Python scripts that build and measure the dataset against Wikidata and Wikipédia. They are instruments, not architecture — they imply nothing about the stack. ⚠️ **Two of those three cannot run from a clean checkout** (audit item 37): `test_id_stability.py` needs `resolved.json` and `test_wp_parser.py` needs `wp_wikitextes.json`, neither of which is versioned; `emit_notabilite.py` only works from inside `calibration/`. `test_covers.py` deliberately reads versioned files only, so it runs anywhere.

Four of them are offline checks to run after touching the pipeline: `test_id_stability.py` (invariant 9 under three perturbations), `test_wp_parser.py` (eleven real infobox cases, on cached wikitext), and `emit_notabilite.py` (regenerates `dataset/NOTABILITE.md`, which must never be hand-edited), and `test_covers.py` (the five written cover conditions of `VERIFICATION-JURIDIQUE.md` §3.3 — manifest/file agreement, provenance present, byte count, and the 512 px cap). The manifest recorded `width: 512` for all 218 covers while the files measured 213–960 px: it was the size *requested*, not obtained, and `bytes` was exact — within one record some fields were observations and others intentions.

- `SPECIFICATION.md` (v2) — functional/product spec (cahier des charges), written in French. Sections numbered §1–§25, continuous.
- `PHASING.md` (v2) — implementation plan derived from the spec: 8 sequential phases (0–7) with explicit exit gates. It supersedes the spec wherever the two disagree (e.g. .NET version).
- `MODELE-DE-DOMAINE.md` — the consolidated domain model: entities, fields, event types, invariants, and what is deliberately *not* modelled. **It is authoritative on the model**; the spec's §4–§7 remain the prose rationale.
- `ORDONNANCEMENT-TEMPOREL.md` — **authoritative on comparing, sorting, grouping and querying `TemporalValue`s**. Interval normal form, the seven retained relations, the deterministic tie-break cascade, the no-date drawer, strict/permissive queries and three-valued dated projections. Eleven test vectors. `MODELE-DE-DOMAINE.md` §3 stays normative on the type itself.
- `BENCHMARK-CONCURRENTIEL.md` — competitive benchmark, verified 20 Sept 2026. Supersedes the spec's §2.3 claims.
- `VERIFICATION-JURIDIQUE.md` — source-by-source licence verification, 20 Sept 2026. Supersedes the spec's §19.2 route 1.
- `dataset/` — the POC dataset itself (221 works, 592 releases, 8 platforms, **CC BY-SA 4.0**: Wikidata CC0 + Wikipédia CC BY-SA). Read its `README.md` before touching it. Two of its early caveats are now closed: region coverage reached **99% of releases** after the infobox parser was fixed, and `region_status` carries **three states** — released / established non-release (22, hand-arbitrated with reasons) / unknown (33). Never collapse the last two: the English infobox omits the Japanese releases of Crash Bandicoot, Banjo-Kazooie and GTA III, which all happened. CanonicalIds are stable across regeneration **and across reordering** since the id registry was decoupled from the notability rank.

  One failure mode bit three times in one day here, so assume it will again: **missing or incomplete data reads as fact and never raises an error** — an unmapped region qualifier, randomly-minted ids, re-releases taken for original releases. All three produced normal-looking numbers. All three were caught by reading rows, never by reading aggregates.
- `BOUCLE-AUDIT.md` + `TODO-AUDIT.md` — the pre-test audit of every surface, run as a loop. Its sieve is three questions per surface, derived from the three defects that real use found and 709 tests did not: **sent without being entered** (the period screen shipped `1995` hard-coded), **returned without being read** (the selection never re-read its declarations), **written without being said** (`affect` defaulted to "sans plus", an actual user statement). An item is ticked only with its three answers, file and line cited. The result is the document that authorises — or refuses — recruiting testers.
- `PROTOCOLE-DE-TEST.md` — operational protocol for the Phase 2 user test, written 21 Sept 2026 **before any tester**. It does not restate the targets (those are engaged in spec §22.3); it says how to obtain the numbers those targets judge, and flags which ones the POC cannot measure without manual observation. Its SQL was executed against the real schema, not merely reviewed — that is how the missing `player_events.platform_id` was found.
- `COUT-DE-CURATION.md` — curation cost model, and the calibration measured on 30 real entries (`calibration/`). Headline: unattended resolution against Wikidata picks the wrong game **5 times in 15**, always a sequel of the requested title; region-qualified dates exist for **43%** of entries; cover images for **7%**. Automation produces candidates, it never closes an entry.
- `ecrans/` — screen-by-screen UX and visual specification. Start with its `README.md`; `00-principes-transverses.md` (behaviour rules) and `00-langage-visuel.md` (colour, type, shapes, density per breakpoint) override the individual `E01`…`E17` fiches. `PLAN-DU-SITE.md` holds routes, `PARCOURS-ET-LIENS.md` the navigation graph.

All documents are French. New documentation should follow suit; code identifiers stay English.

The spec and phasing were revised in v2 (duplicated sections merged, numbering made continuous, missing topics added, cross-references realigned); passages added then are flagged 🆕. `PHASING.md` §13 maps phases to spec sections.

## Product in one line

A platform that turns 30 years of a player's video-game history into a personal, browsable, measurable, shareable story. The reference catalogue of games is only the foundation — the value is the personal layer on top.

## Locked technical decisions (PHASING.md §4)

| Area | Decision |
|---|---|
| Backend | .NET 10 LTS + EF Core 10 — **locked**. The spec's "\.NET 6+" is obsolete; ignore it. |
| Frontend | React + TypeScript (Vite), TanStack Query for server state — **locked** |
| User data | PostgreSQL 17+ |
| Reference dataset (POC) | SQLite or precompiled JSON — deliberately unoptimized |
| Local dev | Docker Compose (Postgres only) |
| MemoryPack | **Not locked.** The spec cites it (§17.1); the format decision is deferred to Phase 7 and made by benchmark. |
| Microservices | No. Mono-app until proven otherwise. |

## Domain model — the concepts that matter

Five modelling decisions carry the whole product. Get these right before writing anything else.

**0. Two time axes, and events are memories.** Player events carry both `OccurredAt` (a `TemporalValue`, uncertain, when it happened in the player's life) and `RecordedAt` (exact system timestamp). They record *claims*, not observed facts, so they are revisable by their author — correction is a first-class feature, and `Confidence` applies to user events too. Consistency violations produce soft warnings, never blocks.

**1. Event sourcing over state.** The player's history is a stream of `PlayerEvent`s (`DiscoveredGame`, `StartedGame`, `CompletedGame`, `AcquiredGame`, `SoldGame`, `ReplayedGame`…), each carrying a temporal value. Current state (owned, completed, favourite) is a **projection** of that stream, never the primary storage. This is what makes the timeline, historical statistics, "collection as of a given date", period comparison and taste evolution possible at all.

**2. `TemporalValue` — uncertainty is data.** Memory is imprecise and the model must preserve that rather than fabricate precision. A single explicit type covers: `ExactDate`, `Month`, `Year`, `Range` (1993–1997), `ApproximateYear` (1994±2), `Age` ("around when I was 12"), `Unknown`. Every event dates via this type — no bare `DateTime` on player history.

Declaring the variants is easy; **ordering them is the hard part** and it is what the timeline does constantly (spec §7.5). This is now settled in `ORDONNANCEMENT-TEMPOREL.md` — read it before touching anything that sorts, groups or queries dates. Two rules from it are easy to violate: **normalisation adds, it never replaces** (`Year(1994)` and `Range(1994,1994)` share an interval and render differently, so the variant must survive), and **the representative point is a sort key only** — never displayed, exported, or counted. `Age` is unresolvable without a birth year; store it raw, never pre-converted.

**3. Work / GameVersion / Release / Edition.** A title is not one row. Final Fantasy VII → PlayStation PAL → Platinum → PS3 digital → PS5 remake is one *work* with several releases and editions, potentially owned several times over decades. Phase 0 refines the spec's Game/Release/Edition triple into a four-level chain.

**3b. Event-sourced domain ≠ event-sourcing infrastructure.** Default position (spec §5.5): an append-only `PlayerEvent` table in PostgreSQL with projections computed on read, materialised only when measurement justifies it. No dedicated event store, no CQRS framework. And GDPR erasure is incompatible with a naive immutable log — the storage design must pick per-user physical purge or crypto-shredding **up front** (§19.4).

**4. Ownership ≠ experience.** `UserGameExperience` (played it) and `UserOwnedItem` (owned a specific copy/edition) are separate. You can play what you never owned and own what you never played. Never collapse them.

Collectively these form the **Player Digital Twin** — the internal technical term. "Gaming Identity", "Player Story", "Gaming DNA" are marketing vocabulary only; keep them out of code.

## Data separation (SPECIFICATION.md §15)

Two distinct data universes, and they do not share a storage strategy:

- **REFERENCE DATA** — games, consoles, studios, manufacturers, genres, accessories. Large, read-only, rarely changed, identical for every user. Eventually versioned and binary-packed (Phase 7).
- **USER DATA** — events, experiences, owned items, profile. Transactional, personal, continuously mutated. PostgreSQL.

## Prerequisites that are easy to miss

These are small but load-bearing; the headline feature does not work without them (all Phase 1):

- **`Notability` score** per release — "show the platform's main games" needs an ordering (§3.3).
- **Region** (PAL / NTSC-U / NTSC-J) on `Release` — a PAL player shown the NTSC-J library does not recognise themselves (§3.4).
- **`UnresolvedGameClaim`** — with a 100–300 game dataset, missing titles are constant; free-text entries must be recordable and canonicalisable later (§3.5).
- **A note attached to an event** — a ticked list looks like everyone else's; the anecdote is what makes a profile feel personal, which is exactly the Phase 2 gate (§9).
- **Playtime is not available** for retro history. It is optional and typed by origin; never aggregate imported, declared and estimated hours into one number (§11.3).
- **Cover art is a UX dependency, not a legal footnote** (§19.2). Bulk selection works by *recognition*; a list of text rows is measurably slower to scan than one with thumbnails. The Phase 0 decision must produce a visual for every entry — licensed image where available, generated tile (era palette + title typography) everywhere else, same 3:4 frame so the grid never looks patchy. **The open-source route for cover art does not exist**: Wikimedia Commons refuses fair use and hosts no game covers; Wikipedia's are US fair use, attached to encyclopedic use and non-transferable. The project being R&D (open question 1, settled 20 Sept 2026), covers are taken from the web for the demo under five written conditions — low resolution, `Source` kept per image, takedown on request, bounded distribution, no redistribution — and four review triggers (`VERIFICATION-JURIDIQUE.md` §3.3). It is a bounded risk trade-off, not a permission: **a borrowed cover is revocable, so nothing may stop working when one disappears**, and generated tiles stay the permanent base. The desktop grid is unblocked for the POC on that basis.

## UI rules that are easy to get wrong

Three come from measured constraints, not taste — see `ecrans/`:

- **One tap = "joué".** Three toggles plus an exclusion per row costs ~200px of targets, leaving ~143px of title on a 375px screen — it truncates the very thing the user is scanning for. Mobile declares in one pass (whole row is the target) and refines in an optional second pass; desktop shows the three toggles on hover, where they are free.
- **The UI shows three temporal choices, not seven.** A year (default), "plutôt une période", "je ne sais plus"; month/exact date/±/age live behind a "préciser" disclosure. `Confidence` is **derived** from the chosen granularity, never asked.
- **Mobile and desktop are different layouts, not one stretched.** Dense single-column list vs. visual grid or two panes. Model, screen sequence and primary gesture stay identical.

## What the benchmark changed

`BENCHMARK-CONCURRENTIEL.md` (10 products, verified 20 Sept 2026) contradicts the spec's §2.3 in a way worth knowing before quoting it: of the five claimed differentiators, **only temporal uncertainty is genuinely vacant**. Edition granularity is occupied by better products (VGCollect, GameEye), retroactive logging by Backloggd, single-year narrative recap by Steam Replay. The bet holds on the *join*, not on any item.

The widest real gap — **bulk selection by platform and period** — was not in that list at all. Two consequences: `TemporalValue` protects nothing on its own (it is a few weeks' work for anyone who already has a journal and an audience), and the market's cheap answer to "I don't remember when" is Letterboxd's — *log it with no date at all*. That is what the Phase 2 gate must beat, and the question to ask a tester is "would you rather have just ticked 'played', with no date?"

## The one product risk that shapes everything

**Why would anyone spend two hours encoding 20–30 years of gaming?** (§24) The spec names this as its own biggest gap. The answer is the **bulk-selection flow**: pick a console → pick an approximate period → the app shows that platform's main games → the user rapidly ticks played / completed / owned. Treat this as a headline feature, not a convenience. Any design that increases entry friction is wrong regardless of how correct its data model is.

The project's real validation milestone (PHASING.md §11): *a user reconstructs several years of their history in under 15–20 minutes and finds the result personal enough to return to or share.*

## Phase discipline

`PHASING.md` gates each phase; do not build ahead of the current one. Specifically, these are **out of scope until their phase**:

- Social features, public profiles, profile comparison → Phase 5 (only after individual use is validated). No forum at all.
- Recommendations, "20 years ago today", taste evolution → Phase 6 (needs critical mass of data).
- Binary datasets, MemoryPack/FlatBuffers, MemoryMappedFile, distributed cache, CDN, automatic deduplication → Phase 7, triggered by measured load, never by anticipation.
- Automatic entity resolution → Phase 7. Phase 3 gets manual aliases + a `Confidence` field only.

Imports (Steam, RetroAchievements, Playnite, LaunchBox, CSV — Phase 4) rank **above** social, because they attack the friction problem directly. But note the documented limit: **imports yield the "what", rarely the "when"** — Steam's public API exposes no acquisition date, and nothing covers the pre-2010 era that is the product's actual differentiator. Achievement unlock timestamps serve as a dated proxy (low confidence, month/year granularity), followed by an assisted temporal pass. Verify each API's current capabilities before relying on them.

The POC dataset is intentionally 100–300 games across NES, SNES, Game Boy/GBA, N64, PS1, PS2 and Switch, manually curated. Do not scale it up "while we're at it".

Phase 2 is a hard gate: if testers say "this profile doesn't look like me", the response is to iterate on Phase 1 (simplify entry and presentation), **not** to advance to Phase 3.

## Provenance, always

Every reference or imported datum keeps its origin: `Source`, `ExternalId` / `ExternalGameId`, `ExternalUserId`, `CanonicalId`, `Alias`, `Locale`, `Confidence`, `ImportedAt`, `DatasetVersion`. Canonicalisation is the named top technical risk (spec §23.1: Pokémon Red = Pokémon Rouge = ポケットモンスター 赤; PC = Windows = Steam). Design identifiers so aliases and confidence can be attached from the start, even while resolution stays manual.

## Legal and compliance (spec §19)

Not a checkbox section for this product. Two points shape architecture and sourcing:

- **EU database sui generis right** (dir. 96/9/CE) protects a third party's *investment* in a database even when the individual facts are not copyrightable. "It's only metadata" is not a defence. Prefer sources whose licence explicitly allows reuse and redistribution; treat each source's licence as a required field, and check terms of use before importing. Cover art, logos and screenshots are separately protected — the referential must work without them.
- **GDPR vs the append-only log** — the product *is* a multi-decade personal archive. Erasure cannot be a tombstone; pick per-user physical purge (partition events by user) or crypto-shredding at design time.

## Open questions (spec §25)

Do not invent answers to these; they need the user's decision. Chief among them: the nature of the project (R&D, personal, commercial), **team size** (the 26–45 week estimate assumes 1–2 FTE and is otherwise meaningless), business model against a recurring curation cost, target market and i18n, platform scope (consoles only, or PC/arcade/mobile), and whether to ship with cover art.
