import { API_BASE } from "./config.js";
const BASE_URL = API_BASE;

export async function fetchCategories(token) {
  const res = await fetch(`${BASE_URL}/games/categories/`, {
    // Public endpoint: sending the header only when signed in keeps an expired
    // token from turning a browsable page into a 401.
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}
