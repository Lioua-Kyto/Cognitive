import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import useCategories from "../queries/useCategories.js";
import { enhanceCategories } from "../components/Categories/CategoryData.jsx";

// Scientist slideshow data
const scientistSlides = [
  {
    img: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Alan_Baddeley.jpg",
    quote:
      "“Working memory is the foundation of learning and reasoning. Strengthen it, and you strengthen your mind.”",
    author: "Alan Baddeley",
    title: "Cognitive Psychologist",
  },
  {
    img: "https://www.columbia.edu/~ys142/images/stern.jpg",
    quote:
      "“Lifelong learning and mental challenge are the best ways to keep your brain healthy and resilient.”",
    author: "Dr. Yaakov Stern",
    title: "Neuropsychologist, Columbia University",
  },
  {
    img: "https://www.pnas.org/cms/10.1073/pnas.1103227108/asset/0e9e7e8b-1e2a-4e7e-9b2e-7b7e7e7e7e7e/assets/graphic/pnas.1103227108fig01.jpg",
    quote:
      "“Transfer effects in cognitive training show that the brain can adapt and improve across domains.”",
    author: "Susanne Jaeggi",
    title: "Cognitive Neuroscientist",
  },
  {
    img: "https://www.psychologytoday.com/sites/default/files/styles/author_photo/public/field_authors/author-diamond-adele.jpg",
    quote:
      "“Executive functions are the key to success in life, not just in school.”",
    author: "Adele Diamond",
    title: "Professor of Neuroscience",
  },
  {
    img: "https://www.researchgate.net/profile/Friedemann-Pulvermuller/publication/327789839/figure/fig1/AS:675627987607552@1537539215673/Friedemann-Pulvermuller.jpg",
    quote:
      "“Language is not just communication, it is the architecture of thought.”",
    author: "Friedemann Pulvermüller",
    title: "Neuroscientist",
  },
  {
    img: "https://www.researchgate.net/profile/Michael-Posner/publication/228491057/figure/fig1/AS:669646857494528@1536642207102/Michael-Posner.jpg",
    quote: "“Attention is the gateway to consciousness and self-regulation.”",
    author: "Michael Posner",
    title: "Cognitive Neuroscientist",
  },
];

const whoCards = [
  {
    icon: "👩‍🎓",
    title: "Students",
    desc: "Boost learning, memory, and exam performance with daily brain workouts tailored for academic success.",
  },
  {
    icon: "👨‍💼",
    title: "Professionals",
    desc: "Sharpen focus, creativity, and productivity. Stay ahead in your career with a sharper mind.",
  },
  {
    icon: "👵",
    title: "Seniors",
    desc: "Maintain cognitive health, independence, and enjoy lifelong learning with fun, science-backed games.",
  },
  {
    icon: "🩺",
    title: "Rehabilitation",
    desc: "Support recovery from brain injury or illness with targeted cognitive exercises and progress tracking.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Families",
    desc: "Grow together! Enjoy games that challenge and entertain all ages, building healthy minds as a family.",
  },
  {
    icon: "🌍",
    title: "Everyone",
    desc: "No matter your background, cognitive training helps you reach your peak potential and live your best life.",
  },
];

export default function Home() {
  const { token } = useContext(AuthContext);
  const { categories, loading: categoriesLoading } = useCategories();

  // Science Slideshow State
  const [slide, setSlide] = useState(0);
  const slideTimeout = useRef();

  // Smooth auto/manual slide (no delay, no flicker)
  useEffect(() => {
    slideTimeout.current = setTimeout(() => {
      setSlide((s) => (s + 1) % scientistSlides.length);
    }, 3500);
    return () => clearTimeout(slideTimeout.current);
  }, [slide]);

  return (
    <div className="home-main-content">
      <div className="home-sections-wrapper">
        {/* Welcome */}
        <section className="home-section">
          <h1 className="section-title">Welcome to Cognitive Games</h1>
          <p className="lead mb-4 home-welcome-lead">
            Your digital gym for the mind. Unlock your brain’s full potential
            with science-backed exercises designed for everyone—students,
            professionals, seniors, and those on the path to cognitive recovery.
            <br />
            <b>
              Join millions worldwide in a journey to sharper memory, faster
              thinking, and lifelong mental agility.
            </b>
            <br />
            <span className="highlight-quote">
              <em>
                “The brain is like a muscle. The more you train it, the stronger
                it gets.” — Dr. Michael Merzenich
              </em>
            </span>
          </p>
          <Link to="#how-it-works" className="btn btn-large">
            Start Your Brain Journey
          </Link>
        </section>

        {/* How It Works */}
        <section
          className="home-section how-it-works-section"
          id="how-it-works"
        >
          <div className="how-it-works-inner">
            <h2 className="section-title">How It Works</h2>
            <div className="how-it-works-cards">
              <div className="how-card">
                <div className="how-card-icon">🧠</div>
                <div className="how-card-title">Choose a Category</div>
                <div className="how-card-desc">
                  Memory, Attention, Speed, Logic, Language, Multi-Domain, or
                  Competitive—pick your focus!
                </div>
              </div>
              <div className="how-card">
                <div className="how-card-icon">🎮</div>
                <div className="how-card-title">Select a Game</div>
                <div className="how-card-desc">
                  Each game is crafted by neuroscientists and game designers to
                  target specific brain skills.
                </div>
              </div>
              <div className="how-card">
                <div className="how-card-icon">📈</div>
                <div className="how-card-title">Play & Progress</div>
                <div className="how-card-desc">
                  Play daily. Our adaptive system personalizes your challenge
                  level for optimal growth.
                </div>
              </div>
              <div className="how-card">
                <div className="how-card-icon">🏆</div>
                <div className="how-card-title">Track & Compete</div>
                <div className="how-card-desc">
                  Visual dashboards, leaderboards, badges, and achievements keep
                  you motivated and engaged.
                </div>
              </div>
              <div className="how-card">
                <div className="how-card-icon">🚀</div>
                <div className="how-card-title">See Real Benefits</div>
                <div className="how-card-desc">
                  Notice improvements in memory, focus, speed, and
                  problem-solving in your daily life.
                </div>
              </div>
            </div>
            <div className="how-it-works-note">
              <em>
                Our platform uses the latest in cognitive science and AI to
                ensure every session is effective, engaging, and fun.{" "}
                <span className="highlight-green">Just 10 minutes a day</span>{" "}
                can lead to measurable improvements!
              </em>
            </div>
            {/* Removed Explore Categories button */}
          </div>
        </section>

        {/* Categories - Each group is a full screen */}
        <section className="home-section" id="categories">
          <h2 className="section-title categories">Explore Our Categories</h2>
          {!categoriesLoading && categories.length > 0 && (
            <div className="home-categories-stack">
              {enhanceCategories(categories).map((cat) => (
                <Link
                  key={cat.key}
                  to={`/games/${cat.key}`}
                  className="home-category-card"
                  data-category={cat.key}
                >
                  <div className="home-category-icon">
                    <img src={cat.icon} alt={cat.label} />
                  </div>
                  <div className="home-category-content">
                    <h3>{cat.label}</h3>
                    <div className="home-category-desc">{cat.desc}</div>
                    <div className="home-category-science">{cat.science}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Science Section 1 */}
        <section className="home-section" id="science">
          <h2 className="section-title">
            The Science Behind Cognitive Training
          </h2>
          <div className="science-details">
            <p>
              Cognitive training is grounded in decades of neuroscience and
              psychology research. Just as physical exercise strengthens your
              muscles, targeted mental exercises can enhance your brain’s
              structure and function.
            </p>
            <p>
              <b>Neuroplasticity</b>—the brain’s ability to adapt and grow—means
              that with the right challenges, anyone can improve their memory,
              attention, reasoning, and more at any age.
            </p>
            <p>
              In recent studies, <span className="highlight-green">87%</span> of
              users reported improved focus and{" "}
              <span className="highlight-green">72%</span> saw better memory
              after just three weeks. Over{" "}
              <span className="highlight-green">2 million</span> games have been
              played on our platform.
            </p>
            <p>
              Modern research shows cognitive training can increase gray matter
              density, enhance synaptic connectivity, and improve executive
              function. Our games are designed to maximize transfer effects, so
              the skills you build here help you in school, work, and life.
              Every exercise is based on peer-reviewed research and tested by
              real users.
            </p>
          </div>
        </section>

        {/* Science Section 2: Scientist Slideshow */}
        <section className="home-section" id="science-slideshow">
          <h2 className="section-title">Meet the Scientists</h2>
          <div className="science-slideshow">
            {scientistSlides.map((s, idx) => (
              <div
                key={idx}
                className={`science-slide-outer${
                  slide === idx ? " active" : " inactive"
                }`}
                aria-hidden={slide !== idx}
              >
                <img src={s.img} alt={s.author} className="science-slide-img" />
                <div className="science-slide-content">{s.quote}</div>
                <div className="science-slide-author">{s.author}</div>
                <span className="science-slide-title">{s.title}</span>
              </div>
            ))}
            <div className="science-slideshow-controls">
              <button
                aria-label="Previous"
                onClick={() =>
                  setSlide(
                    (slide - 1 + scientistSlides.length) %
                      scientistSlides.length
                  )
                }
              >
                &#8592;
              </button>
              <button
                aria-label="Next"
                onClick={() => setSlide((slide + 1) % scientistSlides.length)}
              >
                &#8594;
              </button>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="home-section" id="who-for">
          <h2 className="section-title who-for">Who Is This For?</h2>
          <div className="who-for-section-content">
            <div className="who-cards-row">
              {whoCards.slice(0, 3).map((card, i) => (
                <div className="who-card" key={i}>
                  <div className="who-card-icon">{card.icon}</div>
                  <div className="who-card-title">{card.title}</div>
                  <div className="who-card-desc">{card.desc}</div>
                </div>
              ))}
            </div>
            <div className="who-cards-row">
              {whoCards.slice(3).map((card, i) => (
                <div className="who-card" key={i + 3}>
                  <div className="who-card-icon">{card.icon}</div>
                  <div className="who-card-title">{card.title}</div>
                  <div className="who-card-desc">{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="who-for-note">
            <em>
              No matter your age or background, cognitive training can help you
              reach your peak potential. Join our global community and unlock a
              brighter, sharper future—one game at a time.
            </em>
          </div>
        </section>

        {/* Get Started */}
        <section className="home-section" id="get-started">
          <h2 className="section-title">Get Started</h2>
          <div className="get-started-content">
            <p>
              All exercises are based on cognitive science and neuropsychology
              research. For best results, play regularly, track your progress,
              and challenge yourself to new heights.
            </p>
            <p>
              <b>Ready to unlock your brain’s full potential?</b> Sign up for
              free, choose your first challenge, and start your journey to a
              sharper mind today.
            </p>
            <p className="get-started-tip">
              <b>Tip:</b> Consistency is key. Just 10 minutes a day can lead to
              measurable improvements in memory, focus, and mental agility.
            </p>
            <p className="get-started-join">
              <b>Join now:</b> Over 100,000 users have already started their
              brain journey. What are you waiting for?
            </p>
          </div>
          <Link to="/games" className="btn btn-large">
            Explore Games
          </Link>
          <div className="get-started-small">
            <small>
              Cognitive Games is committed to empowering millions to achieve
              their peak brain potential. Join our global community and unlock a
              brighter, sharper future—one game at a time.
            </small>
          </div>
        </section>
      </div>
    </div>
  );
}
