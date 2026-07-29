# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — "the slipping professional," 30–55.** Notices their focus and recall
are not what they were: loses the thread in meetings, rereads paragraphs, forgets
names. Not clinical, not elderly. Opens the app deliberately, a few times a week,
often in the evening, and wants evidence that practice is working. This is the
segment that pays.

**Secondary — casual brain-game players.** Arrive for entertainment; cognitive
benefit is the justification, not the motive. Play in short bursts, respond to
streaks, leaderboards and unlocks. Commercially they are the top of the funnel:
high volume, low conversion, and the population the free tier exists to serve.

**Chosen from a delegated decision.** The user described "a mix of casual players
and adults fearing decline" and asked for the audience with the best revenue
potential given a future subscription. The primary above is narrower than either:
old enough to feel a real deficit and pay to address it, young enough that the
product is self-improvement rather than health management. Designing for an
elderly-decline audience would raise the accessibility floor and reframe the
product as medical — a different, more regulated business.

## Product Purpose

Short, repeatable cognitive exercises across seven domains, with enough measured
feedback that a user can tell whether they are improving. Success is a user
returning three or more times a week for a month and being able to point at their
own trend line.

## Positioning

**A training tool with game mechanics** (the user's explicit choice). Real
exercise structure and honest measurement, with XP, levels, streaks, achievements
and badges as the habit layer. Not a clinical instrument, not a casual game.

The defensible mechanism is **breadth plus per-domain measurement**: seven
distinct cognitive domains, each with its own progression and rank, sharing one
XP economy and one social graph. Single-mechanic competitors cannot show a user
where they are strong and where they are not.

## Operating Context

Sessions are short — a 90-second timer per exercise today. Desktop and mobile web,
often one-handed on mobile. Sound is part of the experience (11 effects) but must
never be required. The social layer (friends, presence, chat) runs over a live
WebSocket alongside play.

Future commercial shape, stated by the user and not yet built: a subscription
gating some games in each category. The design must therefore make a locked
exercise legible and desirable without making the free tier feel broken.

## Capabilities and Constraints

- **Seven categories**, fixed in the DB schema, seed data and URL structure:
  memory, attention, speed, logic, language, multi (Multi-Domain), competitive.
- **35 games seeded**; 25 built (5 each across memory/attention/speed/logic/
  language). Multi-Domain and Competitive have **zero** working games.
- **Progression**: XP → level (capped at 100), per-game best score/level/streak/
  fewest-mistakes, per-category rank, global rank.
- **Awards**: 28 achievements and 15 badges seeded; users may already hold them.
- **Social**: friendships, online presence, global and direct chat, notifications.
- **Competitive multiplayer** has backend models and endpoints but no WebSocket
  consumer and no client. Match state is polled over HTTP.
- **Undecided, not to be invented**: pricing, tier boundaries, which games are
  free, launch date, platform apps.
- **Scores are client-supplied and currently forgeable.** Server-side
  verification is planned. Any leaderboard framing must not overclaim integrity
  until that lands.
- `duration_seconds` and per-session accuracy are not persisted today, so
  "time spent" and accuracy trends cannot be shown honestly yet.

## Brand Commitments

Name: **Cognitive**. No logo, wordmark, colour system, typeface, tone-of-voice
guide, or reference sites have been committed. No binding visual constraint was
supplied.

## Evidence on Hand

- Real product surface: 25 working exercises, seeded catalogue, live achievement
  and ranking systems.
- **No** user testimonials, usage numbers, retention data, press, clinical
  results, or partner logos exist. Future work must not fabricate any of these.
  Marketing copy has no social proof to draw on and must not imply it does.
- `frontend/src/components/Categories/CategoryData.jsx` carries per-category
  rationale text describing what each domain trains. This is a real asset.
- Six hotlinked third-party portraits in `pages/Home.jsx` are placeholders, at
  least one an obviously fabricated URL. They are not evidence and must be removed.

## Product Principles

1. **Measure honestly or say nothing.** Show only what is actually recorded.
   Never imply that training transfers to real-world intelligence — the category
   rationale explains what an exercise *trains*, never what it *cures*.
2. **The session is the product.** Time from intent to first interaction is the
   metric that matters most; everything decorative yields to it.
3. **Breadth is the argument.** Surface all seven domains and the user's shape
   across them, rather than flattening to one score.
4. **Progress belongs to the user.** Streaks, levels and ranks motivate; they must
   never shame. Missing a day is not a failure state.
5. **The paywall sells capability, not access.** A locked exercise shows what it
   trains and why it is worth it. The free tier is a real product, not a demo.

## Accessibility & Inclusion

**WCAG 2.2 AA is a hard floor**, not an aspiration. The primary audience is
self-conscious about cognitive performance; an interface that is hard to operate
reads as personal failure. Concretely required:

- Every exercise fully keyboard-operable. All 25 are click-only today.
- Real labels on all inputs; auth forms currently use placeholders as labels.
- Focus management in dialogs — five hand-rolled modals have no `role="dialog"`,
  focus trap, or Escape handler.
- `prefers-reduced-motion` honoured throughout. 69 keyframes exist against 4
  media queries today.
- Timing is adjustable or extendable. A fixed 90-second timer at every level
  fails SC 2.2.1 and disproportionately penalises exactly the users most anxious
  about performance.
- Never colour alone to convey state; the seven category colours include pairings
  that fail AA on white.
