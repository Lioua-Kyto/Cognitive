import { Line } from "react-chartjs-2";
import { baseOptions, lineData } from "./chartTheme.js";
import StatTile from "../../ui/StatTile.jsx";

const shortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

/**
 * Score history per domain.
 *
 * One chart per domain that has been played, rather than seven cards of which
 * five said "no data". An untrained domain is listed, not drawn.
 */
export default function AnalyticsTab({ categories, analytics }) {
  const trained = categories.filter(
    (category) => (analytics.categories?.[category.key]?.history ?? []).length > 0
  );
  const untrained = categories.filter(
    (category) => !trained.includes(category)
  );

  if (trained.length === 0) {
    return (
      <p className="py-storey-half text-body text-ink-muted">
        Nothing to chart yet. Scores appear here once you have played a session.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-storey-half">
      {trained.map((category) => {
        const data = analytics.categories[category.key];
        const points = data.history.map((entry) => ({
          label: shortDate(entry.date),
          value: entry.score,
        }));
        const scores = points.map((p) => p.value);

        return (
          <section key={category.key} aria-labelledby={`chart-${category.key}`}>
            <h2
              id={`chart-${category.key}`}
              className="font-display text-heading-s text-lit"
            >
              {category.label}
            </h2>

            <div className="mt-4 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-3">
              <StatTile
                label="Rank"
                value={data.rank && data.rank !== "N/A" ? `#${data.rank}` : "—"}
              />
              <StatTile label="Sessions" value={data.games_played ?? 0} />
              <StatTile label="Best" value={Math.max(...scores)} />
            </div>

            <div className="mt-4 h-56 rounded-room border border-rule bg-surface p-4">
              <Line
                data={lineData(points, `${category.label} score`)}
                options={baseOptions({ yTitle: "Score" })}
              />
            </div>
          </section>
        );
      })}

      {untrained.length > 0 && (
        <p className="text-body-s text-ink-faint">
          Not trained yet: {untrained.map((c) => c.label).join(", ")}.
        </p>
      )}
    </div>
  );
}
