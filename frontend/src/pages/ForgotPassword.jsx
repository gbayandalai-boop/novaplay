import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const sendOTP = async () => {
    if (!email) {
      setMsg("Email оруулна уу");
      return;
    }

    setMsg("Sending OTP...");

    try {
      const baseUrl = API_URL || "";
      await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setMsg("OTP sent to your email");
    } catch {
      setMsg("Backend холбогдсонгүй");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setMsg("Sending...");

    try {
      const baseUrl = API_URL || "";
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMsg(data.message || "Reset email sent");
    } catch {
      setMsg("Backend холбогдсонгүй");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={resetPassword}>
        <h1>Forgot Password</h1>
        <p>Enter your email to reset password</p>

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="button" onClick={sendOTP}>
          Send OTP
        </button>

        <button type="submit">Send Reset Link</button>

        {msg && <div className="error">{msg}</div>}

        <div className="login-links">
          <Link to="/admin/login">Back to login</Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;