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
      <div className="game-categories-container">
        <div className="loading-text">Loading categories...</div>
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
    <div className="game-categories-container">
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
          className="mt-8 h-[clamp(180px,28vw,320px)]"
        />
      </section>

      <div className="game-categories-title">Choose Your Training Path</div>
      <div className="game-categories-subtitle">
        Each category targets a different aspect of your cognitive abilities.
        <br />
        Explore and discover the games that best fit your goals!
      </div>
      <div className="game-categories-stack">
        {enhancedCategories.map((cat) => (
          <Link
            to={`/games/${cat.key}`}
            className="category-card"
            data-category={cat.key}
            key={cat.key}
          >
            <div className="category-card-icon">
              <img src={cat.icon} alt="" />
            </div>
            <div className="category-card-content">
              <h3>{cat.label}</h3>
              <div className="category-card-desc">{cat.desc}</div>
              <div className="category-card-science">{cat.science}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="game-categories-note">
        <small>
          Not sure where to start? Try <b>Memory</b> for a classic challenge, or{" "}
          <b>Attention</b> to boost your focus!
        </small>
      </div>
    </div>
  );
}
