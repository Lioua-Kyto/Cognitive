import { useState, useEffect } from "react";
import { fetchCategories } from "../api/categories.jsx";

export default function useCategories(token = null) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultCategories = [
    { key: "memory", label: "Memory" },
    { key: "attention", label: "Attention" },
    { key: "speed", label: "Speed" },
    { key: "logic", label: "Logic" },
    { key: "language", label: "Language" },
    { key: "multi", label: "Multi-Domain" },
    { key: "competitive", label: "Competitive" },
  ];

  useEffect(() => {
    loadCategories();
  }, [token]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      let fetchedCategories = [];

      if (token) {
        fetchedCategories = await fetchCategories(token);
      }

      // Use API data if available, otherwise fallback to defaults
      if (!fetchedCategories || fetchedCategories.length === 0) {
        fetchedCategories = defaultCategories;
      }

      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(err.message);
      // Use fallback categories on error
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: loadCategories };
}
