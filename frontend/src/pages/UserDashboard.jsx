import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";

function UserDashboard() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [ai, setAi] = useState([]);
  const [cf, setCf] = useState([]);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProfile);

    fetch(`${API_URL}/api/user/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []));

    fetch(`${API_URL}/api/user/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFavorites(Array.isArray(data) ? data : []));

    const loadAI = async () => {
      const res = await apiFetch("/api/recommendations/ml/1");
      const data = await res.json();
      setAi(Array.isArray(data) ? data : []);
    };

    const loadCF = async () => {
      const res = await apiFetch("/api/recommendations/cf/1");
      const data = await res.json();
      setCf(Array.isArray(data) ? data : []);
    };

    loadAI();
    loadCF();
  }, [token, API_URL]);

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <div className="dashboard-head">
          <div>
            <h1>Welcome, {profile?.name || "User"}</h1>
            <p>{profile?.is_subscribed ? "Premium account" : "Free account"}</p>
          </div>
        </div>

        <h2 className="section-title">🤖 AI For You</h2>
        <div className="movie-grid">
          {ai.map((m) => (
            <Link to={`/movie/${m.id}`} className="movie-card" key={m.id}>
              <img src={m.poster_url} />
              <div className="movie-info">
                <h3>{m.title}</h3>
                <p>{m.genre}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="section-title">🤖 AI Recommended</h2>
        <div className="movie-grid">
          {cf.map((m) => (
            <Link to={`/movie/${m.id}`} className="movie-card" key={m.id}>
              <img src={m.poster_url} />
              <div className="movie-info">
                <h3>{m.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="section-title">Continue Watching</h2>
        <div className="movie-grid">
          {history.map((m) => (
            <Link to={`/watch/${m.id}`} className="movie-card" key={m.id}>
              <img src={m.poster_url} />
              <div className="movie-info">
                <h3>{m.title}</h3>
                <p>Resume at {m.progress}s</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="section-title">Favorites</h2>
        <div className="movie-grid">
          {favorites.map((m) => (
            <Link to={`/movie/${m.id}`} className="movie-card" key={m.id}>
              <img src={m.poster_url} />
              <div className="movie-info">
                <h3>{m.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;