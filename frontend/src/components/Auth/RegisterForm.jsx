import { useState, useEffect } from "react";
import { register } from "../../api/auth";
import "./Auth.css";

export default function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password1: "",
    password2: "",
    profile_picture: null,
    country: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countries, setCountries] = useState([]);

  // Load countries list
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        );
        const data = await response.json();
        const sortedCountries = data
          .map((country) => ({
            code: country.cca2,
            name: country.name.common,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(sortedCountries);
      } catch (error) {
        console.error("Failed to load countries:", error);
        // Fallback to some common countries
        setCountries([
          { code: "US", name: "United States" },
          { code: "CA", name: "Canada" },
          { code: "GB", name: "United Kingdom" },
          { code: "DE", name: "Germany" },
          { code: "FR", name: "France" },
          { code: "AU", name: "Australia" },
        ]);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "profile_picture") {
      setForm({ ...form, [e.target.name]: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    try {
      const res = await register(formData);
      if (res.email || res.id) {
        setSuccess(true);
        setError("");
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          onSwitchToLogin();
        }, 3000);
      } else if (res.non_field_errors) {
        setError(res.non_field_errors[0]);
      } else if (res.password1) {
        setError(res.password1[0]);
      } else if (res.email) {
        setError(res.email[0]);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
    }
  };

  if (success)
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="auth-success">
            ✅ Registration successful!
            <br />
            <small>Redirecting to login in 3 seconds...</small>
          </div>
          <button
            className="auth-btn auth-btn-secondary"
            onClick={onSwitchToLogin}
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">Create Account</h2>

        <div className="auth-form-group">
          <input
            className="auth-input"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            required
          />
        </div>

        <div className="auth-form-group">
          <input
            className="auth-input"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username (can include spaces and symbols)"
            required
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Profile Picture *</label>
          <input
            className="auth-input"
            name="profile_picture"
            type="file"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-form-group">
          <select
            className="auth-input"
            name="country"
            value={form.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country *</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-form-group">
          <input
            className="auth-input"
            name="password1"
            type="password"
            value={form.password1}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>

        <div className="auth-form-group">
          <input
            className="auth-input"
            name="password2"
            type="password"
            value={form.password2}
            onChange={handleChange}
            placeholder="Confirm Password"
            required
          />
        </div>

        <button className="auth-btn" type="submit">
          Register
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={onSwitchToLogin}
        >
          Back to Login
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}
