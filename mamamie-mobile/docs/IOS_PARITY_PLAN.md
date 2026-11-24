# MamAmie Android: iOS feature-parity build plan

Goal: bring this Expo app up to the feature set of the iOS app in
`D:\Hackathon\MamAmie\MamAmie IOS`, **keeping the Stitch UI already built here**
(theme in `src/constants/theme.js`, components in `src/components/`). The iOS app is the
reference for *behaviour and data*; Stitch is the reference for *look*.

Read this file before starting any feature. Each phase names the iOS files to port from.

---

## 1. What the iOS repo contains

| Part | Where | Notes |
|---|---|---|
| SwiftUI iPhone app (~18k lines) | `MamAmie IOS/MamAmie/` | Models / Services / Views split. Local-first, JSON files in Application Support. |
| watchOS companion | `MamAmie IOS/MamAmieWatch/` | Kick + contraction sessions, water log, HR chart. **Out of scope for Android.** |
| FastAPI backend | `MamAmie IOS/backend/` | Deployed at `https://mamamie.onrender.com/api/v1` (Swagger at `/docs`). JWT auth, SQLite/Postgres, grounded RAG assistant, nutrition image analysis, pregnancy dating, UIP vaccines. Free Render tier: first request after idle can take ~30–60 s. |
| Rules | `MamAmie IOS/ARCHITECTURE.md`, `AGENTS.md` | Architecture rules below are ported from these. |

### iOS tabs → Android (Stitch) tabs

| iOS tab | iOS view | Android home for it |
|---|---|---|
| Onboarding (gate before tabs) | `Views/Onboarding/*` | New `onboarding` flow shown before tabs |
| Today | `HomeView.swift`, `DayCheckpointsView.swift` | **Home** |
| Health | `Views/Health/*` | **Track** (Vitals / Overview modes) |
| Calendar | `CalendarJournalView.swift` + Day*/Entry* views | **Track** (calendar strip → day view) |
| Food | `FoodScannerView.swift`, `FoodDailyDashboardView.swift`, `FoodMealEditorView.swift` | **Log (+)** → Food, and Track → "Nutrition & Water" mode |
| Guidance | `Views/AI/MaternalAIView.swift` | **Ask** (Guidance section) |
| Ask | `AssistantView.swift` | **Ask** (chat) |
| Profile | `ProfileView.swift` | Header avatar → Profile screen |
| — | (tests/reports/photos/medications in calendar) | **Vault** |
| — | (postpartum mode, no iOS screen yet) | **Circle** (already built) |

---

## 2. Ground rules (apply to every phase)

**Platform**
- The app must keep running in **Expo Go** (the user tests this way, over the phone hotspot).
  Only use modules bundled in Expo Go for SDK 58: `expo-image-picker`, `expo-camera`,
  `expo-file-system`, `expo-document-picker`, `expo-secure-store`, `expo-notifications`
  (local only), `expo-haptics`, `react-native-svg`, AsyncStorage. Install with
  `npx expo install <pkg>`, never `npm install`.
- Anything needing a dev build (Health Connect, Wear OS) goes behind a **demo-data mode** until
  the user agrees to leave Expo Go.
- Per `AGENTS.md`, move navigation to **Expo Router** (`src/app/`) in Phase 0. Keep non-route
  code outside `src/app/`.

**Architecture (from iOS `ARCHITECTURE.md`)**
- One responsibility per file. Layout:
  - `src/app/` – routes only
  - `src/features/<feature>/` – screens + feature components
  - `src/models/` – plain JS shape factories / enums
  - `src/stores/` – persisted state (one store per domain)
  - `src/services/` – AI, API, calculations, file storage
  - `src/components/` – shared UI (`ui.js`, `Header.js`, `BottomNav.js`)
- Screens never touch AsyncStorage or the file system directly — go through a store/service.
- Stable IDs (`uuid`-style strings) for every record and attachment.
- Date-only records use a **local day key `yyyy-MM-dd`**, never a UTC ISO string. Write one
  helper `toDayKey(date)` / `fromDayKey(key)` and use it everywhere.
- Index store data by `dayKey` and `id`; don't scan every entry per calendar cell.
- Keep expensive work out of render; derive with `useMemo` or in the store.

**Health data & safety**
- Everything stays on the device unless a feature is explicitly backend-backed.
- Never `console.log` medical notes, symptoms, dates, prescriptions or images.
- Never invent pregnancy dates or gestational age. If the user skipped dating, show
  "Add your dates" instead of a week number.
- Every AI answer shows a "not a diagnosis" disclaimer. Run the on-device safety screen
  (Phase 5) **before** any AI call; if it fires, show the emergency message and do not wait
  for the model.
- No prescribing, no dose calculation, no clinical thresholds beyond what iOS already shows.

**Secrets**
- `MamAmie IOS/MamAmie/Services/APIConfiguration.swift` hard-codes a base64 Gemini key.
  **Do not copy it.** Read the key from `EXPO_PUBLIC_GEMINI_API_KEY` in
  `mamamie-mobile/.env.local` (gitignored by the `.env*.local` rule; a plain `.env` is NOT ignored). Note: `EXPO_PUBLIC_*` values ship inside the app
  bundle — acceptable for a hackathon demo only. Long term, call Gemini through the backend
  (`POST /nutrition/analyze-image`, `/ai-assistant/query`), which keeps keys server-side.

**Replace hard-coded demo values** in the current UI ("Elena", "Week 24", "Dr. Chen in 4 days",
"Sweet Cantaloupe", vitals) with real store data as each phase lands. Keep the Stitch layout.

---

## 3. Phases

Build in order; each phase should leave the app working in Expo Go.

### Phase 0 — Foundations ✅ done (2026-11-23)
Implemented: Expo Router with `src/app/` (root `_layout.js` loads fonts, providers and gates
onboarding with `Stack.Protected`; `(main)/_layout.js` renders the Stitch `Header` + `<Slot />` +
`BottomNav`; routes `/`, `/track`, `/log`, `/vault`, `/ask`, `/circle`, `/profile`, `/edit-profile`,
`/onboarding`). Screens moved to `src/features/<feature>/`. `createPersistedStore` factory with the first
shared store (`hydrationStore`), `uiStore` for the amber overlay, `usePersistentState` for screen-local
state, `services/navigation.js` (`goTab`). Remaining domain stores are created in the phase that first uses them.

Original plan:
1. Migrate to Expo Router: `src/app/_layout.js` (fonts, SafeAreaProvider, onboarding gate),
   `src/app/(tabs)/_layout.js` using the existing `BottomNav` as a custom tab bar, routes
   `index` (Home), `track`, `log` (modal-style, back header), `vault`, `ask`, `circle`, plus
   `profile` and `onboarding/*` stacks. Check the SDK 58 Expo Router docs before writing it.
2. Create `src/services/dayKey.js`, `src/services/ids.js`, and a generic
   `createPersistedStore(key, initial)` (Context + reducer + AsyncStorage) to replace
   `usePersistentState` for shared data.
3. Stores: `onboardingStore`, `journalStore`, `foodStore`, `hydrationStore`, `vaultStore`,
   `healthStore`, `assistantStore`. Each exposes `reset()` for "Clear data".

### Phase 1 — Onboarding & profile ✅ done (2026-11-23) (iOS: `Models/Onboarding/OnboardingProfile.swift`, `Views/Onboarding/*`, `Services/Onboarding/*`)
- 7 screens in a Stitch-styled stepper (rounded cards, primary pill buttons):
  1. **About you** – displayName, dateOfBirth, country, preferredLanguage
  2. **Journey** – stage `planning | pregnant | postpartum`; datingMethod
     `dueDate | lastPeriod | notSet`; dueDate / lastPeriodDate / childbirthDate; trackCycle;
     clinicalCareStatus `regularOBGYN | midwifeOrFamily | lookingForCare | notReceivingCare | unspecified`
  3. **History** – isFirstPregnancy, totalPregnancies, previousBirths,
     multiplePregnancyType `single | twins | multiples | unsure`, previousComplicationsNotes
  4. **Health** – medicalConditions[], notes, allergies[], notes, medicationsAndSupplements[], clinicalInstructions
  5. **Nutrition** – dietaryPreference `vegetarian | vegan | eggetarian | nonVegetarian | otherOrNone`,
     restrictions notes, mealTrackingPreference `both | photo | manual | skip`, lifestyleTrackingPriorities[]
  6. **Connected health** – connectedDevices[], measurementsOfInterest[] (Android: "Health Connect – coming soon")
  7. **Reminders** – selectedReminders from `pregnancyUpdates | appointments | medications | dailyCheckIns | weeklySummaries`
  - Then privacy acknowledgement + summary review → save with `privacyAcknowledgedAt`, `completedAt`.
- `src/services/pregnancyDating.js` (port exactly):
  - `estimatedDueDate` = dueDate, or lastPeriodDate + 280 days, or null.
  - `gestationalWeek` = floor(days since (EDD − 280) / 7), clamped 0…42; null unless stage is pregnant and dates exist.
  - Trimester: weeks 0–13 → 1, 14–27 → 2, 28+ → 3.
  - Postpartum week = weeks since childbirthDate.
  - Baby-size comparison: use the table in `backend/app/services/pregnancy_calculator.py`
    (`WEEK_METRICS`, nearest week: 4 Poppy seed … 40 Watermelon, with length/weight/symptoms).
- Wire into UI: Home greeting name, "Week X • Day Y • Trimester", ring % (week/40),
  "N days to go", header pill "Pregnancy W{X}" / "Postpartum W{X}" / "Planning".
- Profile screen (avatar tap): summary, edit onboarding, clear all data (confirm dialog).

### Phase 2 — Calendar journal in Track — built 2026-11-24, needs device test (iOS: `Models/CalendarEntry.swift`, `EntryCategory.swift`, `EntryStatus.swift`, `MedicationModels.swift`, `Services/JournalStore*.swift`, Calendar*/Day*/Entry* views)
- Entry shape: `{ id, title, category, dayKey, timeMinutes?, notes, createdAt, modifiedAt, attachments[], medicationId?, appointment?, medicalRecord?, symptom?, food?, journal?, milestone?, task?, weight? }`
- Categories (label / icon): medication, appointment, test, symptom, food, journal, photo,
  milestone, task. Statuses: appointment `planned | scheduled | completed | rescheduled | cancelled`;
  report `planned | testCompleted | reportPending | reportReceived | followUpNeeded`.
- Medication schedules stored separately from dose logs; dose actions **Taken / Skipped / Not yet confirmed**.
- Track tab: the existing week strip becomes a real week/month calendar with category dots and the
  legend; tapping a day shows the day timeline, upcoming items, and an add-entry sheet.
- **Clinical schedule** (`Services/MaternalSchedulePlanner.swift`): port the milestone list
  (dating scan, NT scan, anatomy scan, GDM OGTT, Tdap, GBS swab, weekly visits from 36 w, …)
  and wellness routines; generate entries from the profile with deterministic IDs so re-sync
  doesn't duplicate; postpartum gets 2-week and 6-week checkups. Port missed-milestone
  detection + "revise" (move to next sensible day).
- **Daily checkpoints** (`DayCheckpointsView.swift`): water 2.5 L, 4,000 steps, prenatal vitamin,
  leg elevation, Kegels, left-side sleep, kick count (3rd trimester), custom habits. These feed
  Home's "Today's Care Routine" (replace the 3 hard-coded items).
- **Mood tracker** (Radiant, Calm, Tired, Sensitive, Anxious, Nauseous) and **weight tracker**
  (`DayMoodTrackerView.swift`, `DayWeightTrackerView.swift`) → Track "Vitals" mode weight card uses real entries.
- Implemented as: `models/journal.js`, `stores/journalStore.js` (indexes by id/day; checkpoints stored as
  habits + per-day ticks instead of iOS's 30 copied task entries), `services/clinicalSchedule.js`,
  `stores/useScheduleSync.js` (runs in the `(main)` layout), Track UI in `features/track/`.
  Deliberate iOS differences: no plan without real dates (iOS assumed week 12), past milestones are
  not auto-marked completed, and stable ids are `schedule:<milestone>` strings (the iOS hash-based
  UUID changes every launch). Photo entries wait for the Vault (Phase 6).

### Phase 3 — Log (+) quick actions — built 2026-11-24, needs device test
Turn the centre **+** into an action sheet: Water (current Quick Log screen), Food (Phase 4),
Kick session, Contraction, Symptom, Medication dose, Journal note, Weight. Each writes to the
journal/hydration stores so Home and Track update. Move kick + contraction timers out of
`features/track/TrackScreen.js` into a shared `sessionsStore`.
- Implemented as: `features/log/QuickActionsSheet.js` (opened by the + button from the `(main)` layout;
  Water opens the hydration screen at `/log`, Food/Symptom/Journal use the entry editor, plus a
  medication-dose sheet and the weight sheet), `stores/sessionsStore.js` with `useSessions()`, and
  `features/sessions/SessionCards.js` shared by Track, Home and the + sheet. Finished kick sessions
  become journal entries; each day's contractions keep one summary entry. Home's tool tiles use real data.
  The iOS phone app has no kick/contraction screens (they live on the Watch), so these flows are new.

### Phase 4 — Food scanner (iOS: `Services/MaternalFoodAIService.swift`, `Models/FoodNutritionModels.swift`, `Services/GeminiChatService.swift`, `Food*View.swift`)
- Photo via `expo-image-picker` (camera or gallery), or text description.
- `src/services/gemini.js`: `generateContent` against
  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, with the
  same **model fallback cascade** as iOS `candidateModels` (move on after 429/503), a
  `systemInstruction`, JSON-only responses, 12 s timeout, and an offline fallback.
- Nutrients per item: energyKcal, proteinG, carbohydrateG, fatG, fibreG, ironMg, folateMcg,
  calciumMg, vitaminDMcg, vitaminCMg, sodiumMg, dhaMg, cholineMg.
- Pregnancy daily targets (`PregnancyRDA`): calories 2200, protein 75 g, iron 27 mg,
  folate 600 mcg, calcium 1000 mg, vitamin D 15 mcg, fibre 28 g, DHA 250 mg, choline 450 mg,
  vitamin C 85 mg. Gap insight → strengths, missing nutrients (Moderate / High Priority, with
  "why baby needs it"), suggested foods, supplements (buying advice), safe-for-pregnancy flag.
  Keep the rule-based fallback when AI is unavailable.
- Respect `dietaryPreference` in suggestions. Every result labelled "estimate — review it".
- Save meals to `foodStore` and as `food` journal entries; "add recommendations to checkpoints".
- Bundle the three sample meals (spinach dal, salmon quinoa, yogurt berries; images in
  `MamAmie IOS/MamAmie/Assets.xcassets/sample_*`) for demoing without a camera.

### Phase 5 — Ask (iOS: `AssistantView.swift`, `Services/AssistantSafetyScreening.swift`, `Services/AssistantAPIClient.swift`, `Views/AI/MaternalAIView.swift`)
- **Safety screen first**: port `AssistantSafetyScreening.emergencyMessage` exactly (reported vs
  hypothetical phrasing, negation regex, term lists for breathing, chest pain, bleeding, seizure,
  severe abdominal pain, headache + vision, reduced fetal movement, self-harm). On match show the
  emergency card (India 112) with a call button and the SOS sheet.
- Chat: Gemini with the iOS system prompt (warm, grounded, red-flag escalation) plus a
  **context snapshot** built from profile (week, trimester, EDD, diet, conditions) and today's
  food totals. Send the last 10 turns. Markdown-ish rendering for bold and lists.
- Guidance section: suggested questions by trimester, "AI clinical insight" cards, disclaimer
  text from `MaternalAIView.swift`.
- Optional (when online + signed in): backend grounded assistant `POST /ai-assistant/query`,
  `/ai-assistant/triage`, `/ai-assistant/reports/explain` with citations. Needs auth
  (`/auth/register`, `/auth/login`, `/auth/refresh`; tokens in `expo-secure-store`).

### Phase 6 — Vault
- List of tests/reports, photos and attachments from the journal plus standalone documents.
- Add via `expo-image-picker` / `expo-document-picker`; copy into
  `FileSystem.documentDirectory + 'vault/'` and reference by attachment id (never by original URI).
- Medication list + adherence history.
- "Explain this report" → Ask (Phase 5 / backend `reports/explain`).
- Replace Home's "Scan Lab Report" tile target with this screen.

### Phase 7 — Health metrics (iOS: `Views/Health/*`, `Models/Health/*`, `Services/Health/MockHealthDataProvider.swift`)
- Metrics: heart rate (+ resting), blood oxygen, blood pressure (sys/dia), sleep, steps, HRV (SDNN),
  wrist temperature. Day / week / month charts with real date axes (react-native-svg), stat cards,
  readings list, broad non-diagnostic pregnancy reference band, medical-safety banner
  ("wearables don't monitor fetal heart rate or diagnose preeclampsia").
- Android has no HealthKit: ship **Demo mode** (port `MockHealthDataProvider`, every point tagged
  `Demo`) plus manual BP/weight entry. Health Connect only after moving to a dev build.
- Feeds Track → "Vitals" mode (replace hard-coded 118/76, 78 bpm, sleep, weight).

### Phase 8 — Circle (postpartum, loss, newborn)
- UI is already built (`features/circle/CircleScreen.js`). Connect it to profile: default to Postpartum Healing when
  stage is postpartum; day count from childbirthDate.
- Quiet Loss Support must hide pregnancy milestones, kick counters and baby-size content app-wide
  ("Trigger Shield") when enabled — add a profile flag and respect it in Home/Track.
- Newborn: profile + India UIP vaccination schedule (port `backend/app/services/vaccination_scheduler.py`).

### Phase 9 — Reminders & polish
- `expo-notifications` local reminders only for types chosen in onboarding; privacy-safe text
  (no symptoms or drug names on the lock screen).
- Vault/Ask "coming soon" placeholders removed; empty states everywhere; loading skeletons.
- Run `npx expo lint`; test each phase on the phone in Expo Go before starting the next.

---

## 4. Definition of done per phase
- Works in Expo Go on Android (hotspot setup) and in the web preview.
- Data survives an app restart; "Clear data" wipes it.
- No hard-coded personal values remain for that feature.
- Matches Stitch styling (tokens from `theme.js`, `Card`/`Pill`/`T`/`Icon` from `ui.js`).
- Commit on a feature branch (`feature/<phase-name>`), as in the iOS git workflow.
