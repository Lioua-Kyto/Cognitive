// Create a utility function (in utils folder or directly in the Profile.jsx file)
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // Use your backend base URL (same as in your API calls)
  const BASE_URL = "http://localhost:8000"; // or whatever your backend URL is
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
