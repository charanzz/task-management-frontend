import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.email || !form.password) {
      return setError("All fields are required.");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);

      await api.post("/api/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      navigate("/login");
    } catch (err) {
      console.log(err);

      if (err.response?.status === 409) {
        setError("Username or email already exists.");
      } else if (err.response?.status === 400) {
        setError("Invalid registration data.");
      } else {
        setError("Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-center">
      <form className="glass-card" onSubmit={handleSubmit}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Create Account
        </h2>

        {error && (
          <div
            style={{
              background: "rgba(255,0,0,0.1)",
              color: "#ff4d4d",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <input
          className="input-field"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />

        <input
          className="input-field"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          className="input-field"
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <input
          className="input-field"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#8b5cf6", fontWeight: "500" }}
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}