import { useState } from "react";
import { Line } from "react-chartjs-2";
import { baseOptions, lineData } from "./chartTheme.js";
import Button from "../../ui/Button.jsx";
import StatTile from "../../ui/StatTile.jsx";

const shortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

/** Per-game history inside one domain. */
export default function ProgressTab({
  categories,
  activeCategory,
  onSelectCategory,
  details,
  loading,
}) {
  const [openGame, setOpenGame] = useState(null);

  const games = details?.games ?? [];
  const played = games.filter((game) => game.total_plays > 0);
  const selected = played.find((game) => game.key === openGame) ?? played[0];

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-labelledby="progress-domain-label">
        <p
          id="progress-domain-label"
          className="font-label text-label text-ink-faint"
        >
          Domain
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.key}
              size="sm"
              variant={category.key === activeCategory ? "primary" : "secondary"}
              aria-pressed={category.key === activeCategory}
              onClick={() => {
                onSelectCategory(category.key);
                setOpenGame(null);
              }}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-body-s text-ink-muted">Loading…</p>
      ) : played.length === 0 ? (
        <p className="text-body-s text-ink-faint">
          No sessions in this domain yet.
        </p>
      ) : (
        <>
          <div role="group" aria-labelledby="progress-game-label">
            <p
              id="progress-game-label"
              className="font-label text-label text-ink-faint"
            >
              Exercise
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {played.map((game) => (
                <Button
                  key={game.key}
                  size="sm"
                  variant={game.key === selected?.key ? "primary" : "secondary"}
                  aria-pressed={game.key === selected?.key}
                  onClick={() => setOpenGame(game.key)}
                >
                  {game.name}
                </Button>
              ))}
            </div>
          </div>

          {selected && (
            <section aria-labelledby="progress-game">
              <h2
                id="progress-game"
                className="font-display text-heading-s text-lit"
              >
                {selected.name}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-5">
                <StatTile label="Best" value={selected.best_score} />
                <StatTile label="Level" value={selected.best_level} />
                <StatTile label="Streak" value={selected.best_streak} />
                <StatTile label="Mistakes" value={selected.fewest_mistakes} />
                <StatTile label="Sessions" value={selected.total_plays} />
              </div>

              {selected.history.length > 0 && (
                <div className="mt-4 h-56 rounded-room border border-rule bg-surface p-4">
                  <Line
                    data={lineData(
                      // The API returns newest first; a time axis reads forward.
                      [...selected.history].reverse().map((entry) => ({
                        label: shortDate(entry.date),
                        value: entry.score,
                      })),
                      `${selected.name} score`
                    )}
                    options={baseOptions({ yTitle: "Score" })}
                  />
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
