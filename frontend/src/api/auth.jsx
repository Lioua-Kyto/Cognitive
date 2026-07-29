const BASE_URL = "http://127.0.0.1:8000/api/users/";

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json(); // Should return { access, refresh }
}

export async function refreshAccessToken(refresh) {
  const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  return res.json();
}

export async function register(data) {
  // Check if data is FormData (for file uploads) or regular object
  const isFormData = data instanceof FormData;

  const requestOptions = {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
  };

  // Only add Content-Type header for JSON data, let browser set it for FormData
  if (!isFormData) {
    requestOptions.headers = { "Content-Type": "application/json" };
  }

  const res = await fetch(`${BASE_URL}register/`, requestOptions);
  return res.json();
}

export async function fetchProfile(token) {
  const res = await fetch("http://127.0.0.1:8000/api/users/profile/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
