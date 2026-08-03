import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../api/auth";
import { AuthContext } from "../../context/AuthContext";
import Field, { Input } from "../../ui/Field.jsx";
import Button from "../../ui/Button.jsx";

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login: doLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    // The previous version had no try/catch, so a network failure surfaced as an
    // unhandled rejection and the form simply did nothing.
    try {
      const res = await login(email, password);
      if (res.access && res.refresh) {
        await doLogin(res.access, res.refresh);
        navigate(location.state?.from ?? "/");
        return;
      }
      setError(res.detail ?? "That email and password did not match.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5" noValidate>
      <div>
        <h1 className="font-display text-heading-l text-lit">Sign in</h1>
        <p className="mt-2 text-body-s text-ink-muted">
          To keep your progress across the seven domains.
        </p>
      </div>

      {/* Real labels. These fields used placeholder text as their only
          identifier, which is not an accessible name and disappears on input. */}
      <Field label="Email" required>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>

      <Field label="Password" required error={error || undefined}>
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>

      <Button type="submit" busy={submitting} size="lg">
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-body-s text-ink-muted">
        No account yet?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-beam underline transition-colors duration-hair hover:text-beam-deep"
        >
          Create one
        </button>
      </p>
    </form>
  );
}
