import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const data = await apiFetch("/api/auth/me");
      setProfile(data);
    } catch {
      setMsg("Profile load failed");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const cancelSubscription = async () => {
    if (!window.confirm("Subscription цуцлах уу?")) return;

    try {
      await apiFetch("/api/payment/cancel", {
        method: "POST",
      });

      setMsg("✅ Subscription cancelled");
      loadProfile();
    } catch {
      setMsg("Backend холбогдсонгүй");
    }
  };

  if (!profile)
    return (
      <div className="layout">
        <Sidebar />
        <main className="page">Loading...</main>
      </div>
    );

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <div className="profile-card">
          <div className="avatar">{profile.name?.[0] || "U"}</div>

          <h1>{profile.name}</h1>
          <p>{profile.email}</p>

          <span className="profile-badge">
            {profile.is_subscribed ? "🔥 Premium Member" : "Free User"}
          </span>

          <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
            {profile.is_subscribed ? (
              <button className="favorite-btn" onClick={cancelSubscription}>
                ❌ Cancel Subscription
              </button>
            ) : (
              <button className="play-btn" onClick={() => navigate("/subscribe")}>
                💳 Subscribe Now
              </button>
            )}

            <button className="favorite-btn" onClick={() => navigate("/billing")}>
              🧾 Billing History
            </button>
          </div>

          {msg && <p className="fav-msg">{msg}</p>}
        </div>
      </main>
    </div>
  );
}

export default Profile;