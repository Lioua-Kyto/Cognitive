"""Settings for the test suite.

Runs against in-memory SQLite with local-memory cache and channel layers, so the
suite needs neither Postgres nor Redis. The defaults below are set before the
real settings module is imported so a checkout with no .env can still run tests.
"""

import os

os.environ.setdefault('DJANGO_SECRET_KEY', 'test-only-key-not-used-outside-pytest')
os.environ.setdefault('POSTGRES_PASSWORD', 'unused-under-sqlite')
os.environ.setdefault('DJANGO_DEBUG', 'False')

from .settings import *  # noqa: F401,F403,E402

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}
}

CHANNEL_LAYERS = {
    'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
}

# Throttling would make repeated requests in a test flaky.
REST_FRAMEWORK = {**REST_FRAMEWORK}  # noqa: F405
REST_FRAMEWORK.pop('DEFAULT_THROTTLE_CLASSES', None)

PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# DEBUG is off here, which would otherwise turn every test request into a 301
# to https://testserver.
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
