# MamAmie design system

Source of truth: Stitch project **"MamAmie Maternal Wellness App"** (id `2422748940617137764`).
Code tokens live in `src/constants/theme.js`; shared components in `src/components/ui.js`.
Any new screen — hand-built, generated in Stitch, or drafted in Claude Design — must follow
this file so it looks like it belongs next to Home, Track, Log and Circle.

When asking Stitch / Claude Design for a new screen, paste the **Prompt preamble** (bottom of
this file) first, then describe the screen.

---

## Personality
Calm, warm, clinical-but-gentle. A "sanctuary", not a dashboard. Soft rose + sage on a cool
off-white, generous rounding, light shadows, no hard borders, no pure black. Copy is
reassuring and specific ("Take all the time you need", "Your body is doing miraculous work").

## Colour tokens (Material 3 style)
| Token | Hex | Use |
|---|---|---|
| primary | `#8b4850` | Main actions, active tab, rings, key numbers' accents |
| onPrimary | `#ffffff` | Text/icons on primary |
| primaryContainer | `#a86068` | Secondary bars, hover |
| primaryFixed | `#ffdadc` | Selected chips, soft rose fills |
| primaryFixedDim | `#ffb2b9` | Chart accents, dots |
| onPrimaryFixed | `#3a0812` | Text on primaryFixed |
| secondary (sage) | `#57633e` | Success, "healthy/optimal", progress dots |
| secondaryContainer | `#d8e5b7` | Positive pills, check backgrounds |
| onSecondaryContainer | `#5b6742` | Text on secondaryContainer |
| secondaryFixed | `#dbe8ba` | Soft sage fills |
| tertiary (mauve) | `#76525c` | Grief/loss mode, audio, emotional content |
| tertiaryFixed | `#ffd9e1` | Milestone / gentle-sanctuary pills |
| error | `#ba1a1a` | SOS icon only |
| errorContainer | `#ffdad6` | SOS pill, urgent cards |
| surface (page bg) | `#f7f9ff` | Screen background |
| surfaceContainerLowest | `#ffffff` | Cards |
| surfaceContainerLow | `#edf4ff` | Inset rows inside cards |
| surfaceContainer | `#e3efff` | Tracks, inactive buttons |
| surfaceContainerHigh | `#dceafb` | Segmented-control track, round icon buttons |
| onSurface | `#0f1d29` | Primary text |
| onSurfaceVariant | `#534344` | Secondary text |
| outline / outlineVariant | `#857374` / `#d7c1c2` | Units, faint icons |

## Typography — Plus Jakarta Sans only
| Style | Size / line | Weight | Use |
|---|---|---|---|
| display | 34 / 41 | 700 | Hero numbers (kick count) |
| headlineLg | 24 / 30 | 700 | Screen titles, big values |
| headlineMd | 20 / 25 | 600 | Sheet titles, ring % |
| headlineSm | 17 / 22 | 600 | Card titles |
| bodyLg / bodyMd / bodySm | 17 / 15 / 13 | 400 | Body copy |
| labelLg | 14 / 18 | 600 | List item titles, buttons |
| labelMd | 12 / 16 | 600 | Chips, tabs |
| labelSm | 11 / 13 | 500 | Captions, pills, eyebrows |

Eyebrows: labelSm, UPPERCASE, letter-spacing 1, primary colour (e.g. "MORNING SANCTUARY").
Quotes: headlineSm semibold italic.

## Shape & spacing
- Radius: cards 32 (`Radius.lg`) for hero cards, 16 for list cards / tiles, pills fully round.
- Page horizontal padding 20; vertical gap between sections 24 (16 on dense screens).
- Card padding 24 (hero) or 16 (list/tile). Inset rows inside cards: padding 10–16, radius 16,
  `surfaceContainerLow` background.
- Minimum touch target 44.

## Elevation
- Cards: shadow `#2d3a47`, y 8, blur 20, opacity 0.06 (`Shadow.card`), small items `Shadow.sm`.
- Primary buttons & FAB: rose glow (`Shadow.primary`, `#8b4850` @ 0.3).
- No borders on cards.

## Components (all in `src/components/`)
- **Header**: logo (mother mark on cream circle) + "MamAmie" / section name; right side
  "Pregnancy W24 ▾" pill (surfaceContainerHigh, primary text), SOS pill (errorContainer), avatar 32.
  Sub-flows use the back variant: ‹ arrow + logo + title + avatar.
- **BottomNav**: Home, Track, raised round **+ Log** FAB (56, primary), Vault, Ask, Circle.
  Active = primary + bold label.
- **Card**, **Pill** (dot or icon + label), **ProgressRing** (round caps, track surfaceContainerLow),
  **T** (typed text), **Icon** (Material Icons, community fallback).
- **Segmented control**: track surfaceContainerHigh pill, active segment white (or primary) pill with soft shadow.
- **Primary button**: full-width pill, min-height 52, primary bg, white headlineSm/labelLg, icon left, rose glow.
- **Secondary button**: pill, surfaceContainer bg, primary text.
- **Choice tile** (selection): 16-radius tile, surfaceContainerLow; selected = primaryFixed bg +
  onPrimaryFixed text + check icon.
- **Inputs**: surfaceContainerLow filled field, radius 16, no border, labelSm label above,
  bodyMd text, placeholder onSurfaceVariant @ 70%.
- **Toast**: inverseSurface pill at bottom with sage check icon.
- **Sheets/Modals**: white, top radius 32, dim overlay `rgba(15,29,41,0.4)`.

## Form & onboarding patterns (`src/components/forms.js`)
Reference design: Stitch screen **"MamAmie - Onboarding: Your Journey"** (id `c0c7381d66e348f28927f09639f0dfe4`).
- **Step header**: back arrow + logo + title; below it an uppercase rose eyebrow ("ONBOARDING STEP")
  with a `surfaceContainerHigh` pill "2 of 7", then a 6px segmented progress bar (rose = done, pale blue = to do).
- **ChoiceCard**: unselected = white card, icon in tinted circle, soft filled radio; selected = `primaryFixed`
  card, icon circle turns solid primary with a white icon, radio becomes a primary check.
- **RadioRow**: pale-blue row, soft filled dot; selected = rose fill. Optional rose tag pill ("Most accurate").
- **DateField**: filled pale-blue field with calendar icon; when set shows the date in headlineSm and a hint
  line ("Friday · 112 days remaining"). Opens a bottom-sheet month grid (Mon-first, rose selected day with glow).
- **Estimate card**: sage `secondaryContainer` card, leaf icon, "Week N · Trimester" in sage headlineSm + body.
- **Footer**: sticky; secondary "Back" pill (1/3) + primary "Continue →" pill (2/3); validation error shows as an
  `errorContainer` strip above the buttons.
- Privacy footnote: small lock icon + labelSm, centred.

## Iconography
Material Symbols (outlined) in Stitch → `MaterialIcons` names in code (`water-drop`, `spa`,
`monitor-heart`, `child-care`, …). Icon-in-circle pattern: 40–48 circle, tinted container colour, icon in matching "on" colour.

## Content rules
- Never show pregnancy week/dates the user didn't provide — show an "Add your dates" prompt.
- Medical content always carries a gentle "not a diagnosis" note.
- Loss mode (tertiary palette) hides milestones, kick counters and baby-size content.

---

## Prompt preamble for Stitch / Claude Design
> Design a mobile screen (390 wide) for **MamAmie**, a maternal wellness app. Match the existing
> MamAmie design system exactly: Plus Jakarta Sans; background #f7f9ff; white cards with 32px
> (hero) or 16px (list) radius, no borders, very soft shadow; primary rose #8b4850 with soft rose
> fills #ffdadc; sage #57633e / #d8e5b7 for positive states; mauve #76525c / #ffd9e1 for
> emotional content; pale blue insets #edf4ff and tracks #dceafb; text #0f1d29 / #534344.
> Fully rounded pill buttons and chips, primary buttons with a rose glow, uppercase rose eyebrow
> labels, Material Symbols outlined icons inside tinted circles. Header: MamAmie logo + section
> name, "Pregnancy W24" pill, red SOS pill, round avatar. Calm, warm, sanctuary tone.
