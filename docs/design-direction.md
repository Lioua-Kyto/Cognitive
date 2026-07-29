# Cognitive — design direction & system plan

**Phase 2 deliverable. No code.** Product truth lives in [PRODUCT.md](../PRODUCT.md).
`DESIGN.md` is deliberately *not* written here — it gets recorded at the end of
Phase 3 from the world as actually built, not from intentions.

---

## 1. The direction

### THE SECTION

A building drawn in architectural section, with the sun cutting through it.
**Seven rooms, one per cognitive domain, lit or dark depending on where you are
strong.** Training lights a room. The beam travels with the hour.

**Thesis.** This surface owns *the shape of one mind, drawn in section*. It
refuses the arrangement this category always ships: soft pastel cards, a single
circular progress ring, mascot illustration, purple-to-teal gradients, confetti
on completion. It equally refuses that pattern's predictable opposite — sterile
clinical white with thin grey type. The product is called Cognitive, which invites
glowing neurons and synapse graphs; that is the deepest rut in this category and
nothing here goes near it.

**Why this world, on the two axes that matter.**

- *Audience identification.* Architectural sections are legible to any adult
  without instruction, and they are calm. A 42-year-old who lost the thread in a
  meeting today is not looking to be gamified at; they are looking to see where
  they actually stand.
- *Product clarity.* Seven separately-measured domains is the mechanism, and a
  section is the one drawing type that shows seven distinct volumes and their
  relationship at once. **An unlit room is not a failure state — it is a room you
  have not lit yet.** That single property does more for Product Principle 4
  ("progress must never shame") than any amount of encouraging copy.

**Chosen over the assigned direction.** The roll assigned a Swiss departure board.
Rejected on named product-truth grounds, not taste: a departure board's native
vocabulary is delay and cancellation, which shames exactly this audience; and its
signature interaction (split-flap) vanishes under `prefers-reduced-motion`,
leaving the whole identity dependent on the one thing accessibility must be able
to switch off. The dealt alternates were a jet-age ticket wallet (executable, but
near-neighbour transport-information DNA) and a moon-shadow bazaar (fuses poorly —
a whimsical trade metaphor makes honest measurement feel arbitrary).

**Honest risk.** This can read as an architecture portfolio rather than a training
product if the seven-rooms mapping is not legible in the first three seconds. The
mitigation is labelling discipline, not decoration: every room carries its domain
name and its real number, always.

---

## 2. Light, dark, and the physical scene

One sentence of scene, which settles the question rather than defaulting:

> A 42-year-old sits on a sofa at 21:30 with one lamp on, phone in hand, after a
> day where they lost the thread twice.

The product is *about* light and is used *in the dark*. So **dark is the primary
mode** — and this inverts the source world's ground on purpose:

| Role | Dark (primary) | Light (daylight mode) |
|---|---|---|
| Ground — the unlit building | `#12161C` shadow blue-charcoal | `#F4F1EA` limewash |
| Section poche — cut structure | `#0A0D11` | `#23282F` deep charcoal |
| Lit room surface | `#F4F1EA` limewash | `#FFFFFF` |
| The beam — active/current | `#E8A33D` sun gold | `#C97E1C` |
| Withdrawn hours — inactive | `#3A4654` shadow blue | `#8C949E` |
| Ink — primary text | `#F4F1EA` | `#171C22` |

**Colour strategy: Committed.** The gold beam is the only accent and it means
exactly one thing everywhere — *active now*. Never decorative, never a second
accent. The seven domains are distinguished by **position in the section and
label**, not by seven hues; the existing seven-colour scheme includes pairings
that fail AA on white and gave every screen a fruit-salad problem. Domain identity
survives as a single desaturated tint used only in dense data views.

`prefers-color-scheme` is honoured, with an explicit user override persisted.

---

## 3. Typography

Faces chosen as objects from this world's register — technical drawing lettering
and tabular measurement — and deliberately not from the cluster of AI defaults
(Fraunces, Playfair, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk,
Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta,
Instrument Sans).

- **Archivo Expanded** (variable) — display and section titles. A wide grotesk
  reads as a drawing's title block; the width axis gives real scale range.
- **Archivo** (variable) — UI and body. Engineered for small sizes, which is what
  a data-dense Operate surface actually needs.
- **Chivo Mono** — figures only: scores, ranks, timestamps, sun angles. Same
  design DNA (Omnibus-Type), so the system reads as one voice. Mono is confined to
  genuinely tabular and temporal data, never used as a "technical" costume.

`font-variant-numeric: tabular-nums` is mandatory on every score, rank and timer.
Numbers that shift width while counting are the single most common tell of an
un-designed data product.

**Type scale** — 1.25 major third, 16px base, clamped fluid at the display end.
The existing token block has no type scale at all; this is the gap that most
visibly separates this from the current build.

| Token | Size | Face | Use |
|---|---|---|---|
| `display-xl` | clamp(3rem, 8vw, 6.5rem) | Archivo Expanded 600 | Home first viewport |
| `display-l` | clamp(2.25rem, 5vw, 3.75rem) | Archivo Expanded 600 | Section titles |
| `heading-l` | 1.953rem | Archivo 600 | Room / panel titles |
| `heading-m` | 1.563rem | Archivo 600 | Card titles |
| `heading-s` | 1.25rem | Archivo 600 | Sub-heads |
| `body` | 1rem | Archivo 400 | Prose, controls |
| `body-s` | 0.8rem | Archivo 400 | Secondary |
| `label` | 0.8rem / 0.08em tracked caps | Archivo Narrow 500 | Drawing annotations, axis labels |
| `figure-xl` | clamp(2.5rem, 6vw, 4rem) | Chivo Mono 400 | Session score |
| `figure` | 1.25rem | Chivo Mono 400 | Ranks, streaks, timers |

Measure caps at 68ch for prose. Line-height 1.5 body, 1.1 display, 1.4 labels.

---

## 4. Space and structure

A section drawing has **storeys**, and that is the vertical rhythm.

- Base unit 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192.
- **Storey module: 96px.** Every major band is a whole or half storey. This is what
  produces the drawn-to-scale feel that a generic 8px grid never does.
- More space above a heading than below it, everywhere, one ratio throughout.
- Content grid: 12 columns desktop, 6 tablet, 4 mobile, 24px gutters, 1440px max
  with a 1200px reading frame. The section drawing itself breaks the frame to
  full-bleed — it is the one element permitted to.
- **A z-index scale exists**: `base 0 · raised 10 · sticky 100 · overlay 1000 ·
  modal 1100 · toast 1200`. There is no z-index scale today, which is why modals
  and toasts currently fight.

---

## 5. Motion — GSAP and ScrollTrigger placement

Motion is the world's own behaviour: **light moving through a building.** It is
authored once, orchestrated, not scattered as hover effects. GSAP + ScrollTrigger
enter here; neither is currently a dependency.

### Scroll-linked (ScrollTrigger, scrubbed)

1. **Home, the signature interaction.** The section drawing is pinned for the
   first two viewports; scroll progress *is* the sun's arc. As the beam reaches
   each of the seven rooms, that room lights and its real label and number resolve.
   One scroll gesture teaches the entire product. This is the memory test answer:
   a visitor who left after one viewport would describe "the building where the
   sun lit up seven rooms."
2. **Domain detail pages.** A horizontal section cut scrubs through the user's
   history for that domain; the beam position maps to date.
3. **Progress narrative.** Storey bands reveal on a shared `y: 24px, opacity`
   timeline with 60ms stagger. Restrained — the beam is the star.

### State and micro-interaction (GSAP timelines, not scroll)

4. **Session complete.** Light floods the room, once, 900ms, easing
   `power2.out` — replacing confetti and the ten competing celebration keyframes
   in `GameResultPopup.css`.
5. **Rank change.** The lit surface warms or cools over 400ms. No number spinning.
6. **Beam ambient position.** Real solar position for the user's local time, so
   the dashboard at 21:30 genuinely looks like 21:30. Recomputed on the minute,
   `transform` only.
7. **Timer.** The room dims as time runs out — a continuous physical signal, not
   a red pulse. Replaces `timer-pulse-warning`, `timer-pulse-danger`,
   `timer-shake`.

### The performance and accessibility contract

- `transform` and `opacity` only in any scrubbed handler. Nothing that triggers
  layout. Beam and light are composited layers.
- Budget: 60fps on a mid-range Android. Pin the section, do not re-render it.
- **`prefers-reduced-motion`: the world ships its own answer — "preserve a still
  noon state."** The beam sits at noon, every room shows its true lit/unlit state,
  all seven labels and numbers are present, and nothing travels. The reduced-motion
  build is complete and beautiful, not degraded. This is the reason this direction
  beat the departure board.
- No layout shift: the section reserves its aspect box before paint.
- Today: 69 keyframes against 4 `prefers-reduced-motion` queries. Target is one
  motion system with the query honoured at the source.

---

## 6. Surfaces and modes

| Surface | Mode | What success looks like |
|---|---|---|
| Home (unauthenticated) | **Persuade** | A visitor knows what this is, why it matters, and what to do, in seconds. The scrolled section *is* the argument. |
| Dashboard | **Operate** | Where do I stand, what should I train next, am I keeping the habit. |
| Domain list / detail | **Operate** | Which exercises exist here, my best, what's locked and why. |
| Session (the exercise) | **Operate** | The interface disappears. Chrome recedes to a timer and the room's light. |
| Result | **Operate** | What I scored, what it beat, what it moved. Honest, no inflation. |
| Leaderboard | **Operate** | Where I sit, per domain. |
| Profile / analytics | **Read** | My trend across seven domains, comprehensible at a glance. |
| Social | **Operate** | Friends, presence, chat. |

**The session surface is where most redesigns of this kind fail.** It must give up
the identity almost entirely — a lit room, the exercise, a timer, nothing else.
Art direction that intrudes on a working memory task is a defect, not a signature.

---

## 7. Component inventory

Rebuilt in this world's vocabulary. A stock component inside a committed form is
a lapse, so every atom is included.

**Primitives** — Button (primary/secondary/ghost/destructive), Input, Select,
Checkbox, Radio, Switch, Slider, Label, FieldError, Link, Icon, Tag, Badge,
Avatar, Tooltip, Skeleton, Spinner, Divider (a drawn hairline, not a border).

**Composed** — RoomCard (a domain, lit state + rank + streak), SectionDrawing (the
seven-room figure, full-bleed and responsive), BeamOverlay, StatTile (figure +
label + delta), TrendChart, DomainRadar (the seven-domain shape), StreakStrip,
ExerciseCard (incl. **locked** state for the future subscription), SessionShell,
Timer, ResultPanel, AchievementTile, LeaderboardTable, RankRow, FriendRow,
PresenceDot, ChatThread, MessageBubble, NotificationToast, EmptyState, ErrorState.

**Overlays** — Dialog, Sheet (mobile), Popover, CommandMenu.

Every overlay gets `role="dialog"`, `aria-modal`, a focus trap, Escape, and focus
restore. All five current modals are hand-rolled with none of these.

---

## 8. Styling foundation — Tailwind 4, Bootstrap removed

Confirmed. The design tokens above become the `@theme` layer, which is why this
direction is buildable at all: it depends entirely on precise type and space
scales holding across 40+ components.

- Bootstrap is a CSS-only veneer today — no Bootstrap JS, `data-bs-*` count zero,
  the grid used twice. Removing it costs almost nothing and ends the namespace
  collision where custom `.card`, `.badge` and `.row` classes fight its rules.
- Retires: 145 `!important` declarations, ~3,100 lines of already-dead CSS, and the
  global keyframe collisions (`pulse` ×4, `spin` ×4, `shimmer` ×3, `fadeIn` ×3, and
  `confetti-fall` defined twice inside one file).
- The ~80 existing custom properties in `layout.css` are the migration source —
  they are already referenced 1,298 times, so they map to `@theme` rather than
  being rewritten from nothing.
- The seven category hex literals duplicated in `pages/Profile.jsx` collapse into
  the token layer.

---

## 9. Accessibility — the floor, not the aspiration

WCAG 2.2 AA is a hard requirement per PRODUCT.md. Current state and target:

| Item | Now | Target |
|---|---|---|
| `aria-*` attributes | 10 in 27k lines | Every interactive element named |
| Keyboard handlers | 2 | All 25 exercises fully operable |
| Modals with focus trap | 0 of 5 | All |
| Form labels | placeholders as labels | Real `<label for>` |
| `prefers-reduced-motion` | 4 queries / 69 keyframes | Honoured at source |
| Live regions | none | `role="status"` on toasts and results |
| Fixed 90s timer | every game, every level | **Adjustable or extendable — SC 2.2.1** |
| Contrast | category colours fail on white | All pairs AA, verified |
| Skip link | none | Present |
| `<title>` | "Vite + React" | Real, per route |

**The timer is the most important item on this list.** A fixed 90-second limit at
every level fails SC 2.2.1 and penalises exactly the users most anxious about
their performance — the people we just decided are the ones who pay.

---

## 10. What Phase 3 will do, in order

1. Tailwind 4 in, Bootstrap out; `@theme` from the tokens above; delete dead CSS.
2. Primitives, then overlays with real focus management.
3. The section drawing component and the beam system, with the still-noon state
   built *first*, not retrofitted.
4. Home (Persuade) — the pinned scrolled section.
5. Dashboard, domain list, leaderboard, profile.
6. Session shell and result — where the identity deliberately recedes.
7. Social.
8. Accessibility sweep against the table in §9, then the motion performance budget
   verified on a throttled profile.

**Deliberately deferred to Phase 4:** `pages/Profile.jsx` at ~2,000 lines and the
`GameLayout` render-prop stack are rebuilt with the game engine, not restyled here.

## 11. Open, and not to be invented

Pricing, tier boundaries, and which exercises are free. No testimonials, usage
numbers, retention data, press, or clinical results exist — the Home surface has no
social proof to draw on and must not imply otherwise. The six hotlinked
third-party portraits in `pages/Home.jsx` are placeholders and get removed.
