# Wraps the commands whose correct form is not the obvious one.
.PHONY: up down restart logs shell test lint verify seed demo

# Always recreates. `docker compose restart` reuses the container's baked config
# and does NOT re-read backend/.env, which has silently swallowed config changes
# more than once. Recreating is cheap; guessing which command you need is not.
up:
	docker compose up -d --force-recreate

down:
	docker compose down

# Alias, so reaching for "restart" out of habit still does the right thing.
restart: up

logs:
	docker compose logs -f backend

shell:
	docker compose exec backend python manage.py shell

seed:
	docker compose exec backend python manage.py populate_games
	docker compose exec backend python manage.py populate_achievements_badges

# Demo account with friends, chat history and months of results. Social, Profile
# and Dashboard render nothing without it. Prints the sign-in details and a
# ready-made token. Refuses to run unless DEBUG is on. Add ARGS="--reset" to
# rebuild the data from scratch.
demo: seed
	docker compose exec backend python manage.py seed_demo $(ARGS)

test:
	docker compose exec backend pytest
	npm --prefix frontend run test

lint:
	docker compose exec backend ruff check .
	npm --prefix frontend run lint

# The full gate CI runs.
verify:
	docker compose exec backend ruff check .
	docker compose exec backend pytest
	docker compose exec backend python manage.py makemigrations --check --dry-run --settings=backend.settings_test
	npm --prefix frontend run test
	npm --prefix frontend run build
