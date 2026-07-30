from django.db import models


class Game(models.Model):
    CATEGORY_CHOICES = [
        ('memory', 'Memory'),
        ('attention', 'Attention'),
        ('speed', 'Speed'),
        ('logic', 'Logic'),
        ('language', 'Language'),
        ('multi', 'Multi-Domain'),
        ('competitive', 'Competitive'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    base_xp_reward = models.IntegerField(default=10, help_text="Base XP awarded for completing this game")
    difficulty_multiplier = models.FloatField(default=1.0, help_text="Multiplier for XP based on difficulty")

    def __str__(self):
        return self.name
    
    def calculate_xp_reward(self, score, max_possible_score=None):
        """Calculate XP reward based on score performance"""
        base_xp = self.base_xp_reward
        
        if max_possible_score and score > 0:
            # Performance bonus: up to 50% more XP for perfect scores
            performance_ratio = min(score / max_possible_score, 1.0)
            performance_bonus = base_xp * 0.5 * performance_ratio
            total_xp = base_xp + performance_bonus
        else:
            # Just give base XP if we don't have performance metrics
            total_xp = base_xp
        
        # Apply difficulty multiplier
        total_xp *= self.difficulty_multiplier
        
        return int(total_xp)


class MultiplayerMatch(models.Model):
    """Model for tracking multiplayer competitive games"""
    MATCH_STATUS_CHOICES = [
        ('waiting', 'Waiting for Players'),
        ('active', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE, limit_choices_to={'category': 'competitive'})
    player1 = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='matches_as_player2', null=True, blank=True)
    status = models.CharField(max_length=20, choices=MATCH_STATUS_CHOICES, default='waiting', db_index=True)
    winner = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    
    # Match data
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Game-specific data (stored as JSON)
    game_data = models.JSONField(default=dict, help_text="Game-specific configuration and state")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        if self.player2:
            return f"{self.player1.username} vs {self.player2.username} - {self.game.name}"
        return f"{self.player1.username} waiting for opponent - {self.game.name}"
    
    def get_opponent(self, user):
        """Get the opponent of a given user in this match"""
        if user == self.player1:
            return self.player2
        elif user == self.player2:
            return self.player1
        return None


class MultiplayerScore(models.Model):
    """Model for tracking individual player scores in multiplayer matches"""
    match = models.ForeignKey(MultiplayerMatch, on_delete=models.CASCADE, related_name='scores')
    player = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    level_reached = models.IntegerField(default=1)
    completed_at = models.DateTimeField(auto_now_add=True)
    
    # Game-specific performance data
    performance_data = models.JSONField(default=dict, help_text="Game-specific performance metrics")
    
    class Meta:
        unique_together = ['match', 'player']
        ordering = ['-score']
    
    def __str__(self):
        return f"{self.player.username}: {self.score} in {self.match.game.name}"