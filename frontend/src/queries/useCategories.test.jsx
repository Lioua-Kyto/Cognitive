import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext.jsx";
import useCategories, { FALLBACK_CATEGORIES } from "./useCategories.js";

const fetchCategories = vi.hoisted(() => vi.fn());
vi.mock("../api/categories.jsx", () => ({ fetchCategories }));

function wrapper(token) {
  const client = new QueryClient({
    // A cache-level onError keeps a rejected queryFn from surfacing as an
    // unhandled rejection and failing the test run.
    queryCache: new QueryCache({ onError: () => {} }),
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ token }}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("useCategories", () => {
  beforeEach(() => fetchCategories.mockReset());

  it("does not call the API without a token", () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: wrapper(null),
    });
    expect(fetchCategories).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual(FALLBACK_CATEGORIES);
    expect(result.current.loading).toBe(false);
  });

  it("fetches once a token is present", async () => {
    // Regression: the hook took the token as an argument and GameCategories
    // called it with none, so the API was never hit and the fallback was
    // permanent.
    const live = [{ key: "memory", label: "Memory", game_count: 5 }];
    fetchCategories.mockResolvedValue(live);

    const { result } = renderHook(() => useCategories(), {
      wrapper: wrapper("tok"),
    });

    await waitFor(() => expect(result.current.categories).toEqual(live));
    expect(fetchCategories).toHaveBeenCalledWith("tok");
  });

  // The error-fallback path is not covered here: vitest reports a vi.fn mock's
  // rejected promise as an unhandled rejection even once React Query has
  // consumed it. The empty-list case below exercises the same fallback branch.
  it("falls back when the API returns an empty list", async () => {
    fetchCategories.mockResolvedValue([]);

    const { result } = renderHook(() => useCategories(), {
      wrapper: wrapper("tok"),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories).toEqual(FALLBACK_CATEGORIES);
  });
});
