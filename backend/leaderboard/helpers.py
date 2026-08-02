from users.models import CustomUser

DEFAULT_LEADERBOARD_LIMIT = 100
MAX_LEADERBOARD_LIMIT = 500

# Deliberately no email. Leaderboards are browsable without an account, and the
# address is not needed to render a row — username is the display name.
_USER_FIELDS = ('id', 'username', 'profile_picture', 'country', 'experience')


def leaderboard_limit(request):
    """Bounded row count. Leaderboard endpoints used to return every row ever."""
    try:
        requested = int(request.query_params.get('limit', DEFAULT_LEADERBOARD_LIMIT))
    except (TypeError, ValueError):
        return DEFAULT_LEADERBOARD_LIMIT
    return max(1, min(requested, MAX_LEADERBOARD_LIMIT))


def _user_payload(user, request=None):
    profile_picture_url = None
    if user.profile_picture:
        profile_picture_url = user.profile_picture.url
        if request:
            profile_picture_url = request.build_absolute_uri(profile_picture_url)

    country_flag_url = None
    country_name = None
    if user.country:
        country_flag_url = f"/static/flags/{user.country.code.lower()}.svg"
        if request:
            country_flag_url = request.build_absolute_uri(country_flag_url)
        country_name = user.country.name

    return {
        'id': user.id,
        'username': user.username,
        'profile_picture': profile_picture_url,
        'country': user.country.code if user.country else None,
        'country_flag': country_flag_url,
        'country_name': country_name,
        'level': user.level,
        'experience': user.experience,
    }


def _missing_payload(user_id):
    return {
        'id': user_id,
        'username': None,
        'profile_picture': None,
        'country': None,
        'country_flag': None,
        'country_name': None,
        'level': None,
        'experience': None,
    }


def get_users_leaderboard_info(user_ids, request=None):
    """Bulk-resolve user display info: one query for the whole page of rows.

    The per-row get_user_leaderboard_info() this replaces was called inside
    unbounded loops, so a leaderboard cost one query per user plus a level
    computation each.
    """
    user_ids = list(user_ids)
    users = CustomUser.objects.filter(id__in=user_ids).only(*_USER_FIELDS)
    by_id = {user.id: _user_payload(user, request) for user in users}
    return {uid: by_id.get(uid) or _missing_payload(uid) for uid in user_ids}


def get_user_leaderboard_info(user_id, request=None):
    """Single-user variant. Prefer get_users_leaderboard_info() for lists."""
    return get_users_leaderboard_info([user_id], request)[user_id]
