import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await API.post("/api/users/register", { name, email, password });
      alert("Registered successfully");
      navigate("/");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500">

      <div className="backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-10 w-96 text-white">

        <h2 className="text-3xl font-bold text-center mb-8">
          Create Account 🚀
        </h2>

        <div className="space-y-5">

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/30 placeholder-white outline-none focus:ring-2 focus:ring-white"
          />

          <input
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
            onClick={handleRegister}
            className="w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:scale-105 transition transform"
          >
            Register
          </button>
        </div>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/" className="underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;