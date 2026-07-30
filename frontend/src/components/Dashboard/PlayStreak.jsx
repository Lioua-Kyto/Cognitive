import { useState, useEffect } from "react";

const PlayStreak = ({ userStats }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState([]);

  useEffect(() => {
    // Generate 7 days: 4 days ago to 2 days ahead
    const today = new Date();
    const weekActivity = [];

    for (let i = 4; i >= -2; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekActivity.push({
        date: date.toISOString().split("T")[0],
        hasActivity:
          userStats?.playedDates?.includes(date.toISOString().split("T")[0]) ||
          false,
      });
    }

    setWeeklyActivity(weekActivity);
    setCurrentStreak(userStats?.currentStreak || 0);
    setLongestStreak(userStats?.longestStreak || 0);
  }, [userStats]);

  return (
    <div className="play-streak-container">
      <h3 className="streak-title">Play Streak</h3>

      <div className="streak-stats">
        <div className="streak-stat">
          <div className="streak-number">{currentStreak}</div>
          <div className="streak-label">Current</div>
        </div>
        <div className="streak-stat">
          <div className="streak-number">{longestStreak}</div>
          <div className="streak-label">Longest</div>
        </div>
      </div>

      <div className="weekly-activity">
        {weeklyActivity.map((day, index) => (
          <div
            key={index}
            className={`activity-day ${day.hasActivity ? "active" : ""}`}
            title={day.date}
          >
            <div className="activity-flame">
              {day.hasActivity ? "🔥" : "⚪"}
            </div>
            <div className="activity-date">
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayStreak;
