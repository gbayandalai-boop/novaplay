import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function AdminLogin() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      if (!data.access_token) {
        setError("Token ирсэнгүй");
        return;
      }

      // ✅ TOKEN STORAGE
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      window.location.href = "/admin";
    } catch (err) {
      console.log(err);
      setError("Backend холбогдсонгүй");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>NovaPlay Admin</h1>
        <p>Movie management panel</p>

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin(e);
            }
          }}
        />

        <button type="submit">Login</button>

        <div className="login-links">
          <Link to="/register">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}

export default AdminLogin;