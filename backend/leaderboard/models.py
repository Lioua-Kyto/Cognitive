from django.db import models
from users.models import CustomUser
from games.models import Game
from django.db.models.signals import post_save
from django.dispatch import receiver

class GameResult(models.Model):
    """Individual game session results"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='game_results')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField(default=0)
    level_reached = models.PositiveIntegerField(default=1)
    xp_earned = models.PositiveIntegerField(default=0)
    played_at = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0, help_text="Game duration in seconds")
    streaks = models.IntegerField(default=0)
    mistakes = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)

    class Meta:
        ordering = ['-played_at']

    def __str__(self):
        return f"{self.user.username} - {self.game.name} - Score: {self.score}"

    def save(self, *args, **kwargs):
        # Calculate XP if not already set
        if not self.xp_earned:
            self.xp_earned = self.game.calculate_xp_reward(self.score)
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # XP is awarded by games.services.scoring.record_game_result, not here.
            self.update_best_score()

    def update_best_score(self):
        """Update or create best score record"""
        best_score, created = BestScore.objects.get_or_create(
            user=self.user,
            game=self.game,
            defaults={
                'score': self.score,
                'level_reached': self.level_reached,
                'xp_earned': self.xp_earned,
                'best_streak': self.streaks,
                'fewest_mistakes': self.mistakes,
                'most_correct': self.correct_answers,
                'times_played': 1,
            }
        )
        
        if not created:
            # Update if this is a better score
            if self.score > best_score.score:
                best_score.score = self.score
                best_score.level_reached = self.level_reached
                best_score.xp_earned = self.xp_earned

            if self.streaks > best_score.best_streak:
                best_score.best_streak = self.streaks

            if self.mistakes < best_score.fewest_mistakes:
                best_score.fewest_mistakes = self.mistakes

            if self.correct_answers > best_score.most_correct:
                best_score.most_correct = self.correct_answers

            # Always saved: times_played changes on every play, so gating the
            # save on a record being broken silently dropped the increment.
            best_score.times_played += 1
            best_score.save()


class BestScore(models.Model):
    """
    Stores only the best score for each user/game combination for quick leaderboard access.
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='best_scores')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='best_scores')
    score = models.IntegerField(default=0)
    level_reached = models.PositiveIntegerField(default=1)
    xp_earned = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    best_streak = models.IntegerField(default=0)
    fewest_mistakes = models.IntegerField(default=999)  # High default to track lowest
    most_correct = models.IntegerField(default=0)  # Track highest number of correct answers
    times_played = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'game')

    def __str__(self):
        return f"{self.user.username} - {self.game.name} - Best Score: {self.score}"


# Keep the old GameScore model for backwards compatibility but mark as deprecated
class GameScore(models.Model):
    """DEPRECATED: Use GameResult instead"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    level_reached = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)
    last_played = models.DateTimeField(auto_now=True)
    streaks = models.IntegerField(default=0)
    mistakes = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} - {self.game.name} - Score: {self.score}"