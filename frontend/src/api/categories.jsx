const BASE_URL = "http://127.0.0.1:8000/api";

export async function fetchCategories(token) {
  const res = await fetch(`${BASE_URL}/games/categories/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}
