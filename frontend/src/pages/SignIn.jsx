import { useContext, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import LoginForm from "../components/Auth/LoginForm.jsx";
import RegisterForm from "../components/Auth/RegisterForm.jsx";
import loginImage from "../assets/Pictures/LoginImage.jpeg";

/**
 * Sign-in as a real route rather than a wall.
 *
 * This markup used to live inside App and replaced the entire router whenever
 * there was no token, which is what made the whole site unbrowsable signed out.
 */
export default function SignIn() {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const [showRegister, setShowRegister] = useState(false);

  // Send an already-signed-in visitor back where they came from.
  if (token) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <div className="auth-layout">
      <div className="auth-form-section">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
      <div className="auth-image-section">
        <img src={loginImage} alt="" className="auth-image" />
      </div>
    </div>
  );
}
