import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>That page doesn&apos;t exist.</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
