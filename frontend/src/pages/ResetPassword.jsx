import { useState } from "react";
import { Link } from "react-router-dom";

function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (!otp || !password) {
      setMsg("OTP болон password оруулна уу");
      return;
    }

    setMsg("Saving...");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: otp,
          new_password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.detail || "Reset failed");
        return;
      }

      setMsg("✅ Password changed successfully");
    } catch {
      setMsg("Backend холбогдсонгүй");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Reset Password (OTP)</h1>
        <p>Enter OTP code and new password</p>

        <input
          type="text"
          placeholder="OTP Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Verify & Change</button>

        {msg && <div className="error">{msg}</div>}

        <div className="login-links">
          <Link to="/admin/login">Back to login</Link>
        </div>
      </form>
    </div>
  );
}

export default ResetPassword;