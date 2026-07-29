import { Routes, Route } from "react-router-dom";
import { useContext, useState, lazy, Suspense } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { LevelUpProvider } from "./context/LevelUpContext.jsx";
import { SocialProvider } from "./context/SocialContext.jsx";
import { useLevelTracker } from "./hooks/useLevelTracker.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LoginForm from "./components/Auth/LoginForm.jsx";
import RegisterForm from "./components/Auth/RegisterForm.jsx";
import Navbar from "./components/Layout/Navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import AchievementNotification from "./components/AchievementNotification.jsx";
import LevelUpNotification from "./components/LevelUpNotification.jsx";
import loginImage from "./assets/Pictures/LoginImage.jpeg";
import "./layout.css";

// Route-level code splitting. GameScreen in particular statically pulled in all
// 25 game components and their audio, so every visitor downloaded the whole
// catalogue to reach the home page.
const Home = lazy(() => import("./pages/Home.jsx"));
const GameCategories = lazy(() => import("./pages/GameCategories.jsx"));
const GameList = lazy(() => import("./pages/GameList.jsx"));
const GameScreen = lazy(() => import("./pages/GameScreen.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const ProfileVisit = lazy(() => import("./pages/ProfileVisit.jsx"));
const Social = lazy(() => import("./pages/Social.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function RouteFallback() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );
}

function MainApp() {
  const { token, user, isLoading } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);

  // Initialize level tracking
  useLevelTracker();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token)
    return (
      <div className="auth-layout">
        <div className="auth-form-section">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
        <div className="auth-image-section">
          <img src={loginImage} alt="" className="auth-image" />
        </div>
      </div>
    );

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content scrollable-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<GameCategories />} />
            <Route path="/games/:category" element={<GameList />} />
            <Route
              path="/games/:category/:game"
              element={<GameScreen token={token} />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<ProfileVisit />} />
            <Route path="/social" element={<Social />} />
            <Route
              path="/leaderboard"
              element={<Leaderboard user={user} token={token} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </main>
      <AchievementNotification />
      <LevelUpNotification />
    </div>
  );
}

/** Feeds SocialProvider the live auth state instead of a stale localStorage read. */
function SocialBridge({ children }) {
  const { token, user } = useContext(AuthContext);
  return (
    <SocialProvider token={token} userId={user?.id}>
      {children}
    </SocialProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocialBridge>
          <LevelUpProvider>
            <MainApp />
          </LevelUpProvider>
        </SocialBridge>
      </AuthProvider>
    </ErrorBoundary>
  );
}
