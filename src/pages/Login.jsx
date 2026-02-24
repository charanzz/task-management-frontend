import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/api/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">

      <div className="backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-10 w-96 text-white">

        <h2 className="text-3xl font-bold text-center mb-8">
          Welcome Back 👋
        </h2>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/30 placeholder-white outline-none focus:ring-2 focus:ring-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/30 placeholder-white outline-none focus:ring-2 focus:ring-white"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:scale-105 transition transform"
          >
            Login
          </button>
        </div>

        <p className="text-center mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="underline font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;