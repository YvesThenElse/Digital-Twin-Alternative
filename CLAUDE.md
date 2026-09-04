# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository currently contains **no code** — only two design documents. There is no build, no test suite, no package manifest, and it is not a git repository. Do not invent build/test commands; when the first code lands, replace this section with the real ones.

- `SPECIFICATION.md` — functional/product spec (cahier des charges), written in French.
- `PHASING.md` — implementation plan derived from the spec: 8 sequential phases (0–7) with explicit exit gates. It supersedes the spec wherever the two disagree (e.g. .NET version).

Both documents are French. New documentation should follow suit; code identifiers stay English.

⚠️ `SPECIFICATION.md` contains **duplicated sections** (§2 and §4 each appear twice, and there are two different §16s). These are copy-paste artifacts, not conflicting requirements. `PHASING.md` §13 maps phases to the intended spec sections and is the reliable index.

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
| MemoryPack | **Not locked.** The spec cites it (§15.1); the format decision is deferred to Phase 7 and made by benchmark. |
| Microservices | No. Mono-app until proven otherwise. |

## Domain model — the concepts that matter

Four modelling decisions carry the whole product. Get these right before writing anything else.

**1. Event sourcing over state.** The player's history is a stream of `PlayerEvent`s (`DiscoveredGame`, `StartedGame`, `CompletedGame`, `AcquiredGame`, `SoldGame`, `ReplayedGame`…), each carrying a temporal value. Current state (owned, completed, favourite) is a **projection** of that stream, never the primary storage. This is what makes the timeline, historical statistics, "collection as of a given date", period comparison and taste evolution possible at all.

**2. `TemporalValue` — uncertainty is data.** Memory is imprecise and the model must preserve that rather than fabricate precision. A single explicit type covers: `ExactDate`, `Month`, `Year`, `Range` (1993–1997), `ApproximateYear` (1994±2), `Age` ("around when I was 12"), `Unknown`. Every event dates via this type — no bare `DateTime` on player history.

**3. Work / GameVersion / Release / Edition.** A title is not one row. Final Fantasy VII → PlayStation PAL → Platinum → PS3 digital → PS5 remake is one *work* with several releases and editions, potentially owned several times over decades. Phase 0 refines the spec's Game/Release/Edition triple into a four-level chain.

**4. Ownership ≠ experience.** `UserGameExperience` (played it) and `UserOwnedItem` (owned a specific copy/edition) are separate. You can play what you never owned and own what you never played. Never collapse them.

Collectively these form the **Player Digital Twin** — the internal technical term. "Gaming Identity", "Player Story", "Gaming DNA" are marketing vocabulary only; keep them out of code.

## Data separation (SPECIFICATION.md §12)

Two distinct data universes, and they do not share a storage strategy:

- **REFERENCE DATA** — games, consoles, studios, manufacturers, genres, accessories. Large, read-only, rarely changed, identical for every user. Eventually versioned and binary-packed (Phase 7).
- **USER DATA** — events, experiences, owned items, profile. Transactional, personal, continuously mutated. PostgreSQL.

## The one product risk that shapes everything

**Why would anyone spend two hours encoding 20–30 years of gaming?** (§19) The spec names this as its own biggest gap. The answer is the **bulk-selection flow**: pick a console → pick an approximate period → the app shows that platform's main games → the user rapidly ticks played / completed / owned. Treat this as a headline feature, not a convenience. Any design that increases entry friction is wrong regardless of how correct its data model is.

The project's real validation milestone (PHASING.md §11): *a user reconstructs several years of their history in under 15–20 minutes and finds the result personal enough to return to or share.*

## Phase discipline

`PHASING.md` gates each phase; do not build ahead of the current one. Specifically, these are **out of scope until their phase**:

- Social features, public profiles, profile comparison → Phase 5 (only after individual use is validated). No forum at all.
- Recommendations, "20 years ago today", taste evolution → Phase 6 (needs critical mass of data).
- Binary datasets, MemoryPack/FlatBuffers, MemoryMappedFile, distributed cache, CDN, automatic deduplication → Phase 7, triggered by measured load, never by anticipation.
- Automatic entity resolution → Phase 7. Phase 3 gets manual aliases + a `Confidence` field only.

Imports (Steam, RetroAchievements, Playnite, LaunchBox, CSV — Phase 4) rank **above** social, because they attack the friction problem directly.

The POC dataset is intentionally 100–300 games across NES, SNES, Game Boy/GBA, N64, PS1, PS2 and Switch, manually curated. Do not scale it up "while we're at it".

Phase 2 is a hard gate: if testers say "this profile doesn't look like me", the response is to iterate on Phase 1 (simplify entry and presentation), **not** to advance to Phase 3.

## Provenance, always

Every reference or imported datum keeps its origin: `Source`, `ExternalId` / `ExternalGameId`, `ExternalUserId`, `CanonicalId`, `Alias`, `Locale`, `Confidence`, `ImportedAt`, `DatasetVersion`. Canonicalisation is the named top technical risk (§18.1: Pokémon Red = Pokémon Rouge = ポケットモンスター 赤; PC = Windows = Steam). Design identifiers so aliases and confidence can be attached from the start, even while resolution stays manual.
