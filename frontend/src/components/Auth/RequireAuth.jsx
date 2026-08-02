import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

/**
 * Gate for routes that genuinely need an account.
 *
 * The app used to return the login form instead of the router whenever there was
 * no token, so nothing at all was browsable signed out. Browsing is public now;
 * only the surfaces that are about *you* — or that write — sit behind this.
 */
export default function RequireAuth({ children, reason }) {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  if (token) return children;

  return (
    <div className="mx-auto flex max-w-frame flex-col items-start gap-4 px-4 py-storey">
      <h1 className="font-display text-display-l text-lit">Sign in to continue</h1>
      <p className="max-w-[52ch] text-body text-ink-muted">
        {reason ?? "This part of Cognitive is about your own progress, so it needs an account."}
      </p>
      <Link
        to="/signin"
        state={{ from: location.pathname }}
        className="mt-2 inline-flex h-10 items-center rounded-hair bg-beam px-4 font-medium text-poche transition-colors duration-hair hover:bg-beam-deep"
      >
        Sign in or create an account
      </Link>
      <Link to="/games" className="text-body-s text-ink-muted underline hover:text-ink">
        Keep browsing the exercises instead
      </Link>
    </div>
  );
}
