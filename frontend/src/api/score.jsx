const BASE_URL = "http://127.0.0.1:8000/api/leaderboard/";

// Fetch the current user's progress for a specific game
export async function fetchUserGameProgress(gameName, token) {
  console.log("=== fetchUserGameProgress: Fetching for game:", gameName);
  console.log(
    "=== fetchUserGameProgress: Token:",
    token ? "Present" : "Missing"
  );

  const url = `${BASE_URL}user-progress/?game=${encodeURIComponent(gameName)}`;
  console.log("=== fetchUserGameProgress: URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("=== fetchUserGameProgress: Response status:", res.status);
    console.log(
      "=== fetchUserGameProgress: Response headers:",
      Object.fromEntries(res.headers)
    );

    if (!res.ok) {
      const errorData = await res.text();
      console.error("=== fetchUserGameProgress: Request failed:", errorData);
      throw new Error("Failed to fetch user game progress");
    }

    const responseData = await res.json();
    console.log("=== fetchUserGameProgress: Response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("=== fetchUserGameProgress: Network error:", error);
    throw error;
  }
}
