import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { register } from "../../api/auth";
import { API_BASE } from "../../api/config.js";
import Field, { Input } from "../../ui/Field.jsx";
import Button from "../../ui/Button.jsx";

const EMPTY = {
  email: "",
  username: "",
  password1: "",
  password2: "",
  profile_picture: null,
  country: "",
};

// The backend already serves this from django_countries. The form used to call
// restcountries.com on mount — a third-party dependency on the signup path, for
// data we ship ourselves.
async function fetchCountries() {
  const res = await fetch(`${API_BASE}/users/countries/`);
  if (!res.ok) throw new Error("Failed to load countries");
  return res.json();
}

export default function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  const set = (name) => (e) =>
    setForm((f) => ({
      ...f,
      [name]: name === "profile_picture" ? e.target.files[0] : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (form.password1 !== form.password2) {
      setErrors({ password2: "The two passwords do not match." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") body.append(key, value);
    });

    try {
      const res = await register(body);
      if (res.email || res.id) {
        setSuccess(true);
        return;
      }
      // DRF returns { field: ["message"] }; surface each against its own field
      // rather than one anonymous banner.
      setErrors(
        Object.fromEntries(
          Object.entries(res).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
        )
      );
    } catch {
      setErrors({ email: "Could not reach the server. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-display text-heading-l text-lit">Account created</h1>
        <p className="text-body text-ink-muted">
          You can sign in now and start lighting rooms.
        </p>
        <Button onClick={onSwitchToLogin} size="lg">
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5" noValidate>
      <div>
        <h1 className="font-display text-heading-l text-lit">Create an account</h1>
        <p className="mt-2 text-body-s text-ink-muted">
          Keeps your progress and your place in each domain.
        </p>
      </div>

      <Field label="Email" required error={errors.email}>
        {(props) => (
          <Input {...props} type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        )}
      </Field>

      <Field label="Username" required error={errors.username}>
        {(props) => (
          <Input {...props} autoComplete="username" value={form.username} onChange={set("username")} />
        )}
      </Field>

      <Field label="Country" required error={errors.country}>
        {(props) => (
          <select
            {...props}
            value={form.country}
            onChange={set("country")}
            className="h-10 w-full rounded-hair border border-rule bg-surface px-3 text-body text-ink focus:border-beam focus:outline-none"
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Profile picture"
        hint="Optional — you can add one later."
        error={errors.profile_picture}
      >
        {(props) => (
          <input
            {...props}
            type="file"
            accept="image/*"
            onChange={set("profile_picture")}
            className="w-full text-body-s text-ink-muted file:mr-3 file:rounded-hair file:border file:border-rule-strong file:bg-transparent file:px-3 file:py-1.5 file:text-body-s file:text-ink hover:file:border-beam"
          />
        )}
      </Field>

      <Field label="Password" hint="At least 8 characters." required error={errors.password1}>
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="new-password"
            value={form.password1}
            onChange={set("password1")}
          />
        )}
      </Field>

      <Field label="Confirm password" required error={errors.password2}>
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="new-password"
            value={form.password2}
            onChange={set("password2")}
          />
        )}
      </Field>

      <Button type="submit" busy={submitting} size="lg">
        {submitting ? "Creating…" : "Create account"}
      </Button>

      <p className="text-body-s text-ink-muted">
        Already have one?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-beam underline transition-colors duration-hair hover:text-beam-deep"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
