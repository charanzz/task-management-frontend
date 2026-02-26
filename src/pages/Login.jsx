import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      // Use AuthContext instead of manual localStorage
      login(res.data.token);

      navigate("/dashboard");
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="container-center">
      <form className="glass-card" onSubmit={handleLogin}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Welcome Back 🚀
        </h2>

        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="primary-btn" type="submit">
          Login
        </button>

        {/* 🔥 Create Account Link */}
        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#8b5cf6",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
}