import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";

function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadDevices = async () => {
    try {
      const res = await apiFetch("/api/auth/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      }
    } catch {
      setMsg("Төхөөрөмжийн мэдээлэл авахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const logoutDevice = async (deviceId) => {
    try {
      const res = await apiFetch(`/api/auth/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDevices(devices.filter((d) => d.id !== deviceId));
      } else {
        alert("Төхөөрөмжийг салгахад алдаа гарлаа");
      }
    } catch {
      alert("Backend холбогдсонгүй");
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <div className="search-head">
          <h1>📱 Active Devices</h1>
          <p>Manage your logged-in devices and sessions.</p>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : msg ? (
          <div className="empty-box">{msg}</div>
        ) : devices.length === 0 ? (
          <div className="empty-box">Нэвтэрсэн төхөөрөмж одоогоор алга.</div>
        ) : (
          <div className="admin-table">
            {devices.map((device) => (
              <div className="admin-row" key={device.id}>
                <div>
                  <strong>{device.name || "Unknown Device"}</strong>
                  <p style={{ fontSize: "12px", opacity: 0.7 }}>
                    IP: {device.ip_address} • Last active: {device.last_active}
                  </p>
                </div>

                <button
                  className="nav-link"
                  onClick={() => logoutDevice(device.id)}
                >
                  Logout
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Devices;