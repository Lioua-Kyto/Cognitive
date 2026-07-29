import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <h1>Something went wrong</h1>
        <p>
          The page hit an unexpected error. Reloading usually clears it — if it
          keeps happening, the details are in the browser console.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }
}
