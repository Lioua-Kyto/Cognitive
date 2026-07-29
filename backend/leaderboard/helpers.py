from django.conf import settings
from users.models import CustomUser

def get_user_leaderboard_info(user_id, request=None):
    """
    Helper function to get consistent user information for leaderboard views.
    Returns a dictionary with all relevant user fields including full URLs for images.
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        
        # Get profile picture URL with full path
        profile_picture_url = None
        if user.profile_picture:
            profile_picture_url = user.profile_picture.url
            if request:
                profile_picture_url = request.build_absolute_uri(profile_picture_url)
        
        # Get country flag URL with full path
        country_flag_url = None
        country_name = None
        if user.country:
            code = user.country.code.lower()
            # Always use static flag URL, not relying on flag attribute which might be inconsistent
            country_flag_url = f"/static/flags/{code}.svg"
            if request:
                country_flag_url = request.build_absolute_uri(country_flag_url)
            country_name = user.country.name
        
        return {
            'id': user.id,
            'email': user.email,
            'username': user.username,
         
            'profile_picture': profile_picture_url,
            'country': user.country.code if user.country else None,
            'country_flag': country_flag_url,
            'country_name': country_name,
            'level': user.level,
            'experience': user.experience
        }
    except CustomUser.DoesNotExist:
        return {
            'id': user_id,
            'email': None,
            'username': None,
            'profile_picture': None,
            'country': None,
            'country_flag': None,
            'country_name': None,
            'level': None,
            'experience': None
        }
