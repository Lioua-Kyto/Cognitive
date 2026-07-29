import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  CategoryLeaderboard,
  GameLeaderboard,
  GlobalLeaderboard,
} from "../api/leaderboard.jsx";
import { queryKeys } from "./keys.js";

/**
 * Global board, or a single category when `category` is set.
 * Passing null/"global" selects the global board.
 */
export function useLeaderboard(category) {
  const { token } = useContext(AuthContext);
  const isGlobal = !category || category === "global";

  return useQuery({
    queryKey: isGlobal
      ? queryKeys.leaderboard.global()
      : queryKeys.leaderboard.category(category),
    queryFn: () =>
      isGlobal
        ? GlobalLeaderboard.fetch(token)
        : CategoryLeaderboard.fetch(category, token),
    enabled: Boolean(token),
  });
}

export function useGameLeaderboard(gameName) {
  const { token } = useContext(AuthContext);

  return useQuery({
    queryKey: queryKeys.leaderboard.game(gameName),
    queryFn: () => GameLeaderboard.fetch(gameName, token),
    enabled: Boolean(token && gameName),
  });
}
