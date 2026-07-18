import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { Link } from "react-router-dom";

function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [topMovies, setTopMovies] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const s = await apiFetch("/api/analytics/summary");
      setSummary(await s.json());

      const t = await apiFetch("/api/analytics/top-movies");
      setTopMovies(await t.json());

      const p = await apiFetch("/api/analytics/recommendation-performance");
      setPerformance(await p.json());

      const pay = await apiFetch("/api/payment/admin/payments");
      const payData = await pay.json();
      setPayments(Array.isArray(payData) ? payData : []);
    } catch (e) {
      console.error("Analytics load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approvePayment = async (id) => {
    await apiFetch(`/api/payment/admin/payments/${id}/approve`, {
      method: "POST",
    });
    load();
  };

  const rejectPayment = async (id) => {
    await apiFetch(`/api/payment/admin/payments/${id}/reject`, {
      method: "POST",
    });
    load();
  };

  if (loading) return <div className="page">Loading...</div>;
  if (!summary) return <div className="page">❌ Analytics load failed</div>;

  return (
    <div className="page">
      <div className="navbar">
        <Link to="/admin" className="logo">NovaPlay Analytics</Link>
        <Link to="/admin" className="nav-link">Back</Link>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Users</h3>
          <strong>{summary.total_users}</strong>
        </div>

        <div className="analytics-card">
          <h3>Premium Users</h3>
          <strong>{summary.premium_users}</strong>
        </div>

        <div className="analytics-card">
          <h3>Total Movies</h3>
          <strong>{summary.total_movies}</strong>
        </div>

        <div className="analytics-card">
          <h3>Watch Events</h3>
          <strong>{summary.total_watch_events}</strong>
        </div>

        <div className="analytics-card">
          <h3>Favorites</h3>
          <strong>{summary.total_favorites}</strong>
        </div>

        <div className="analytics-card">
          <h3>AI Engagement</h3>
          <strong>{performance?.engagement_score || 0}%</strong>
        </div>
      </div>

      <h2 className="section-title">💳 Payment Approval</h2>

      {payments.length === 0 ? (
        <div className="empty-box">Одоогоор төлбөрийн хүсэлт алга</div>
      ) : (
        <div className="admin-table">
          {payments.map((p) => (
            <div className="admin-row" key={p.id}>
              <span>{p.user_email}</span>
              <span>${p.amount}</span>
              <span>{p.payment_method}</span>
              <strong>{p.status}</strong>

              {p.status === "pending" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="nav-link"
                    onClick={() => approvePayment(p.id)}
                  >
                    ✅ Approve
                  </button>

                  <button
                    className="nav-link"
                    onClick={() => rejectPayment(p.id)}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">🔥 Top Watched Movies</h2>

      {topMovies.length === 0 ? (
        <div className="empty-box">Одоогоор data алга</div>
      ) : (
        <div className="admin-table">
          {topMovies.map((m) => (
            <div className="admin-row" key={m.id}>
              <img src={m.poster_url || "/no-poster.png"} />
              <span>{m.title}</span>
              <strong>{m.views} views</strong>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">🤖 Recommendation Performance</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Watch Events</h3>
          <strong>{performance?.watch_events || 0}</strong>
        </div>

        <div className="analytics-card">
          <h3>Favorites</h3>
          <strong>{performance?.favorites || 0}</strong>
        </div>

        <div className="analytics-card">
          <h3>Engagement Score</h3>
          <strong>{performance?.engagement_score || 0}%</strong>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;