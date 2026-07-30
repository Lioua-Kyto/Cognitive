"""Liveness/readiness probe for the compose healthcheck and any deploy target."""

import logging

from django.core.cache import cache
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthView(APIView):
    """Reports whether Postgres and Redis are actually reachable.

    Unauthenticated on purpose: an orchestrator has no credentials. It exposes
    only up/down per dependency, never versions, settings or error detail.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        checks = {}

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            checks['database'] = 'ok'
        except Exception:
            logger.exception('Health check: database unreachable')
            checks['database'] = 'unavailable'

        try:
            cache.set('healthcheck', 1, timeout=5)
            checks['cache'] = 'ok' if cache.get('healthcheck') == 1 else 'unavailable'
        except Exception:
            logger.exception('Health check: cache unreachable')
            checks['cache'] = 'unavailable'

        healthy = all(value == 'ok' for value in checks.values())
        return Response(
            {'status': 'ok' if healthy else 'degraded', 'checks': checks},
            status=200 if healthy else 503,
        )
