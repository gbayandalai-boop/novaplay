import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiFetch, API_URL } from "../api";

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_movies: 0,
    total_views: 0,
    total_revenue: 0,
  });
  const [movies, setMovies] = useState([]);

  const loadData = async () => {
    try {
      const statsData = await apiFetch("/api/admin/stats");
      setStats(statsData);

      const moviesData = await apiFetch("/api/movies/");
      setMovies(Array.isArray(moviesData) ? moviesData : []);
    } catch (err) {
      console.error("Admin data load error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (movieId) => {
    if (!window.confirm("Энэ киног устгахдаа итгэлтэй байна уу?")) return;

    try {
      await apiFetch(`/api/movies/${movieId}`, {
        method: "DELETE",
      });
      setMovies(movies.filter((m) => m.id !== movieId));
    } catch (err) {
      alert("Устгахад алдаа гарлаа: " + err.message);
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <div className="dashboard-head">
          <h1>⚡ Admin Dashboard</h1>
          <p>Системийн ерөнхий статистик болон кино удирдлага</p>
        </div>

        {/* Статистик карт хэсэг */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Нийт хэрэглэгч</h3>
            <strong>{stats.total_users}</strong>
          </div>
          <div className="analytics-card">
            <h3>Нийт кино</h3>
            <strong>{stats.total_movies}</strong>
          </div>
          <div className="analytics-card">
            <h3>Нийт үзэлт</h3>
            <strong>{stats.total_views}</strong>
          </div>
          <div className="analytics-card">
            <h3>Орлого</h3>
            <strong>${stats.total_revenue}</strong>
          </div>
        </div>

        {/* Киноны жагсаалт ба удирдах хэсэг */}
        <div style={{ marginTop: "40px" }}>
          <div className="row-head">
            <h2 className="section-title">Киноны жагсаалт</h2>
            <a href="/admin/add-movie" className="hero-play" style={{ fontSize: "14px", padding: "10px 18px" }}>
              + Шинэ кино нэмэх
            </a>
          </div>

          <div className="admin-table" style={{ marginTop: "16px" }}>
            {movies.map((movie) => (
              <div className="admin-row" key={movie.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #222" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <img
                    src={movie.poster_url?.startsWith("http") ? movie.poster_url : `${API_URL}${movie.poster_url}`}
                    alt={movie.title}
                    style={{ width: "45px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                  />
                  <div>
                    <strong>{movie.title}</strong>
                    <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                      {movie.genre} • {movie.release_year} {movie.is_premium && "• 🔒 Premium"}
                    </p>
                  </div>
                </div>

                <button
                  className="favorite-btn"
                  onClick={() => handleDelete(movie.id)}
                  style={{ background: "#4a1212", borderColor: "#661818" }}
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;