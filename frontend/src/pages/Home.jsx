import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import useCategories from "../queries/useCategories.js";
import { enhanceCategories } from "../components/Categories/CategoryData.jsx";
import SectionDrawing from "../ui/SectionDrawing.jsx";
import { useScrollBeam } from "../ui/useScrollBeam.js";
import { roomUnderBeam } from "../ui/useSolarPosition.js";

const STEPS = [
  {
    n: "01",
    title: "Pick a domain",
    body: "Seven of them. Start where you feel the gap, or where you are curious.",
  },
  {
    n: "02",
    title: "Train for a few minutes",
    body: "Short sessions. The difficulty follows the level you have reached, not the clock.",
  },
  {
    n: "03",
    title: "Watch the room light",
    body: "Each domain is measured on its own, so you see the shape of your mind rather than one number.",
  },
];

export default function Home() {
  const { token } = useContext(AuthContext);
  const { categories } = useCategories();
  const { ref, progress } = useScrollBeam({ distance: 2 });

  const enhanced = enhanceCategories(categories);

  // On the marketing surface the rooms light with the scroll rather than with
  // user data — a signed-out visitor has none, and the reveal is the argument.
  const reached = roomUnderBeam(progress, enhanced.length) ?? enhanced.length - 1;
  const rooms = enhanced.map((cat, i) => ({
    key: cat.key,
    label: cat.label,
    // The reveal runs in both motion modes; reduced motion changes how it moves,
    // never whether it happens. The first room is lit at progress 0 so the
    // drawing never reads as empty.
    lit: i <= reached,
    strength: 0.35 + ((i * 37) % 55) / 100,
    value: cat.game_count ? `${cat.game_count}` : "—",
  }));

  return (
    <div className="text-ink">
      {/* First viewport: the thesis, not a header. One scroll gesture walks the
          sun across all seven domains and teaches the whole product. */}
      <section
        ref={ref}
        className="flex min-h-screen flex-col justify-center overflow-hidden px-4"
        aria-labelledby="home-title"
      >
        <div className="mx-auto w-full max-w-frame">
          <p className="font-label text-label text-beam">Cognitive</p>
          <h1
            id="home-title"
            className="font-display mt-4 max-w-[16ch] text-display-xl text-lit"
          >
            Your mind, drawn in section
          </h1>
          <p className="mt-6 max-w-[54ch] text-body text-ink-muted">
            Seven cognitive domains, each measured on its own. Train one and its
            room lights up. What you get is not a score — it is the shape of
            where you are strong and where you are not.
          </p>

          <SectionDrawing
            rooms={rooms}
            beam={progress}
            className="mt-10 h-[clamp(200px,30vh,340px)]"
          />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to={token ? "/games" : "/signin"}
              className="inline-flex h-12 items-center rounded-hair bg-beam px-6 font-medium text-poche transition-colors duration-hair hover:bg-beam-deep"
            >
              {token ? "Go to your domains" : "Start training"}
            </Link>
            <Link
              to="/games"
              className="inline-flex h-12 items-center rounded-hair border border-rule-strong px-6 text-ink transition-colors duration-hair hover:border-beam hover:text-beam"
            >
              Browse the exercises
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-frame px-4 py-storey" aria-labelledby="how-title">
        <h2 id="how-title" className="font-display text-display-l text-lit">
          How it works
        </h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t border-rule pt-5">
              <span className="tabular text-body-s text-beam" data-figure>
                {step.n}
              </span>
              <h3 className="mt-3 text-heading-s font-semibold text-lit">
                {step.title}
              </h3>
              <p className="mt-2 text-body-s text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The domains, as real catalogue data rather than decoration */}
      <section className="mx-auto max-w-frame px-4 py-storey" aria-labelledby="domains-title">
        <h2 id="domains-title" className="font-display text-display-l text-lit">
          Seven domains
        </h2>
        <p className="mt-4 max-w-[54ch] text-body text-ink-muted">
          Each one trains something specific. None of them claims to make you
          smarter in general — that is not a thing training can promise.
        </p>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {enhanced.map((cat) => (
            <li key={cat.key}>
              <Link
                to={`/games/${cat.key}`}
                className="group flex h-full flex-col gap-2 bg-surface p-6 transition-colors duration-hair hover:bg-surface-raised"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-label text-label text-ink-muted group-hover:text-beam">
                    {cat.label}
                  </span>
                  <span className="tabular text-body-s text-ink-faint" data-figure>
                    {cat.game_count ?? 0}
                  </span>
                </div>
                <p className="text-body-s text-ink">{cat.desc}</p>
                <p className="mt-auto pt-3 text-body-s text-ink-faint">{cat.science}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-frame px-4 py-storey" aria-labelledby="start-title">
        <div className="border-t border-rule-strong pt-10">
          <h2 id="start-title" className="font-display max-w-[18ch] text-display-l text-lit">
            Light the first room
          </h2>
          <p className="mt-4 max-w-[52ch] text-body text-ink-muted">
            An account keeps your progress and your place in each domain. The
            exercises themselves are free to browse before you decide.
          </p>
          <Link
            to={token ? "/games" : "/signin"}
            className="mt-8 inline-flex h-12 items-center rounded-hair bg-beam px-6 font-medium text-poche transition-colors duration-hair hover:bg-beam-deep"
          >
            {token ? "Go to your domains" : "Create an account"}
          </Link>
        </div>
      </section>
    </div>
  );
}
