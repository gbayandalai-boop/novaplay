import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";

function Billing() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = () => {
    apiFetch("/api/payment/history")
      .then((res) => res.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const openBillingPortal = async () => {
    try {
      setLoading(true);

      const res = await apiFetch("/api/payment/create-billing-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Billing portal failed");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      alert("Billing portal error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="page billing-page">
        <div className="billing-hero">
          <div>
            <h1>🧾 Billing History</h1>
            <p>Manage your subscription, payment method and billing history.</p>
          </div>

          <button className="billing-manage-btn" onClick={openBillingPortal}>
            {loading ? "Opening..." : "Manage Subscription"}
          </button>
        </div>

        {data.length === 0 ? (
          <div className="billing-empty">
            <h2>No payments yet</h2>
            <p>Your payment history will appear here after subscription.</p>
          </div>
        ) : (
          <div className="billing-list">
            {data.map((item) => (
              <div key={item.id} className="billing-card">
                <div>
                  <h3>${item.amount}</h3>
                  <p>{item.payment_method}</p>
                </div>

                <span className={`billing-status ${item.status}`}>
                  {item.status}
                </span>

                <p>Created: {item.created_at}</p>

                {item.approved_at && <p>Approved: {item.approved_at}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Billing;