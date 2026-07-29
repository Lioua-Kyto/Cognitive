import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

// SocialProvider used to be mounted here with a token read from localStorage at
// module scope — once, before login. It now lives inside AuthProvider in App so
// it sees the live token.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
