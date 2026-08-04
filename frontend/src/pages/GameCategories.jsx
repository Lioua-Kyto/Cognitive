import { Link, useNavigate } from "react-router-dom";
import { enhanceCategories } from "../components/Categories/CategoryData.jsx";
import useCategories from "../queries/useCategories.js";
import { useCategoryStats } from "../queries/useUserData.js";
import SectionDrawing from "../ui/SectionDrawing.jsx";
import { useSolarPosition } from "../ui/useSolarPosition.js";

export default function GameCategories() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { data: stats } = useCategoryStats();
  const beam = useSolarPosition();
  const navigate = useNavigate();

  if (categoriesLoading) {
    return (
      <div className="mx-auto max-w-frame px-4 py-storey-half">
        <p className="text-body text-ink-muted">Loading domains…</p>
      </div>
    );
  }

  const enhancedCategories = enhanceCategories(categories);

  // A room is lit if the user has played in that domain; its height is their
  // relative standing. Unlit is not a failure state, just unlit.
  const perCategory = stats?.category_stats ?? {};
  const bestScores = Object.values(perCategory).map((c) => c?.best_score ?? 0);
  const ceiling = Math.max(1, ...bestScores);

  const rooms = enhancedCategories.map((cat) => {
    const domain = perCategory[cat.key];
    const best = domain?.best_score ?? 0;
    return {
      key: cat.key,
      label: cat.label,
      lit: Boolean(domain?.has_played),
      strength: best / ceiling,
      value: best,
    };
  });

  return (
    <div className="py-storey-half">
      <section
        aria-labelledby="section-heading"
        className="mx-auto mb-storey w-full max-w-frame px-4"
      >
        <h1
          id="section-heading"
          className="font-display text-display-l text-lit"
        >
          Your mind in section
        </h1>
        <p className="mt-3 max-w-[52ch] text-body text-ink-muted">
          Seven domains, drawn as rooms. A lit room is one you have trained; the
          sun sits where it is in your day. Nothing here is a score to beat.
        </p>
        <SectionDrawing
          rooms={rooms}
          beam={beam}
          onSelectRoom={(room) => navigate(`/games/${room.key}`)}
          className="mt-8"
        />
      </section>

      <section
        aria-labelledby="domains-heading"
        className="mx-auto w-full max-w-frame px-4"
      >
        <h2 id="domains-heading" className="font-display text-heading-l text-lit">
          Pick a domain
        </h2>
        <p className="mt-3 max-w-[54ch] text-body text-ink-muted">
          Each trains something specific. Start where you feel the gap — or
          where you are curious.
        </p>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {enhancedCategories.map((cat) => (
            <li key={cat.key}>
              <Link
                to={`/games/${cat.key}`}
                className="group flex h-full flex-col gap-3 bg-surface p-6 transition-colors duration-hair hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-heading-s font-semibold text-lit group-hover:text-beam">
                    {cat.label}
                  </h3>
                  <img src={cat.icon} alt="" className="size-8 opacity-70" />
                </div>
                <p className="text-body-s text-ink">{cat.desc}</p>
                <p className="mt-auto pt-3 text-body-s text-ink-faint">
                  {cat.science}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
