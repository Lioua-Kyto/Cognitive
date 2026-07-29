from django.contrib import admin
from .models import Game

class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name', 'category')
    ordering = ('category',)

admin.site.register(Game, GameAdmin)