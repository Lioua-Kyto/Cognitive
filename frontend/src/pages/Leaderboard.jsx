import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys.js";
import {
  CategoryLeaderboard,
  GameLeaderboard,
  GlobalLeaderboard,
  UserGameProgress,
} from "../api/leaderboard.jsx";
import useCategories from "../queries/useCategories.js";
import { gamesByCategory } from "../components/Categories/CategoryData.jsx";

const MEDALS = ["🥇", "🥈", "🥉"];

function Rank({ index }) {
  return (
    <span className="tabular text-body-s text-ink-muted" data-figure>
      {MEDALS[index] ?? index + 1}
    </span>
  );
}

function LeaderboardTable({ players, highlightUserId, expanded, onExpand }) {
  const limit = expanded ? 50 : 10;
  const shown = players.slice(0, limit);

  if (shown.length === 0) {
    // A real empty state. This used to pad the table to ten rows of "-", which
    // invented content to fill space.
    return (
      <div className="border-t border-rule py-storey-half text-center">
        <p className="text-body text-ink-muted">No scores here yet.</p>
        <p className="mt-2 text-body-s text-ink-faint">
          The first person to play this one takes the top row.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Players ranked by best score, highest first
        </caption>
        <thead>
          <tr className="border-b border-rule-strong">
            {["Rank", "Player", "Score", "Level", "Country"].map((h) => (
              <th
                key={h}
                scope="col"
                className="font-label px-3 py-3 text-label text-ink-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((p, i) => {
            const isYou = highlightUserId && highlightUserId === (p.id ?? p.user);
            return (
              <tr
                key={p.id ?? p.user ?? i}
                className={`border-b border-rule transition-colors duration-hair ${
                  isYou ? "bg-surface-raised" : "hover:bg-surface"
                }`}
              >
                <td className="px-3 py-3">
                  <Rank index={i} />
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-3">
                    {p.profile_picture ? (
                      <img
                        src={p.profile_picture}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-8 items-center justify-center rounded-full border border-rule text-body-s text-ink-muted"
                      >
                        {(p.username?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                    <span className="text-body text-ink">
                      {p.username ?? "Anonymous"}
                    </span>
                    {isYou && (
                      <span className="font-label text-label text-beam">You</span>
                    )}
                  </span>
                </td>
                <td className="tabular px-3 py-3 text-body text-lit" data-figure>
                  {p.score}
                </td>
                <td className="tabular px-3 py-3 text-body text-ink-muted" data-figure>
                  {p.level}
                </td>
                <td className="px-3 py-3 text-body-s text-ink-muted">
                  {p.country_flag ? (
                    <span className="flex items-center gap-2">
                      <img src={p.country_flag} alt="" className="h-3 w-auto" />
                      {p.country_name ?? p.country}
                    </span>
                  ) : (
                    (p.country_name ?? p.country ?? "—")
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {players.length > 10 && (
        <button
          type="button"
          onClick={() => onExpand(!expanded)}
          aria-expanded={expanded}
          className="mt-4 w-full border-t border-rule py-3 font-label text-label text-ink-muted transition-colors duration-hair hover:text-beam"
        >
          {expanded ? "Show fewer" : `Show top ${Math.min(players.length, 50)}`}
        </button>
      )}
    </div>
  );
}

export default function Leaderboard({ user, token }) {
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState("memory");
  const [selectedGame, setSelectedGame] = useState("all");
  const [globalRanks, setGlobalRanks] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getGameLabel = (cat, key) =>
    gamesByCategory[cat]?.find((g) => g.key === key)?.label || key;

  // Which board is on screen, derived rather than tracked in state.
  const scope = globalRanks
    ? { kind: "global" }
    : selectedGame !== "all"
      ? { kind: "game", name: getGameLabel(selectedCategory, selectedGame) }
      : { kind: "category", name: selectedCategory };

  const boardQuery = useQuery({
    queryKey:
      scope.kind === "global"
        ? queryKeys.leaderboard.global()
        : scope.kind === "game"
          ? queryKeys.leaderboard.game(scope.name)
          : queryKeys.leaderboard.category(scope.name),
    queryFn: () => {
      if (scope.kind === "global") return GlobalLeaderboard.fetch(token);
      if (scope.kind === "game") return GameLeaderboard.fetch(scope.name, token);
      return CategoryLeaderboard.fetch(scope.name, token);
    },
    // The boards are public; only the "your standing" panel below needs a token.
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.gameProgress(
      scope.kind === "global" ? "global" : scope.name
    ),
    queryFn: () =>
      UserGameProgress.fetch(
        scope.kind === "global" ? "global" : scope.name,
        token
      ),
    enabled: Boolean(token && user),
  });

  const players = boardQuery.data ?? [];
  const userStats = statsQuery.data ?? null;

  const scopeLabel = globalRanks
    ? "Global"
    : selectedGame !== "all"
      ? getGameLabel(selectedCategory, selectedGame)
      : (categories.find((c) => c.key === selectedCategory)?.label ?? "");

  const selectScope = (next) => {
    setExpanded(false);
    next();
  };

  return (
    <div className="mx-auto max-w-frame px-4 py-storey-half">
      <h1 className="font-display text-display-l text-lit">Leaderboard</h1>
      <p className="mt-3 max-w-[54ch] text-body text-ink-muted">
        Best score per person, per domain. Each domain ranks separately, so
        strength in one does not carry into another.
      </p>

      {/* Scope */}
      <div className="mt-10 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={globalRanks}
          onClick={() =>
            selectScope(() => {
              setGlobalRanks(true);
              setSelectedCategory(null);
              setSelectedGame("all");
            })
          }
          className={`h-9 rounded-hair border px-4 font-label text-label transition-colors duration-hair ${
            globalRanks
              ? "border-beam bg-beam text-poche"
              : "border-rule-strong text-ink-muted hover:border-beam hover:text-beam"
          }`}
        >
          Global
        </button>

        {categories.map((cat) => {
          const active = !globalRanks && selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              aria-pressed={active}
              onClick={() =>
                selectScope(() => {
                  setSelectedCategory(cat.key);
                  setSelectedGame("all");
                  setGlobalRanks(false);
                })
              }
              className={`h-9 rounded-hair border px-4 font-label text-label transition-colors duration-hair ${
                active
                  ? "border-beam bg-beam text-poche"
                  : "border-rule-strong text-ink-muted hover:border-beam hover:text-beam"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Game within the category */}
      {!globalRanks && (
        <div className="mt-4">
          <label htmlFor="board-game" className="font-label text-label text-ink-faint">
            Exercise
          </label>
          <select
            id="board-game"
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setExpanded(false);
            }}
            className="mt-2 block h-10 rounded-hair border border-rule bg-surface px-3 text-body text-ink focus:border-beam focus:outline-none"
          >
            <option value="all">All exercises</option>
            {selectedCategory &&
              gamesByCategory[selectedCategory]?.map((game) => (
                <option key={game.key} value={game.key}>
                  {game.label}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Your standing */}
      {userStats && (
        <div className="mt-8 border-l-2 border-beam bg-surface px-5 py-4">
          <p className="font-label text-label text-ink-muted">
            Your best in {scopeLabel}
          </p>
          <p className="mt-2 text-body text-ink">
            Level{" "}
            <span className="tabular text-lit" data-figure>
              {userStats.level_reached}
            </span>
            <span className="mx-3 text-ink-faint">·</span>
            Score{" "}
            <span className="tabular text-lit" data-figure>
              {userStats.score}
            </span>
          </p>
        </div>
      )}

      {/* Board */}
      <div className="mt-8">
        {boardQuery.isPending ? (
          <p className="py-storey-half text-center text-body text-ink-muted">
            Loading…
          </p>
        ) : boardQuery.error ? (
          <div className="border-t border-rule py-storey-half text-center">
            <p className="text-body text-negative">That board did not load.</p>
            <button
              type="button"
              onClick={() => boardQuery.refetch()}
              className="mt-3 h-9 rounded-hair border border-rule-strong px-4 text-body-s text-ink hover:border-beam hover:text-beam"
            >
              Try again
            </button>
          </div>
        ) : (
          <LeaderboardTable
            players={players}
            highlightUserId={user?.id}
            expanded={expanded}
            onExpand={setExpanded}
          />
        )}
      </div>

      {!token && (
        <p className="mt-storey-half border-t border-rule pt-6 text-body-s text-ink-muted">
          <Link to="/signin" className="text-beam underline">
            Create an account
          </Link>{" "}
          to appear on these boards and keep your progress per domain.
        </p>
      )}
    </div>
  );
}
