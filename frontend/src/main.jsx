import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
// Self-hosted variable fonts: no third-party request, one file per family, and
// the wdth axis gives the display register without a second download.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/chivo-mono";
// Bootstrap is gone (docs/design-direction.md §8). It had to go now rather than
// at the end of the rebuild: Bootstrap ships unlayered CSS, and unlayered styles
// beat @layer styles in the cascade no matter the import order, so every token in
// theme.css was inert while it was loaded.
import "./styles/theme.css";

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
