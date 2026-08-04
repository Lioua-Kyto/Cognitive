import { Routes, Route } from "react-router-dom";
import { useContext, lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./queries/client.js";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { LevelUpProvider } from "./context/LevelUpContext.jsx";
import { SocialProvider } from "./context/SocialContext.jsx";
import { useLevelTracker } from "./hooks/useLevelTracker.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import RequireAuth from "./components/Auth/RequireAuth.jsx";
import Navbar from "./components/Layout/Navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import AchievementNotification from "./components/AchievementNotification.jsx";
import LevelUpNotification from "./components/LevelUpNotification.jsx";
import Toaster from "./ui/Toaster.jsx";

// Route-level code splitting. GameScreen in particular statically pulled in all
// 25 game components and their audio, so every visitor downloaded the whole
// catalogue to reach the home page.
const Home = lazy(() => import("./pages/Home.jsx"));
const SignIn = lazy(() => import("./pages/SignIn.jsx"));
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

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content scrollable-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public: the marketing surface and the whole catalogue. Someone
                deciding whether to sign up needs to see what they would get. */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/games" element={<GameCategories />} />
            <Route path="/games/:category" element={<GameList />} />
            <Route
              path="/leaderboard"
              element={<Leaderboard user={user} token={token} />}
            />
            <Route path="/profile/:username" element={<ProfileVisit />} />

            {/* Playing writes a score, so it needs an account. */}
            <Route
              path="/games/:category/:game"
              element={
                <RequireAuth reason="Playing records your score and progress, so it needs an account.">
                  <GameScreen token={token} />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/social"
              element={
                <RequireAuth reason="Friends, presence and chat need an account.">
                  <Social />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </main>
      <AchievementNotification />
      <LevelUpNotification />
      <Toaster />
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

const queryClient = createQueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocialBridge>
            <LevelUpProvider>
              <MainApp />
            </LevelUpProvider>
          </SocialBridge>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
