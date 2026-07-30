import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { AuthContext } from "../../context/AuthContext";

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: doLogin } = useContext(AuthContext);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.access && res.refresh) {
      await doLogin(res.access, res.refresh); // Pass both tokens to context
      setError("");
      navigate("/"); // Navigate to home after successful login
    } else if (res.detail) {
      setError(res.detail);
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">Login</h2>

        <div className="auth-form-group">
          <input
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
        </div>

        <div className="auth-form-group">
          <input
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
          />
        </div>

        <button className="auth-btn" type="submit">
          Login
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={onSwitchToRegister}
        >
          Create an Account
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}
