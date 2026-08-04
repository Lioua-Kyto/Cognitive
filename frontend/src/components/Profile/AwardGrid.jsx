const longDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Earned achievements or badges.
 *
 * The list this replaces read `date_earned` from items the API serialises as
 * `earned_date`, so every card showed "Invalid Date", and badges additionally
 * read `badge.rarity.toLowerCase()` — a field that does not exist in the payload
 * at all, which throws the moment a visited profile has one.
 */
export default function AwardGrid({ items, empty, kind = "achievement" }) {
  if (items.length === 0) {
    return <p className="mt-4 text-body-s text-ink-faint">{empty}</p>;
  }

  return (
    <ul className="mt-4 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 bg-surface p-4">
          <span aria-hidden="true" className="text-heading-s leading-none">
            {item.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-s text-lit">{item.name}</p>
            {item.description && (
              <p className="mt-1 text-body-s text-ink-muted">
                {item.description}
              </p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <time
                data-figure
                dateTime={item.earned_date}
                className="text-body-s text-ink-faint"
              >
                {longDate(item.earned_date)}
              </time>
              {kind === "achievement" && item.points != null && (
                <span data-figure className="text-body-s text-beam">
                  +{item.points} XP
                </span>
              )}
              {item.is_rare && (
                <span className="font-label rounded-hair border border-rule-strong px-1.5 text-label text-ink-muted">
                  Rare
                </span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
