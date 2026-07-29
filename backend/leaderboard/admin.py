from django.contrib import admin
from .models import *

class GameScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'level_reached', 'last_played')
    list_filter = ('game',)
    search_fields = ('user__email', 'game__name')

admin.site.register(GameScore, GameScoreAdmin)

class GameResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'level_reached', 'played_at', 'streaks', 'mistakes', 'correct_answers', 'xp_earned')
    list_filter = ('game',)
    search_fields = ('user__email', 'game__name')

admin.site.register(GameResult, GameResultAdmin)

class BestScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'level_reached', 'best_streak', 'fewest_mistakes')
    list_filter = ('game',)
    search_fields = ('user__email', 'game__name')

admin.site.register(BestScore, BestScoreAdmin)