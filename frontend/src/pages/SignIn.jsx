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
    <div className="mx-auto grid max-w-page gap-storey px-4 py-storey-half lg:grid-cols-2 lg:items-center">
      <div className="flex justify-center lg:justify-start">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
      <div className="hidden overflow-hidden rounded-room border border-rule lg:block">
        <img src={loginImage} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
