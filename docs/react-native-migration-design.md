# React Native Migration — Design

**Date:** 2026-06-25
**Status:** Approved design, ready for implementation plan
**Goal:** Replace the SwiftUI client with a cross-platform React Native app so a non-Mac teammate can contribute, without changing the backend.

---

## Why

The current client (`green-ish-client/`, SwiftUI, ~920 LOC) is Apple-only — it can't be built or run without a Mac. Moving to React Native (Expo) lets a Windows/Linux teammate build, run, and ship the app (including iOS, via EAS cloud builds), and gives Android for free.

The architecture already favors this: the backend is a stateless HTTP/JSON service, so **only the client changes**. The agent loop, Gemini vision, and tools in `server/` are untouched.

---

## Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Expo + dev build** | EAS Build compiles iOS in the cloud → friend ships iOS with no Mac. WatermelonDB needs native modules, so Expo Go won't work; a custom dev build is required. |
| Local DB | **WatermelonDB** (on SQLite) | Reactive models close to SwiftData's `@Model`; lazy-loading + built-in sync engine make it scale-ready. No hosting — runs on-device. |
| ORM | WatermelonDB's own query API | It *is* the ORM. Do **not** add Drizzle — two ORMs over one SQLite file conflict. |
| Navigation | **Expo Router** (file-based) | Web-like mental model (file = screen); friend-friendly; Expo's default. |
| Styling | **NativeWind** + strict token config | Tailwind classes resolving against one `tailwind.config.js` theme ported from `Theme.swift` / `docs/design-tokens.md`. Single source of design truth. |
| Package manager | **yarn** | Per team preference. |
| Existing Swift app | **Reference, then retire** | Keep `green-ish-client/` as the look/behavior reference until RN reaches parity, then delete. |
| Build strategy | **Vertical slice first** | Prove DB + UI + EAS pipeline + friend's machine on day one before building all screens. |
| Backend | **Unchanged** | Same HTTP/JSON contract as `APIClient.swift`. |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         UNCHANGED  (server/)                         │
│                                                                      │
│   FastAPI + Google ADK  ──  plantcare agent  ──  Gemini vision       │
│   stateless: in-memory sessions, no DB                               │
│        ▲                                                             │
│        │  HTTP / JSON  (same contract as APIClient.swift today)      │
│        │   • POST forage/identify        (multipart image)           │
│        │   • POST apps/plantcare/.../sessions/{id}   (seed state)     │
│        │   • POST run                     (agent turn → Event[])      │
└────────┼─────────────────────────────────────────────────────────────┘
         │
┌────────┼─────────────────  NEW  (mobile/ — Expo RN)  ────────────────┐
│        │                                                             │
│   ┌────┴───────────┐     reads/writes      ┌──────────────────────┐  │
│   │  lib/api.ts    │◄───────────────────── │  UI  (Expo Router)   │  │
│   │  fetch wrapper │                       │  app/(tabs)/garden   │  │
│   │  (ports        │                       │  app/(tabs)/diagnose │  │
│   │  APIClient)    │                       │  app/plant/[id]      │  │
│   └────────────────┘                       │  NativeWind styling  │  │
│                                            └──────────┬───────────┘  │
│                                                       │ observe()    │
│                                            ┌──────────▼───────────┐  │
│   on-device, no hosting  ───────────────►  │  WatermelonDB        │  │
│                                            │  Plant, Observation  │  │
│                                            │  → SQLite (reactive) │  │
│                                            │  sync adapter: LATER │  │
│                                            └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

       build pipeline:  EAS Build (cloud) → iOS + Android
       → friend builds iOS from Windows/Linux, no Mac needed
```

### Boundaries (each independently understandable/testable)

- **`lib/api.ts`** — owns all HTTP. The same two calls `APIClient.swift` makes today. Knows nothing about the DB or UI.
- **WatermelonDB layer (`db/`)** — owns persistence. `Plant`/`Observation` models + query helpers. Knows nothing about HTTP.
- **UI (`app/`, Expo Router + NativeWind)** — owns rendering. Subscribes to DB via `observe()`, calls `api.ts` for agent turns. Knows nothing about SQLite internals.

The DB and HTTP layers never touch each other; the UI is the only coordinator (e.g. "agent returned a diagnosis → write an Observation") — same separation the Swift app has today.

---

## Project layout

```
mobile/
  app/                       # Expo Router — file = screen
    (tabs)/
      _layout.tsx            # citron-pill tab bar (ports ContentView)
      garden.tsx             # Garden Home (ports GardenHomeView)
      diagnose.tsx           # camera + agent chat (ports DiagnoseView)
    plant/[id].tsx           # Plant Detail + GrowthVine (ports PlantDetailView)
    _layout.tsx              # root: DB provider, font loading
  db/
    schema.ts                # appSchema (version 1)
    models/Plant.ts          # @model, computed score helpers
    models/Observation.ts
    index.ts                 # database + adapter init
    seed.ts                  # ports SampleData.swift
  lib/
    api.ts                   # ports APIClient.swift (identify + chat)
  theme/
    DESIGN.md                # written design-rules doc
  tailwind.config.js         # design tokens ported from Theme.swift / design-tokens.md
  assets/fonts/              # Fraunces.ttf, Mulish.ttf (reused from Swift app)
  package.json               # yarn
```

---

## Data model

The two SwiftData `@Model` classes map almost 1:1 onto WatermelonDB models.

| SwiftData | WatermelonDB |
|---|---|
| `Plant @Model` | `class Plant extends Model` + `@field`/`@children` |
| `PlantObservation @Model` | `class Observation extends Model` + `@field` |
| `observations: [PlantObservation]` (cascade) | `@children('observations')` + `onDelete: 'cascade'` in schema |
| `currentScore: Int?` (computed) | `@lazy` reactive query — latest non-null `health_score` |
| `needsAttention: Bool` | computed getter on model |
| `historyForBackend()` | method on model producing the `{date, note, severity?, health_score?}` shape |
| `scoreFromSeverity(_:)` | plain TS function (3-bucket fallback: high→45, medium→70, else→90) |
| `@Attribute(.externalStorage) heroPhoto/photo: Data?` | `string` **file URI** — image stored via `expo-file-system`, path kept in SQLite |
| `careSteps: [String]?` | JSON-string column, parsed in a model getter (no native array column) |

### Schema (version 1)

- `plants`: name, species, date_added, last_watered?, latitude?, longitude?, hero_photo?(uri)
- `observations`: plant_id(indexed), date, note, severity?, health_score?, care_steps?(json), photo?(uri)

### Notes / deltas from SwiftData

- **Photos:** SwiftData's `.externalStorage` transparently off-rowed `Data` blobs. In RN this is explicit — store the image as a file, keep only the URI string in SQLite.
- **Arrays:** `careSteps` is stored as a JSON string and parsed in the model getter.

---

## Data flow — Diagnose (the one coordination path)

```
1. User snaps photo (expo-camera) → JPEG
2. diagnose.tsx → api.chat(userId, message, jpeg, plant.historyForBackend())
3. api.ts: POST sessions/{id} (seed state) → POST run → walk Event[]
   → returns { reply, diagnosis? }   (ports APIClient.chat functionCall-walking)
4. If diagnosis: db.write(() => plant.addObservation({severity, healthScore, careSteps, photoUri}))
5. WatermelonDB emits change → garden.tsx + plant/[id] re-render automatically
```

Steps 2–3 are a direct port of `APIClient.chat`. Step 4 is the only new glue, and it lives in the UI layer — exactly where Swift does it today.

The `forage/identify` call ports the same way (multipart upload → `ForageResult`).

---

## Design tokens (NativeWind)

Ported from `docs/design-tokens.md` (Cozy Botanical). `tailwind.config.js` is the single source of truth; both developers style only via these tokens (see `theme/DESIGN.md`).

**Colors:** paper `#EEF1E9`, surface `#F7F8F3`, forest `#20322A`, secondary `#7A7F76`, citron `#C7D64F`, sage `#BFD0A8`, mintBg `#E4EAD8`, leafText `#5C7E4A`, rust `#C8553D`, blushBg `#F2DDD4`, stoneBg `#ECEEE8`, border `#DCE2D2`, onDarkSecondary `#C3CDBE`.

**Type:** Fraunces (display/serif, 700) for headings/plant names/scores; Mulish (body sans, 400/500/600) for body/labels/chips/nav. Scale: screen title 26/700, card name 17/700, body 13–15/400, chip 12/600, uppercase label 11/600 (~0.5 tracking).

**Design rule (`theme/DESIGN.md`):** never hardcode a hex or font name in a component — reference Tailwind token classes only (`bg-paper`, `text-forest`, `font-display`). New colors get added to the config, not inlined.

---

## Vertical slice scope

### Slice 1 — proof-of-stack (build this first)

1. Expo + dev build scaffolded (yarn); NativeWind + Fraunces/Mulish wired; `tailwind.config.js` tokens ported.
2. WatermelonDB: `Plant` + `Observation` models, schema v1, `seed.ts` (ports `SampleData.swift`).
3. **Garden Home only** — reads real WatermelonDB data; Needs Attention / Thriving sections, score badges, weather card; reactive via `observe()`.
4. `lib/api.ts` ported (both calls); a health-check or `identify` call wired enough to prove the device reaches the backend.
5. **EAS dev build on an iOS *and* an Android device — including the friend's machine producing the iOS build with no Mac.**

**Not in slice 1:** Plant Detail / GrowthVine, full Diagnose chat, camera capture. Those are slices 2–3 once the stack is proven.

**Why this order:** the biggest risk is "can the non-Mac teammate actually build/run iOS?" Slice 1 surfaces that on day one.

### Slices 2–3 (later)

- Slice 2: Plant Detail + the `GrowthVine` horizontal timeline (riskiest custom layout), Diagnose chat flow.
- Slice 3: camera capture, photo storage via `expo-file-system`, parity polish, retire `green-ish-client/`.

---

## Testing (minimal, one runnable check per non-trivial piece)

- **`db/models/*` score logic** (`currentScore`, `needsAttention`, `scoreFromSeverity`) — Jest test with an in-memory adapter. Real branching → gets a test.
- **`lib/api.ts` Event[]-walking** (the `functionCall` → `Diagnosis` extraction) — Jest test with a captured sample `Event[]` response.
- **UI screens** — no test framework in slice 1; verified by screenshot against the Swift app / Pencil mockups (same method that verified Garden Home in Swift).

No e2e framework, no per-component suites unless we hit a real need.

---

## Build pipeline

- `eas build --profile development --platform ios|android` → cloud build → install on device.
- Backend stays local during dev (`http://<mac-lan-ip>:8000`), same `baseURL` story as the Swift app's comment. Slice 1 confirms device→backend reachability.
- No CI/CD, app-store config, or OTA updates yet — added when parity is reached.

---

## Out of scope (explicit)

- **WatermelonDB sync engine + server-side DB.** The schema and model layer are sync-ready (Watermelon's design), but the `/sync` endpoint and a backend datastore are a separate spec, built only when multi-device sync is actually wanted.
- Unrelated backend refactors. (The known `assess_decline` health-vs-severity coherence issue is tracked separately, not part of this migration.)
