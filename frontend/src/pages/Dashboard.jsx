import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  fetchProfile,
  fetchGlobalRank,
  fetchGameStats,
  fetchRecentGames,
} from "../api/profile.jsx";
import { AchievementsAPI } from "../api/achievements.jsx";
import PlayStreak from "../components/Dashboard/PlayStreak";
import "./Styles/Dashboard.css";

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [profileData, rankData, statsData, recentData] =
          await Promise.all([
            fetchProfile(token),
            fetchGlobalRank(token).catch(() => null),
            fetchGameStats(token).catch(() => null),
            fetchRecentGames(token).catch(() => []),
          ]);

        setProfile(profileData);
        setGlobalRank(rankData);
        setGameStats(statsData);
        setRecentGames(recentData);

        // Fetch achievements and badges
        try {
          const achievementsAPI = new AchievementsAPI();
          const achievementsData =
            await achievementsAPI.fetchAchievementsAndBadges(token);

          // Get recent earned achievements (last 5)
          const earnedAchievements = achievementsData.achievements
            .filter((a) => a.is_earned && a.earned_date)
            .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
            .slice(0, 3);

          // Get recent earned badges (last 3)
          const earnedBadges = achievementsData.badges
            .filter((b) => b.is_earned && b.earned_date)
            .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
            .slice(0, 3);

          setRecentAchievements(earnedAchievements);
          setRecentBadges(earnedBadges);
        } catch (achievementError) {
          console.error("Achievement fetch error:", achievementError);
        }

        setError("");
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome back, {profile?.username || "Player"}!
          </h1>
          <p className="welcome-subtitle">
            Ready to challenge your mind today?
          </p>
        </div>
        <div className="welcome-stats">
          <div className="stat-card">
            <div className="stat-number">{globalRank?.rank || "N/A"}</div>
            <div className="stat-label">Global Rank</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{gameStats?.total_games || 0}</div>
            <div className="stat-label">Games Played</div>
          </div>
        </div>
      </div>

      {/* Play Streak - Full Width */}
      <div className="play-streak-full-width">
        <PlayStreak userStats={gameStats} />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-card dashboard-card-recent-games">
          <h3 className="card-title">Recent Games</h3>
          <div className="recent-games">
            {recentGames.length > 0 ? (
              recentGames.slice(0, 5).map((game, index) => (
                <div key={index} className="recent-game-item">
                  <div className="recent-game-info">
                    <div className="recent-game-name">{game.game_name}</div>
                    <div className="recent-game-category">{game.category}</div>
                  </div>
                  <div className="recent-game-stats">
                    <div className="recent-game-score">Score: {game.score}</div>
                    <div className="recent-game-xp">+{game.xp_earned} XP</div>
                  </div>
                  <div className="recent-game-date">
                    {new Date(game.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-recent-games">
                <p>No recent games yet. Start playing to see your activity!</p>
                <Link to="/games" className="btn btn-primary">
                  Play Games
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="dashboard-card">
          <h3 className="card-title">Performance Overview</h3>
          <div className="performance-stats">
            <div className="performance-item">
              <span className="performance-label">Best Category</span>
              <span className="performance-value">
                {gameStats?.best_category || "N/A"}
              </span>
            </div>
            <div className="performance-item">
              <span className="performance-label">Average Score</span>
              <span className="performance-value">
                {gameStats?.average_score || "0"}%
              </span>
            </div>
            <div className="performance-item">
              <span className="performance-label">Improvement</span>
              <span className="performance-value">
                {gameStats?.improvement_trend > 0
                  ? "↗️"
                  : gameStats?.improvement_trend < 0
                  ? "↘️"
                  : "→"}
                {Math.abs(gameStats?.improvement_trend || 0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Achievements - Scrollable, Only Unlocked */}
        <div className="dashboard-card">
          <h3 className="card-title">🏆 Achievements</h3>
          <div className="recent-achievements scrollable">
            {recentAchievements.length > 0 ? (
              <div className="achievements-list">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="achievement-item">
                    <div className="achievement-icon-small">
                      {achievement.icon}
                    </div>
                    <div className="achievement-info">
                      <div className="achievement-name-small">
                        {achievement.name}
                      </div>
                      <div className="achievement-date">
                        {new Date(achievement.earned_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="achievement-points-small">
                      +{achievement.points}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-achievements">
                <p>
                  No achievements earned yet. Start playing to unlock your first
                  achievement!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="dashboard-card">
          <h3 className="card-title">💎 Daily Challenge</h3>
          <div className="daily-challenge">
            <div className="challenge-header">
              <div className="challenge-icon">🧠</div>
              <div className="challenge-info">
                <div className="challenge-title">Memory Marathon</div>
                <div className="challenge-desc">
                  Complete 3 memory games with 70% accuracy
                </div>
              </div>
            </div>
            <div className="challenge-progress-bar">
              <div className="progress-fill" style={{ width: "33%" }}></div>
            </div>
            <div className="challenge-reward">
              <span className="reward-text">Reward: +50 XP</span>
              <span className="challenge-time">Resets in 14h 32m</span>
            </div>
          </div>
        </div>

        {/* Training Tip */}
        <div className="dashboard-card">
          <h3 className="card-title">💡 Training Tip</h3>
          <div className="training-tip">
            <div className="tip-icon">🎯</div>
            <div className="tip-content">
              <div className="tip-title">Focus Training</div>
              <div className="tip-text">
                Practice attention games in a quiet environment to improve
                concentration. Even 10 minutes daily can enhance your focus
                abilities!
              </div>
            </div>
          </div>
        </div>

        {/* Recent Badges - Scrollable, Only Unlocked */}
        <div className="dashboard-card">
          <h3 className="card-title">🎖️ Badges</h3>
          <div className="recent-badges scrollable">
            {recentBadges.length > 0 ? (
              <div className="badges-list">
                {recentBadges.map((badge) => (
                  <div key={badge.id} className="badge-item">
                    <div
                      className="badge-icon-small"
                      style={{ color: badge.color }}
                    >
                      {badge.icon}
                    </div>
                    <div className="badge-info">
                      <div className="badge-name-small">{badge.name}</div>
                      <div className="badge-date">
                        {new Date(badge.earned_date).toLocaleDateString()}
                      </div>
                    </div>
                    {badge.is_rare && (
                      <div className="rare-indicator-small">✨</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-badges">
                <p>
                  No badges earned yet. Complete challenges to earn your first
                  badge!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Games */}
        <div className="dashboard-card dashboard-card-wide">
          <h3 className="card-title">Featured Games</h3>
          <div className="featured-games">
            <Link
              to="/games/memory/number-recall"
              className="featured-game-card"
              data-category="memory"
            >
              <div
                className="featured-game-image"
                style={{
                  backgroundImage: `url('/src/assets/Pictures/Games/Memory/NumberRecall.jpeg')`,
                }}
              ></div>
              <div className="featured-game-content">
                <h4 className="featured-game-title">Number Recall</h4>
                <p className="featured-game-description">
                  Challenge your working memory with number sequences
                </p>
                <div className="featured-game-category">Memory</div>
              </div>
            </Link>

            <Link
              to="/games/memory/digit-span"
              className="featured-game-card"
              data-category="memory"
            >
              <div
                className="featured-game-image"
                style={{
                  backgroundImage: `url('/src/assets/Pictures/Games/Memory/4.jpg')`,
                }}
              ></div>
              <div className="featured-game-content">
                <h4 className="featured-game-title">Digit Span</h4>
                <p className="featured-game-description">
                  Test your memory span with digit sequences
                </p>
                <div className="featured-game-category">Memory</div>
              </div>
            </Link>

            <Link
              to="/games/memory/card-flip-memory"
              className="featured-game-card"
              data-category="memory"
            >
              <div
                className="featured-game-image"
                style={{
                  backgroundImage: `url('/src/assets/Pictures/Games/Memory/1.jpg')`,
                }}
              ></div>
              <div className="featured-game-content">
                <h4 className="featured-game-title">Memory Cards</h4>
                <p className="featured-game-description">
                  Classic memory matching game with cards
                </p>
                <div className="featured-game-category">Memory</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Brain Health Score */}
        <div className="dashboard-card">
          <h3 className="card-title">🧠 Brain Health Score</h3>
          <div className="brain-health-score">
            <div className="score-display">
              <div className="score-number">
                {gameStats?.brain_health_score || 75}
              </div>
              <div className="score-label">Health Score</div>
            </div>
            <div className="score-breakdown">
              <div className="score-item">
                <span className="score-metric">Memory</span>
                <span className="score-value">
                  {gameStats?.memory_score || 78}%
                </span>
              </div>
              <div className="score-item">
                <span className="score-metric">Attention</span>
                <span className="score-value">
                  {gameStats?.attention_score || 72}%
                </span>
              </div>
              <div className="score-item">
                <span className="score-metric">Processing</span>
                <span className="score-value">
                  {gameStats?.processing_score || 76}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
