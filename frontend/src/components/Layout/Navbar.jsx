import { NavLink, Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useSocial } from "../../context/SocialContext";
import { AuthContext } from "../../context/AuthContext.jsx";
import SocialSidebar from "../Navbar/SocialSidebar";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/games", label: "Domains" },
  { to: "/leaderboard", label: "Leaderboard" },
];

const ACCOUNT_LINKS = [
  { to: "/profile", label: "Profile" },
  { to: "/social", label: "Social" },
];

function navClass({ isActive }) {
  return [
    "font-label text-label transition-colors duration-hair",
    isActive ? "text-beam" : "text-ink-muted hover:text-ink",
  ].join(" ");
}

export default function Navbar() {
  const [showSocialSidebar, setShowSocialSidebar] = useState(false);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const { getTotalUnreadCount, friendRequests, isConnected } = useSocial();
  const totalNotifications = getTotalUnreadCount() + friendRequests.length;

  const handleNavigateToSocial = () => {
    setShowSocialSidebar(false);
    navigate("/social");
  };

  return (
    <>
      <SocialSidebar
        isOpen={showSocialSidebar}
        onClose={() => setShowSocialSidebar(false)}
        onNavigateToSocial={handleNavigateToSocial}
      />

      <header className="sticky top-0 border-b border-rule bg-ground/95 backdrop-blur-sm" style={{ zIndex: "var(--z-sticky)" }}>
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-frame items-center justify-between gap-6 px-4 py-4"
        >
          <Link
            to="/"
            className="font-display text-heading-s text-lit transition-colors duration-hair hover:text-beam"
          >
            Cognitive
          </Link>

          <div className="flex items-center gap-6">
            {/* NavLink rather than Link: the current page is now marked with
                aria-current, which the old nav never did. */}
            {PUBLIC_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}

            {token ? (
              <>
                {ACCOUNT_LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} className={navClass}>
                    {link.label}
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={() => setShowSocialSidebar(true)}
                  aria-label={
                    totalNotifications > 0
                      ? `Social hub, ${totalNotifications} unread`
                      : "Social hub"
                  }
                  className="relative flex size-9 items-center justify-center rounded-hair border border-rule-strong text-ink-muted transition-colors duration-hair hover:border-beam hover:text-beam"
                >
                  {/* A drawn glyph rather than an emoji: the old button was a
                      bare 🌐 with only a title attribute for a name. */}
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
                  </svg>
                  {totalNotifications > 0 && (
                    <span
                      className="tabular absolute -right-1 -top-1 min-w-4 rounded-full bg-beam px-1 text-center text-[0.625rem] leading-4 text-poche"
                      data-figure
                    >
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    title={isConnected ? "Connected" : "Reconnecting"}
                    className={`absolute -bottom-0.5 -left-0.5 size-2 rounded-full ${
                      isConnected ? "bg-positive" : "bg-shadow"
                    }`}
                  />
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="inline-flex h-9 items-center rounded-hair bg-beam px-4 font-medium text-poche transition-colors duration-hair hover:bg-beam-deep"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
