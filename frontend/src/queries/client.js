import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cognitive data changes only when the user plays; refetching on every
        // window focus is noise. Submissions invalidate explicitly instead.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A 401/403 will not fix itself on retry — the token refresh path
          // handles that.
          if (/\b(401|403|404)\b/.test(String(error?.message))) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
