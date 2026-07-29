import { Link, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { gamesByCategory } from "../components/Categories/CategoryData.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchUserGameProgress } from "../api/score.jsx";
import { fetchGameHistoryDetails } from "../api/profile.jsx";
import "./Styles/GameList.css";

export default function GameList() {
  const { category } = useParams();
  const { token } = useContext(AuthContext);
  const [gameStats, setGameStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Get games from imported gamesByCategory
  const games = gamesByCategory[category] || [];

  useEffect(() => {
    async function fetchAllGameStats() {
      if (!token || !games.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const stats = {};

      try {
        // First, get detailed game history for this category to get play counts
        const gameHistoryDetails = await fetchGameHistoryDetails(
          token,
          category
        );

        // Then fetch individual game progress for best scores and levels
        await Promise.all(
          games.map(async (game) => {
            try {
              // Find this game in the detailed history
              const gameDetail = gameHistoryDetails?.games?.find(
                (g) => g.name === game.label || g.key === game.key
              );

              // Get user progress for best score and level
              const userProgress = await fetchUserGameProgress(
                game.label,
                token
              );

              stats[game.key] = {
                plays: gameDetail?.total_plays || 0,
                bestLevel: userProgress.level_reached || 1,
                bestScore: userProgress.score || 0,
              };

              console.log(`Stats for ${game.label}:`, stats[game.key]);
            } catch (error) {
              console.warn(`Failed to fetch stats for ${game.label}:`, error);
              // Set default values if fetch fails
              stats[game.key] = {
                plays: 0,
                bestLevel: 1,
                bestScore: 0,
              };
            }
          })
        );
      } catch (error) {
        console.error("Error fetching game stats:", error);
        // Set default stats for all games if category fetch fails
        games.forEach((game) => {
          stats[game.key] = {
            plays: 0,
            bestLevel: 1,
            bestScore: 0,
          };
        });
      }

      console.log("All game stats:", stats);
      setGameStats(stats);
      setLoading(false);
    }

    fetchAllGameStats();
  }, [category, token, games]);

  return (
    <div className="game-list-container">
      <div className="game-list-title">
        {category
          ? `${category.charAt(0).toUpperCase() + category.slice(1)} Games`
          : "Games"}
      </div>
      <div className="game-list-grid">
        {games.map((game) => {
          const stats = gameStats[game.key] || {
            plays: 0,
            bestLevel: 1,
            bestScore: 0,
          };

          return (
            <Link
              to={`/games/${category}/${game.key}`}
              className="game-list-card"
              data-category={category}
              data-game={game.key}
              key={game.key}
            >
              <div className="game-list-card-image">
                {/* Image space without icon */}
              </div>
              <div className="game-list-card-content">
                <h4 className="game-list-card-title">{game.label}</h4>
                <p className="game-list-card-desc">{game.desc}</p>
              </div>
              <div className="game-list-card-stats">
                <div className="game-stat">
                  <span className="game-stat-icon">🎮</span>
                  <span className="game-stat-value">
                    {loading ? "..." : stats.plays}
                  </span>
                </div>
                <div className="game-stat">
                  <span className="game-stat-icon">🏆</span>
                  <span className="game-stat-value">
                    {loading ? "..." : stats.bestLevel}
                  </span>
                </div>
                <div className="game-stat">
                  <span className="game-stat-icon">⭐</span>
                  <span className="game-stat-value">
                    {loading ? "..." : stats.bestScore}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-5 text-center text-muted">
        <small>
          Tip: Try each game and see which ones challenge you the most.
          Consistent practice leads to real improvement!
        </small>
      </div>
    </div>
  );
}
