import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSocial } from "../../context/SocialContext";
import SocialSidebar from "../Navbar/SocialSidebar";

export default function Navbar() {
  const [showSocialSidebar, setShowSocialSidebar] = useState(false);
  const navigate = useNavigate();

  const { getTotalUnreadCount, friendRequests, isConnected } = useSocial();

  const totalNotifications = getTotalUnreadCount() + friendRequests.length;

  const handleNavigateToSocial = () => {
    setShowSocialSidebar(false);
    navigate("/social");
  };

  return (
    <>
      {/* Modern Social Sidebar */}
      <SocialSidebar
        isOpen={showSocialSidebar}
        onClose={() => setShowSocialSidebar(false)}
        onNavigateToSocial={handleNavigateToSocial}
      />

      <nav className="navbar neon-navbar">
        <div className="navbar-inner">
          <Link className="navbar-brand" to="/">
            🧠 Cognitive Games
          </Link>
          <div className="navbar-links">
            <Link className="navbar-link " to="/">
              Home
            </Link>
            <Link className="navbar-link" to="/games">
              Games
            </Link>
            <Link className="navbar-link" to="/leaderboard">
              Leaderboard
            </Link>
            <Link className="navbar-link" to="/profile">
              Profile
            </Link>
            <Link className="navbar-link" to="/social">
              Social
            </Link>

            {/* Modern Social Button */}
            <button
              className={`navbar-social-btn ${
                isConnected ? "connected" : "disconnected"
              }`}
              onClick={() => setShowSocialSidebar(true)}
              title="Social Hub"
            >
              <span className="social-icon">🌐</span>
              {totalNotifications > 0 && (
                <span className="social-notification-count">
                  {totalNotifications > 99 ? "99+" : totalNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
