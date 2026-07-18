import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setMsg("Creating account...");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.detail || "Register failed");
        return;
      }

      setMsg("✅ Бүртгэл амжилттай. Email verify хийнэ үү.");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1200);
    } catch {
      setMsg("Backend холбогдсонгүй");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={register}>
        <h1>Create Account</h1>
        <p>Join NovaPlay</p>

        <input
          value={name}
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Register</button>

        {msg && <div className="error">{msg}</div>}

        <div className="login-links">
          <Link to="/admin/login">Already have account? Login</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;