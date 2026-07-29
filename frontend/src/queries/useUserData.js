import { useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  fetchGameStats,
  fetchLevelStats,
  fetchRecentGames,
} from "../api/profile.jsx";
import { queryKeys, staleAfterGameSubmission } from "./keys.js";

function useAuthed(keyFn, queryFn, options = {}) {
  const { token, user } = useContext(AuthContext);
  const userId = user?.id;

  return useQuery({
    queryKey: keyFn(userId),
    queryFn: () => queryFn(token),
    enabled: Boolean(token && userId),
    ...options,
  });
}

export function useUserStats() {
  return useAuthed(queryKeys.user.stats, fetchGameStats);
}

export function useRecentGames() {
  return useAuthed(queryKeys.user.recentGames, fetchRecentGames);
}

export function useLevelStats(level) {
  const { token } = useContext(AuthContext);

  return useQuery({
    queryKey: ["levelStats", level],
    queryFn: () => fetchLevelStats(token, level),
    enabled: Boolean(token && level),
    staleTime: 5 * 60_000,
  });
}

/**
 * Invalidate everything a finished game makes stale.
 *
 * Replaces the pattern of firing a window CustomEvent and calling
 * window.location.reload() to get fresh numbers on screen.
 */
export function useInvalidateAfterGame() {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return () => {
    for (const key of staleAfterGameSubmission(user?.id)) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}
