import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
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
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn">Login</button>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Don't have an account?
        </p>
      </form>
    </div>
  );
}