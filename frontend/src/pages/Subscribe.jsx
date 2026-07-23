import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const pay = async (plan) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMsg("Login хийх шаардлагатай");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        `${API_URL}/api/payment/create-checkout-session?plan=${plan}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMsg("Payment error");
        setLoading(false);
      }
    } catch {
      setMsg("Backend холбогдсонгүй");
      setLoading(false);
    }
  };

  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <h1>NovaPlay Plans</h1>
        <p>Choose your subscription</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
          
          <button onClick={() => pay("basic")} disabled={loading}>
            Basic — $5
          </button>

          <button onClick={() => pay("pro")} disabled={loading}>
            Pro — $9.99
          </button>

          <button onClick={() => pay("enterprise")} disabled={loading}>
            Enterprise — $19.99
          </button>

        </div>

        {loading && <p style={{ marginTop: "16px" }}>Redirecting to Stripe...</p>}
        {msg && <p className="error">{msg}</p>}

        <button onClick={() => navigate("/")} style={{ marginTop: "20px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Subscribe;