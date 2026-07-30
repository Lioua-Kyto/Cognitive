import { Link, useParams } from "react-router-dom";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { gamesByCategory } from "../components/Categories/CategoryData.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchGameHistoryDetails } from "../api/profile.jsx";

const EMPTY_STATS = { plays: 0, bestLevel: 1, bestScore: 0 };

export default function GameList() {
  const { category } = useParams();
  const { token } = useContext(AuthContext);

  // Get games from imported gamesByCategory
  const games = gamesByCategory[category] || [];

  // One request for the whole category. This used to be the category history
  // request plus a separate progress request per game, even though the category
  // response already carries best_score, best_level and total_plays.
  const { data, isPending } = useQuery({
    queryKey: ["gameHistory", category],
    queryFn: () => fetchGameHistoryDetails(token, category),
    enabled: Boolean(token && category && games.length),
  });

  const gameStats = Object.fromEntries(
    games.map((game) => {
      const detail = data?.games?.find(
        (g) => g.name === game.label || g.key === game.key
      );
      return [
        game.key,
        detail
          ? {
              plays: detail.total_plays || 0,
              bestLevel: detail.best_level || 1,
              bestScore: detail.best_score || 0,
            }
          : EMPTY_STATS,
      ];
    })
  );

  const loading = isPending && Boolean(token) && games.length > 0;

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
