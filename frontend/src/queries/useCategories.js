import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchCategories } from "../api/categories.jsx";
import { queryKeys } from "./keys.js";

// Mirrors games.models.Game.CATEGORY_CHOICES. Used until the request resolves
// and if it fails, so the nav never renders empty.
export const FALLBACK_CATEGORIES = [
  { key: "memory", label: "Memory" },
  { key: "attention", label: "Attention" },
  { key: "speed", label: "Speed" },
  { key: "logic", label: "Logic" },
  { key: "language", label: "Language" },
  { key: "multi", label: "Multi-Domain" },
  { key: "competitive", label: "Competitive" },
];

/**
 * Categories with their live game counts.
 *
 * The old hook took a token as an argument and only fetched when one was passed,
 * but GameCategories called it with no argument — so it always served the
 * hardcoded fallback and never hit the API. The token comes from context now.
 */
export default function useCategories() {
  const { token } = useContext(AuthContext);

  const query = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => fetchCategories(token),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  return {
    categories: query.data?.length ? query.data : FALLBACK_CATEGORIES,
    loading: query.isPending && Boolean(token),
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
