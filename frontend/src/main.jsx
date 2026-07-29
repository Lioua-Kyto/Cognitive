import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SocialProvider } from "./context/SocialContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

// Get user data from local storage or context
const getUserData = () => {
  try {
    const userData = localStorage.getItem("userData");
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    console.log("Getting user data from localStorage:", {
      userData: userData ? "present" : "missing",
      token: token ? "present" : "missing",
      parsedUserData: userData ? JSON.parse(userData) : null,
    });

    if (userData) {
      const parsed = JSON.parse(userData);
      return {
        token: token || parsed.token,
        userId: parsed.id || parsed.user_id || parsed.userId,
      };
    }

    return { token, userId: null };
  } catch (error) {
    console.error("Error getting user data:", error);
    return { token: localStorage.getItem("token"), userId: null };
  }
};

const userData = getUserData();

// Also try to get userId from token if available
const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.id || payload.sub;
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};

const finalUserId = userData.userId || getUserIdFromToken(userData.token);

console.log("Final userData for SocialProvider:", {
  token: userData?.token ? "present" : "missing",
  userId: finalUserId || "missing",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NotificationProvider>
      <SocialProvider token={userData?.token} userId={finalUserId}>
        <App />
      </SocialProvider>
    </NotificationProvider>
  </BrowserRouter>
);
