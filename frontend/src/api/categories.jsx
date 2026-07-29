import { API_BASE } from "./config.js";
const BASE_URL = API_BASE;

export async function fetchCategories(token) {
  const res = await fetch(`${BASE_URL}/games/categories/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}
