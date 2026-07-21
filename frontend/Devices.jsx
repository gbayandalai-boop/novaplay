import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

function Devices() {
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const res = await apiFetch("/api/user/sessions");
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id) => {
    await apiFetch(`/api/user/sessions/${id}/revoke`, { method: "POST" });
    load();
  };

  const logoutAll = async () => {
    await apiFetch("/api/user/sessions/logout-all", { method: "POST" });
    localStorage.clear();
    window.location.href = "/admin/login";
  };

  return (
    <div className="page">
      <h1>Active Devices</h1>

      <button onClick={logoutAll}>Logout All Devices</button>

      {sessions.map((s) => (
        <div key={s.id} className="device-card">
          <p>{s.device}</p>
          <p>{s.ip}</p>
          <p>{new Date(s.last_active).toLocaleString()}</p>

          <button onClick={() => revoke(s.id)}>Logout</button>
        </div>
      ))}
    </div>
  );
}

export default Devices;