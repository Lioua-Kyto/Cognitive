import { useEffect, useState } from "react";
import {
  GlobalLeaderboard,
  CategoryLeaderboard,
  GameLeaderboard,
  UserGameProgress,
} from "../api/leaderboard.jsx";
import useCategories from "../hooks/useCategories.jsx";
import {
  enhanceCategories,
  gamesByCategory,
} from "../components/Categories/CategoryData.jsx";
import { Link } from "react-router-dom";
import "../components/Games/Styles/games.css";
import "./Styles/Leaderboard.css";

function LeaderboardTable({ players, highlightUserId, expanded, onExpand }) {
  const rowsToShow = expanded ? 50 : 10;
  const displayPlayers = [...players];
  while (displayPlayers.length < rowsToShow) {
    displayPlayers.push({
      user: null,
      username: "",
      email: "",
      profile_picture: "",
      score: "-",
      level: "-",
      country: "-",
      country_flag: "",
      country_name: "",
    });
  }
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle leaderboard-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Level</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {displayPlayers.slice(0, rowsToShow).map((p, i) => (
            <tr
              key={p.id || p.user || `placeholder-${i}`}
              className={
                highlightUserId === (p.id || p.user) ? "table-primary" : ""
              }
            >
              <td>
                <span className="fw-bold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
              </td>
              <td>
                <span className="fw-semibold player-name">
                  {p.profile_picture ? (
                    <img
                      src={p.profile_picture}
                      alt="Profile"
                      className="player-avatar"
                    />
                  ) : (
                    <span className="player-avatar-fallback">
                      {(p.username?.[0] || p.email?.[0] || "?").toUpperCase()}
                    </span>
                  )}
                  {p.username ||
                    p.email ||
                    (p.score === "-" ? "-" : "Anonymous")}
                </span>
              </td>
              <td>
                <span className="fw-bold player-score">{p.score}</span>
              </td>
              <td>{p.level}</td>
              <td>
                {p.country_flag ? (
                  <span className="player-country">
                    <img
                      src={p.country_flag}
                      alt={p.country_name || p.country || "Flag"}
                      className="country-flag"
                    />
                    {p.country_name || p.country}
                  </span>
                ) : (
                  p.country_name || p.country || "-"
                )}
              </td>
            </tr>
          ))}
          <tr
            className="leaderboard-expand-row"
            onClick={() => onExpand(!expanded)}
            style={{ cursor: "pointer" }}
          >
            <td colSpan={5} style={{ textAlign: "center" }}>
              <span className="expand-arrow">{expanded ? "▲" : "▼"}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Leaderboard({ user, token }) {
  const { categories, loading: categoriesLoading } = useCategories(token);
  const [selectedCategory, setSelectedCategory] = useState("memory");
  const [selectedGame, setSelectedGame] = useState("all");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [globalRanks, setGlobalRanks] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getGameLabel = (cat, key) =>
    gamesByCategory[cat]?.find((g) => g.key === key)?.label || key;

  useEffect(() => {
    setLoading(true);
    setExpanded(false);

    async function fetchData() {
      try {
        let data = [];
        if (globalRanks) {
          data = await GlobalLeaderboard.fetch();
          setPlayers(data || []);
          if (user && token) {
            const stats = await UserGameProgress.fetch("global", token);
            setUserStats(stats);
          }
        } else if (selectedCategory) {
          if (selectedGame && selectedGame !== "all") {
            const gameLabel = getGameLabel(selectedCategory, selectedGame);
            data = await GameLeaderboard.fetch(gameLabel);
          } else {
            data = await CategoryLeaderboard.fetch(selectedCategory);
          }
          setPlayers(data || []);
          if (user && token) {
            const gameName =
              selectedGame !== "all"
                ? getGameLabel(selectedCategory, selectedGame)
                : selectedCategory;
            const stats = await UserGameProgress.fetch(gameName, token);
            setUserStats(stats);
          }
        }
      } catch (e) {
        console.error("Error fetching leaderboard data:", e);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCategory, selectedGame, globalRanks, user, token]);

  const handleCategoryClick = (catKey) => {
    setSelectedCategory(catKey);
    setSelectedGame("all");
    setGlobalRanks(false);
  };

  const handleGameChange = (e) => {
    setSelectedGame(e.target.value);
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-title">🌟 Global Leaderboard</div>
      <p className="leaderboard-desc">
        Celebrate your progress, challenge the world, and see how you stack up
        in brain training! Every game you play helps you climb higher.
      </p>

      {/* Global Ranks button */}
      <div className="leaderboard-global-btn-row">
        <button
          className={`leaderboard-global-btn${globalRanks ? " active" : ""}`}
          onClick={() => {
            setGlobalRanks(true);
            setSelectedCategory(null);
            setSelectedGame("all");
          }}
        >
          🌍 Global Ranks
        </button>
      </div>

      {/* Category buttons - Always show */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="leaderboard-categories-section">
          <div className="leaderboard-category-row">
            {enhanceCategories(categories).map((cat) => (
              <button
                key={cat.key}
                className={`leaderboard-category-btn ${
                  selectedCategory === cat.key && !globalRanks ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(cat.key)}
                aria-pressed={selectedCategory === cat.key && !globalRanks}
                data-category={cat.key}
              >
                <div className="leaderboard-category-btn-icon">
                  <img src={cat.icon} alt={cat.label} />
                </div>
                <div className="leaderboard-category-btn-text">
                  <span className="leaderboard-category-btn-label">
                    {cat.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game dropdown */}
      <div className="leaderboard-game-dropdown-row">
        <select
          className="leaderboard-game-dropdown"
          value={selectedGame}
          onChange={handleGameChange}
          disabled={globalRanks}
        >
          <option value="all">All Games</option>
          {selectedCategory &&
            gamesByCategory[selectedCategory]?.map((game) => (
              <option key={game.key} value={game.key}>
                {game.label}
              </option>
            ))}
        </select>
      </div>

      {userStats && (
        <div className="alert alert-info leaderboard-user-stats">
          <span role="img" aria-label="user" className="user-emoji">
            👤
          </span>
          <div className="ms-3">
            <strong>
              Your Best in{" "}
              {globalRanks
                ? "Global"
                : selectedGame !== "all"
                ? gamesByCategory[selectedCategory]?.find(
                    (g) => g.key === selectedGame
                  )?.label || ""
                : categories.find((c) => c.key === selectedCategory)?.label ||
                  ""}
              :
            </strong>
            <div>
              Level <b>{userStats.level_reached}</b> &nbsp;|&nbsp; Score{" "}
              <b>{userStats.score}</b>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm mb-4 leaderboard-table-card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" />
              <div className="loading-text">Loading leaderboard...</div>
            </div>
          ) : (
            <LeaderboardTable
              players={players}
              highlightUserId={user && user.id}
              expanded={expanded}
              onExpand={setExpanded}
            />
          )}
        </div>
      </div>

      <div className="mb-4 leaderboard-info-row">
        <div className="col-md-6 mb-3 leaderboard-info-card">
          <div className="p-4 h-100">
            <h4 className="fw-bold leaderboard-info-title">Why Compete?</h4>
            <ul className="mb-0 leaderboard-info-list">
              <li>
                <b>Stay Motivated:</b> Friendly competition keeps you coming
                back.
              </li>
              <li>
                <b>Track Your Growth:</b> See your improvement over time.
              </li>
              <li>
                <b>Global Community:</b> Join millions training their minds
                together.
              </li>
              <li>
                <b>Unlock Achievements:</b> Earn badges for top scores and
                streaks.
              </li>
            </ul>
          </div>
        </div>
        <div className="col-md-6 mb-3 leaderboard-info-card">
          <div className="p-4 h-100">
            <h4 className="fw-bold leaderboard-info-title">
              How Leaderboards Work
            </h4>
            <ul className="mb-0 leaderboard-info-list">
              <li>
                <b>Global Ranks:</b> See the top players across all games and
                categories.
              </li>
              <li>
                <b>Categories:</b> Each skill category has its own leaderboard.
              </li>
              <li>
                <b>Games:</b> Select a specific game to view its leaderboard.
              </li>
              <li>
                <b>Always Accessible:</b> The game dropdown is always visible
                for quick switching.
              </li>
              <li>
                <b>Fair Play:</b> Only your best score per game is shown.
              </li>
              <li>
                <b>Privacy:</b> You can play as "Anonymous" or set your name.
              </li>
              <li>
                <b>Frequent Updates:</b> Scores refresh in real time.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Wide scoring details card */}
      <div className="leaderboard-scoring-details-card">
        <h4 className="fw-bold leaderboard-scoring-title">
          How Scores Are Calculated
        </h4>
        <ul className="leaderboard-scoring-list">
          <li>
            <b>Base Score:</b> Each correct answer gives points. Harder
            questions and higher levels give more.
          </li>
          <li>
            <b>Streak Multiplier:</b> Consecutive correct answers increase your
            multiplier (e.g. 2x, 3x, etc).
          </li>
          <li>
            <b>Reaction Speed:</b> Faster answers earn bonus points. The quicker
            you answer, the higher the bonus.
          </li>
          <li>
            <b>Timer Reduction:</b> As you progress, the time allowed per
            question decreases, raising the challenge and potential score.
          </li>
          <li>
            <b>Streak Break:</b> A wrong answer resets your streak multiplier
            and may reduce your bonus.
          </li>
          <li>
            <b>Level Bonus:</b> Completing a level quickly or with a perfect
            streak gives extra points.
          </li>
          <li>
            <b>XP:</b> Earn XP for every game, which helps you level up and
            unlock new features.
          </li>
        </ul>
        <div className="leaderboard-scoring-tip">
          <b>Tip:</b> Play consistently and aim for long streaks to maximize
          your score!
        </div>
      </div>

      <div className="leaderboard-cta-card">
        <h3 className="fw-bold leaderboard-cta-title">
          Ready to train your brain and join the leaderboard?
        </h3>
        <Link
          to="/games"
          className="btn btn-lg btn-primary game-btn px-5 py-3 start-btn-hover leaderboard-cta-btn"
        >
          Start Playing Now
        </Link>
        <div className="mt-3 text-muted leaderboard-cta-subtext">
          <small>
            Every game you play is a step toward a sharper mind and a higher
            rank!
          </small>
        </div>
      </div>

      <footer className="leaderboard-footer">
        &copy; {new Date().getFullYear()} Cognitive Games. Empowering minds, one
        game at a time.
      </footer>
    </div>
  );
}
