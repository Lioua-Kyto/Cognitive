# Cognitive

Cognitive training across seven domains — memory, attention, speed, logic,
language, multi-domain and competitive — with per-domain measurement, an XP and
achievement system, and a live social layer.

Django 5.2 · DRF · Channels · PostgreSQL · Redis · React 19 · Vite 8 · Tailwind 4

---

## Quick start

Requires Docker. Everything else runs in containers.

```bash
cp .env.example .env                  # compose-level Postgres credentials
cp backend/.env.example backend/.env  # Django settings; set DJANGO_SECRET_KEY
cp frontend/.env.example frontend/.env
docker compose up -d
```

Generate a secret key for `backend/.env`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

The backend migrates, collects static and seeds the catalogue on first start.
Then run the frontend on the host so Vite's HMR stays fast:

```bash
npm --prefix frontend install && npm --prefix frontend run dev
```

- App — http://localhost:5173
- API — http://localhost:8000
- Health — http://localhost:8000/api/health/ reports database and cache reachability

## Layout

```
backend/          Django project
  backend/        settings, ASGI, health
  games/          Game catalogue, submissions, multiplayer
    registry.py   URL slug -> Game.name; adding a game is a data change
    services/     scoring
  users/          CustomUser, achievements, badges
    services/     award rules
  leaderboard/    GameResult (every play) and BestScore (the rollup)
  social/         friends, presence, chat, WebSocket consumer
  tests/          pytest, in-memory SQLite — no Postgres or Redis needed
frontend/src/
  api/            HTTP clients; config.js is the single source of the API origin
  queries/        TanStack Query hooks and the query-key factory
  ui/             design-system primitives
  styles/         theme.css (tokens) and legacy.css (the layer being retired)
  components/     surfaces, including the 25 exercises
docs/             architecture map and design direction
```

## Development

```bash
# Backend — inside the container, or a local venv with backend/requirements-dev.txt
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend python manage.py makemigrations --check --dry-run --settings=backend.settings_test

# Frontend
npm --prefix frontend run test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Optional but recommended:

```bash
pip install pre-commit && pre-commit install
```

CI runs all of the above on every push, plus a production image build.

## How it fits together

**Games are data, not code.** One `GameSubmitView` serves all 35 exercises;
`games/registry.py` maps the URL slug to a `Game` row. Adding an exercise is a
registry entry plus a seeded row, not a new view, serializer and URL.

**The client never sets XP.** `games/services/scoring.py` recomputes it from base
reward, level, score, streaks and mistakes. Scores are still client-supplied and
therefore forgeable — server-side verification is planned with the new game
engine, and no leaderboard copy should claim integrity until it lands.

**`Game.name` is the join key.** It is unique and is how a submission finds its
game, so `registry.py`, `populate_games.py` and the seeded rows must agree exactly.

**One API origin.** `frontend/src/api/config.js` reads `VITE_API_URL`. Nothing
else should contain a backend hostname.

**Redis is required.** Database 1 backs the Channels layer and database 2 the
cache. The in-memory channel layer is per-process, so HTTP-to-WebSocket pushes
silently reach nobody under more than one worker.

## Seeding

Both commands are idempotent upserts and safe to re-run:

```bash
docker compose exec backend python manage.py populate_games
docker compose exec backend python manage.py populate_achievements_badges
```

## Documentation

- [CLAUDE.md](CLAUDE.md) — start here when picking the project up: which skills
  to load, the verification method, the traps that have already cost time, and
  the exact remaining work
- [docs/architecture.md](docs/architecture.md) — system, submission path and ER
  diagrams, plus the conventions that are not obvious from any single file
- [docs/design-direction.md](docs/design-direction.md) — the design system and the
  in-progress redesign
- [PRODUCT.md](PRODUCT.md) — users, positioning and durable constraints

## Status

The backend refactor is complete; the frontend redesign is in progress. Known
work in flight, with detail in `docs/design-direction.md`:

- Legacy stylesheets are being retired surface by surface out of `@layer legacy`
- 25 exercises still use the old render-prop stack, replaced by the game engine
- Multi-domain and competitive have no exercises yet
- Competitive multiplayer has models and endpoints but no WebSocket consumer
- Accessibility work is tracked as a now/target table in the design document; the
  fixed 90-second timer fails WCAG SC 2.2.1 and is the priority item
