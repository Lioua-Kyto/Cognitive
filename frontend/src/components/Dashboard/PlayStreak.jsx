const DAY_MS = 24 * 60 * 60 * 1000;

const isoDate = (date) => date.toISOString().split("T")[0];

/**
 * The last seven days of practice.
 *
 * The version this replaces built its window from `i = 4` down to `i = -2`,
 * which is four days back to two days *ahead* — so a third of the strip was the
 * future, drawn as days you had failed to practise. It also carried its three
 * pieces of state in useState and refilled them from an effect on every render
 * of the parent, for values that are a pure function of the props.
 */
export default function PlayStreak({ userStats }) {
  const played = new Set(userStats?.playedDates ?? []);
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_MS);
    return {
      iso: isoDate(date),
      label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
      full: date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      trained: played.has(isoDate(date)),
    };
  });

  return (
    <section aria-labelledby="streak-heading">
      <h3 id="streak-heading" className="font-label text-label text-ink-faint">
        Practice
      </h3>

      <div className="mt-3 flex flex-wrap items-end gap-8">
        <div className="flex gap-6">
          <p>
            <span data-figure className="text-figure text-lit">
              {userStats?.currentStreak ?? 0}
            </span>
            <span className="font-label ml-2 text-label text-ink-faint">
              current
            </span>
          </p>
          <p>
            <span data-figure className="text-figure text-lit">
              {userStats?.longestStreak ?? 0}
            </span>
            <span className="font-label ml-2 text-label text-ink-faint">
              longest
            </span>
          </p>
        </div>

        <ul className="flex gap-1.5">
          {days.map((day) => (
            <li key={day.iso} className="flex flex-col items-center gap-1.5">
              {/* A lit day is a room with the sun in it. An unlit one is not a
                  failure, just unlit. */}
              <span
                className={`block size-7 rounded-hair ${
                  day.trained ? "bg-beam" : "border border-rule bg-surface"
                }`}
              />
              <span className="font-label text-label text-ink-faint">
                {day.label}
              </span>
              <span className="sr-only">
                {day.full} — {day.trained ? "trained" : "no session"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
