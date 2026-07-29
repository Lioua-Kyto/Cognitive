import { Link } from "react-router-dom";
import { enhanceCategories } from "../components/Categories/CategoryData.jsx";
import useCategories from "../hooks/useCategories.jsx";
import "./Styles/GameCategories.css";

export default function GameCategories() {
  const { categories, loading: categoriesLoading } = useCategories();

  if (categoriesLoading) {
    return (
      <div className="game-categories-container">
        <div className="loading-text">Loading categories...</div>
      </div>
    );
  }

  const enhancedCategories = enhanceCategories(categories);
  return (
    <div className="game-categories-container">
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
              <img src={cat.icon} alt={cat.label} />
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
