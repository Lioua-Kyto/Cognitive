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
    <div className="mx-auto max-w-frame px-4 py-storey-half">
      <h1 className="font-display text-display-l text-lit">
        {category
          ? `${category.charAt(0).toUpperCase() + category.slice(1)}`
          : "Exercises"}
      </h1>
      <p className="mt-3 max-w-[54ch] text-body text-ink-muted">
        {games.length} exercise{games.length === 1 ? "" : "s"} in this domain.
        Your own figures appear once you have played.
      </p>

      {games.length === 0 ? (
        <div className="mt-storey-half border-t border-rule py-storey-half text-center">
          <p className="text-body text-ink-muted">Nothing here yet.</p>
          <p className="mt-2 text-body-s text-ink-faint">
            This domain has no exercises built for it so far.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const stats = gameStats[game.key] ?? EMPTY_STATS;
            const played = stats.plays > 0;

            return (
              <li key={game.key}>
                <Link
                  to={`/games/${category}/${game.key}`}
                  className="group flex h-full flex-col gap-3 bg-surface p-6 transition-colors duration-hair hover:bg-surface-raised"
                >
                  <h2 className="text-heading-s font-semibold text-lit group-hover:text-beam">
                    {game.label}
                  </h2>
                  <p className="text-body-s text-ink-muted">{game.desc}</p>

                  <dl className="mt-auto flex gap-6 border-t border-rule pt-4">
                    {[
                      ["Plays", stats.plays],
                      ["Best level", played ? stats.bestLevel : "—"],
                      ["Best score", played ? stats.bestScore : "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-label text-label text-ink-faint">
                          {label}
                        </dt>
                        <dd
                          className="tabular mt-1 text-body text-ink"
                          data-figure
                        >
                          {loading ? "·" : value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
