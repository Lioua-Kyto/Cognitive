# Django + Channels ASGI app. Served by daphne, not a WSGI server: the social
# features run over WebSockets and a WSGI worker cannot carry them.
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# libpq for psycopg2, curl for the compose healthcheck.
RUN apt-get update \
 && apt-get install --no-install-recommends -y libpq5 curl \
 && rm -rf /var/lib/apt/lists/*

# Dependencies first so a source edit does not invalidate the install layer.
COPY requirements.txt requirements-dev.txt ./

FROM base AS dev
RUN pip install -r requirements-dev.txt
COPY . .
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]

FROM base AS prod
RUN pip install -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh \
 && adduser --system --group --no-create-home app \
 && mkdir -p /app/staticfiles /app/media \
 && chown -R app:app /app
USER app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
