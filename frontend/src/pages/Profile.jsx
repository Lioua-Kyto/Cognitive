import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { AuthContext } from "../context/AuthContext";
import {
  fetchProfile,
  fetchCountries,
  updateProfile,
  fetchAllAnalytics,
  fetchGameHistoryDetails,
} from "../api/profile.jsx";
import { AchievementsAPI } from "../api/achievements.jsx";
import { fetchCategories } from "../api/categories";
import { enhanceCategories } from "../components/Categories/CategoryData";
import { queryKeys } from "../queries/keys.js";
import Dashboard from "./Dashboard";
import AccountTab from "../components/Profile/AccountTab.jsx";
import AchievementsTab from "../components/Profile/AchievementsTab.jsx";
import AnalyticsTab from "../components/Profile/AnalyticsTab.jsx";
import ProfileHeader from "../components/Profile/ProfileHeader.jsx";
import ProgressTab from "../components/Profile/ProgressTab.jsx";
import Tabs from "../ui/Tabs.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EMPTY_ANALYTICS = { global_rank: null, global_total: 0, categories: {} };

export default function Profile() {
  const { token, user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeCategory, setActiveCategory] = useState("memory");

  const enabled = Boolean(token);

  const categoriesQ = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => fetchCategories(token),
    staleTime: 5 * 60_000,
  });
  const categories = enhanceCategories(categoriesQ.data ?? []);

  const countriesQ = useQuery({
    queryKey: ["countries"],
    queryFn: () => fetchCountries(token),
    enabled,
    staleTime: Infinity,
  });
  const countries = (countriesQ.data ?? []).map((country) => ({
    value: country.code,
    label: country.name,
  }));

  const analyticsQ = useQuery({
    queryKey: ["analytics", user?.id],
    queryFn: () => fetchAllAnalytics(token, categories),
    enabled: enabled && categories.length > 0,
  });
  const analytics = analyticsQ.data ?? EMPTY_ANALYTICS;

  /*
   * These were effects keyed on `activeTab`, which is what made the tab strip
   * load-bearing: the data only arrived because a click had happened. As
   * queries they are keyed on what they are about, so a refresh lands on the
   * same tab with the same data.
   */
  const detailsQ = useQuery({
    queryKey: ["gameHistory", activeCategory],
    queryFn: () => fetchGameHistoryDetails(token, activeCategory),
    enabled: enabled && activeTab === "progress",
  });

  const awardsQ = useQuery({
    queryKey: queryKeys.user.achievements(user?.id),
    queryFn: () => new AchievementsAPI().fetchAchievementsAndBadges(token),
    enabled: enabled && activeTab === "achievements",
  });

  const sessions = Object.values(analytics.categories).reduce(
    (total, category) => total + (category.games_played ?? 0),
    0
  );

  const bestDomain =
    Object.entries(analytics.categories)
      .filter(([, data]) => data.rank && data.rank !== "N/A")
      .sort(([, a], [, b]) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
      .map(
        ([key]) => categories.find((c) => c.key === key)?.label ?? key
      )[0] ?? null;

  const handleSave = async (data) => {
    await updateProfile(token, data);
    // Re-read rather than trust the update response, then push into context so
    // the navbar and header agree with the form immediately.
    const fresh = await fetchProfile(token);
    updateUser(fresh);
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile("me") });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="mx-auto flex max-w-frame flex-col gap-storey-half px-4 py-storey-half">
      <ProfileHeader
        user={user}
        globalRank={analytics.global_rank}
        sessions={sessions}
        bestDomain={bestDomain}
      />

      <Tabs
        label="Profile sections"
        active={activeTab}
        onChange={setActiveTab}
        panelClassName="pt-8"
        tabs={[
          {
            id: "dashboard",
            label: "Overview",
            content: <Dashboard />,
          },
          {
            id: "analytics",
            label: "Analytics",
            content: analyticsQ.isPending ? (
              <p className="text-body-s text-ink-muted">Loading…</p>
            ) : (
              <AnalyticsTab categories={categories} analytics={analytics} />
            ),
          },
          {
            id: "progress",
            label: "Progress",
            content: (
              <ProgressTab
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                details={detailsQ.data}
                loading={detailsQ.isPending}
              />
            ),
          },
          {
            id: "achievements",
            label: "Awards",
            content: (
              <AchievementsTab
                achievements={awardsQ.data?.achievements ?? []}
                badges={awardsQ.data?.badges ?? []}
                loading={awardsQ.isPending}
              />
            ),
          },
          {
            id: "account",
            label: "Account",
            content: (
              <AccountTab
                user={user}
                countries={countries}
                onSave={handleSave}
                onLogout={handleLogout}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
