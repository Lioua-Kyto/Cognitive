# Working on Cognitive

Read this first. It carries what is not obvious from the code and what has
already cost time to learn.

Product truth is in [PRODUCT.md](PRODUCT.md). The system map is in
[docs/architecture.md](docs/architecture.md). The design system and the redesign
plan are in [docs/design-direction.md](docs/design-direction.md). Commit messages
are written to explain *why*, so `git log` is a real source.

---

## Skills to load

| When | Skill |
|---|---|
| Any UI work — designing, rebuilding a surface, reviewing | `impeccable` (`/impeccable`), plus `taste-skill` for the anti-slop pre-flight |
| Choosing type, colour, spacing, motion presets | `ui-ux-pro-max` |
| Animation and interaction craft | `emil-design-eng`, `review-animations`, `improve-animations` |
| Accessibility or UX audit | `web-design-guidelines` |
| Understanding the codebase structure | `graphify` (`/graphify .`) |
| Tailwind 4 specifics | `tailwind-4-docs` |

`impeccable` expects `PRODUCT.md` to exist before design work — it does, so skip
its init flow and go straight to the scoped command.

---

## The verification method that actually works

**Computed styles on `document.body` lie.** Content sits inside `.main-content`,
which the legacy CSS paints. Checking body once produced a "verified" claim while
every heading was light-on-light and invisible. Twice.

Run this in the browser console against a real page. It walks rendered text and
compares each element to its *effective* background:

```js
function rgb(s){const m=s.match(/\d+(\.\d+)?/g);return m?m.slice(0,3).map(Number):null;}
function lum([r,g,b]){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
function ratio(a,b){const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
function bgOf(el){let n=el;while(n&&n!==document.documentElement){const bg=getComputedStyle(n).backgroundColor;const c=rgb(bg);if(c&&!/rgba\(0, 0, 0, 0\)/.test(bg)){const a=bg.match(/rgba?\([^)]*,\s*([\d.]+)\)/);if(!a||parseFloat(a[1])>0)return c;}n=n.parentElement;}return [255,255,255];}
const bad=[];
document.querySelectorAll('h1,h2,h3,p,a,span,li,dt,dd,button').forEach(el=>{
  const t=el.textContent.trim(); if(!t||el.children.length>2) return;
  const cs=getComputedStyle(el); if(cs.display==='none') return;
  const fg=rgb(cs.color); if(!fg) return;
  const r=ratio(fg,bgOf(el)); if(r<4.5) bad.push({t:t.slice(0,30),ratio:+r.toFixed(2)});
});
console.table(bad);
```

Alongside it, assert structure: heading order with no skipped levels, zero
remaining legacy class names, `aria-current` on the nav, inputs with real
`labels`, and a clean console.

**Verify against a production build on 4173** (`npm --prefix frontend run
preview`), not the dev server. Port 5173 has been occupied by an unrelated
project mid-session; check `document.title` before trusting any result from it.

---

## Traps

Most of these are now guarded rather than remembered. Read this section for the
*why*; trust the guard to catch the *what*.

### Guarded — a test or a command fails if these come back

- **The legacy shell fought scroll.** `layout.css` sets `overflow:hidden` and a
  fixed `100vh` on `html`, `body`, `#root` and `.app-container`, scrolling an
  inner div instead. Nothing scroll-driven can work in that: ScrollTrigger's
  default scroller never moves and `100vh` stops meaning the viewport.
  `theme.css` overrides it. → `src/styles/theme.test.js`
- **The shell paints its own background.** `.main-content` sets the old cream, so
  theming `body` alone leaves every redesigned surface as light text on a light
  ground. → `src/styles/theme.test.js`
- **Unlayered CSS beats `@layer` CSS**, whatever the import order. Why Bootstrap
  had to go before any token could take effect, and why the legacy sheets are
  wrapped in `layer(legacy)` declared *before* Tailwind's layers. The element
  defaults in `theme.css` are deliberately outside any layer. →
  `src/styles/theme.test.js`
- **`scrub` needs a tween.** A ScrollTrigger with no animation that drives React
  state through `onUpdate` must not set `scrub`, or progress stays pinned at 0.
  → `src/ui/useScrollBeam.test.jsx`
- **`docker compose restart` does not re-read `env_file`** — it reuses the
  container's baked config, so `.env` edits appear to do nothing. → use
  `make up`, which always recreates. `make restart` is an alias for it, so
  reaching for the wrong verb still does the right thing.

Two of these disappear entirely when Phase 3 finishes: once `layout.css` and the
rest of `legacy.css` are deleted, there is no shell to override and no unlayered
CSS to lose to. `theme.test.js` asserts `layout.css` still contains
`overflow:hidden`, so it will tell you when that day comes and the overrides can
go too.

### Not guardable — judgement, not mechanism

- **In an agent browser pane, `requestAnimationFrame` can fire 0 times** because
  the pane is not compositing. GSAP's ticker is rAF-driven, so scroll animation
  cannot be verified there *at all* — static checks will pass while nothing
  moves. Ask the user to run `window.__beamDebug()` (dev only) and report
  `progress` at the top, middle and bottom of the page.
- **`prefers-reduced-motion` is not an off switch for scroll-linked reveals.** It
  targets motion the user did not initiate. A scroll reveal is direct
  manipulation: you move, it moves; you stop, it stops. Drop the pin, keep the
  reveal. This one is a design call each time, not a rule a test can hold.

---

## Conventions

- **Games are data, not code.** `games/registry.py` maps 35 URL slugs to
  `Game.name`; one `GameSubmitView` serves all of them. Adding a game is a
  registry entry plus a seeded row.
- **`Game.name` is the join key** — unique, and how a submission finds its game.
  `registry.py`, `populate_games.py` and the seeded rows must agree exactly.
- **The client never sets XP.** `games/services/scoring.py` recomputes it.
- **One API origin.** `frontend/src/api/config.js` reads `VITE_API_URL`. Nothing
  else may contain a backend hostname.
- **Redis is required.** db 1 backs Channels, db 2 the cache.
- **No fabricated claims, ever.** This codebase was generated end to end and was
  full of them: three "Join millions", six hotlinked photos of real named
  scientists presented as endorsers, and seven pseudo-neuroscience rationale
  lines. All removed. There are no usage numbers, testimonials or efficacy
  results — do not write copy that implies otherwise. Say what an exercise
  *trains*, never what it *cures*.

---

## Where the redesign stands

Direction is **THE SECTION** — a building drawn in section, seven rooms, one per
domain, lit by where the user is strong. Full rationale in
`docs/design-direction.md`.

**Done:** Tailwind 4 token layer, Bootstrap removed, the `@layer legacy` fix, the
scroll shell fix, `SectionDrawing` + beam, and these surfaces — Home,
Leaderboard, GameList, GameCategories, Navbar, Footer, Auth, and all of group 1
(Social, the social sidebar, the profile modal, both notifications, the
achievement tooltip).

**Left — 12 stylesheets in `src/styles/legacy.css`:**

1. **Profile, Dashboard, ProfileVisit, PlayStreak (4)** — start here.
   `Profile.jsx` is ~2,000 lines with a 1,250-line JSX return. Decompose before
   restyling; the Social page rebuild is the worked example (five components out
   of one 1,112-line file).
2. **Session shell and result (7)** — `GameLayout`, `GameHeader`,
   `GameIntroPanel`, `GamePauseModal`, `GameResultPopup`, `GameHelpModal`,
   `games.css`. **Defer to phase 4.** They are welded to the render-prop stack
   the game engine replaces; rebuilding now means doing it twice.
3. **`layout.css` — last.** Everything still leans on it.

**Primitives: 7 of ~30.** Built: `Button`, `Field` (+`Input`), `Dialog`, `Sheet`,
`Tabs`, `Avatar`, and `useModalSurface` — the focus-trap/Escape/scroll-lock
contract Dialog and Sheet share, so a new modal surface never re-rolls it.
`Dialog.test.jsx` and `Tabs.test.jsx` pin those contracts. Missing: Select,
Checkbox, Radio, Switch, Slider, Tooltip, Skeleton, Popover, Toast, and the
composed set (StatTile, TrendChart, DomainRadar, StreakStrip, SessionShell,
Timer, ResultPanel).

**The social surfaces are unverified in a browser.** `/social`, the navbar's
social sheet and the profile modal are all behind auth, and there is no
signed-out route that renders them, so the contrast walk has never run against
them. They are covered by render tests instead. If you have a signed-in session,
run the walk on `/social` with a chat open and a friend list populated — that is
the one outstanding check on group 1.

**Not started:** the accessibility sweep against `docs/design-direction.md` §9,
and the motion budget on a throttled profile.

### The per-surface loop

1. Rebuild the component on tokens; delete legacy class names.
2. Remove its `@import` from `src/styles/legacy.css` and delete the file.
3. `npm run build`, then verify on 4173 with the contrast walk plus structural
   assertions.
4. Commit with a message that says what was wrong, not just what changed.

---

## Open items independent of the redesign

- **The fixed 90-second timer fails WCAG SC 2.2.1.** Top priority in the
  accessibility table; it penalises the audience PRODUCT.md identifies as paying.
- **Scores are client-supplied and forgeable.** Server-side verification is a
  phase 4 item. No leaderboard copy may claim integrity until it lands.
- `GameLayout` calls `useEffect` inside a render-prop callback (2 eslint errors).
  Dies with the phase 4 rewrite.
- ~193 eslint findings, nearly all in files the redesign replaces. CI reports
  frontend lint but does not gate on it.
- 2 ruff `DJ001` findings — `null=True` on CharField; fixing needs a data
  migration.
- `GameResult.duration_seconds` is migrated but never written; accuracy is
  computed in game components and discarded.
- Seed `badge_type` values are not in `Badge.BADGE_TYPES`.

## Phase 4, not started

Game SDK (`useGameSession`/`useGameTimer`, declarative registry) replacing the
`GameWindow → GameLayout → GameProgressManager` stack; then 14 exercises, 2 per
category across all seven, rebuilt on it. Competitive additionally needs a
multiplayer WebSocket consumer — none exists, match state is polled over HTTP.
