#!/bin/sh
# Compose gates this container on healthy postgres and redis, so there is no
# wait-for loop here. Migrations run on start because the schema is the app's,
# not the image's.
set -e

python manage.py migrate --noinput

if [ "${DJANGO_COLLECTSTATIC:-1}" = "1" ]; then
  python manage.py collectstatic --noinput --clear
fi

if [ "${DJANGO_SEED:-0}" = "1" ]; then
  # Both are idempotent upserts.
  python manage.py populate_games
  python manage.py populate_achievements_badges
fi

exec "$@"
