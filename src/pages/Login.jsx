import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../services/api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const res = await API.post("/api/users/login", {
        email,
        password
      })

      localStorage.setItem("token", res.data)
      navigate("/dashboard")
    } catch (err) {
      alert("Invalid credentials")
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p><Link to="/register">Register</Link></p>
    </div>
  )
}

export default Login
