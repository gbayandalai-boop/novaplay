import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/movies/")
      .then(res => setMovies(res.data));
  }, []);

  const deleteMovie = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/movies/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setMovies(movies.filter(m => m.id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="navbar">
        <h1 className="logo">NovaPlay</h1>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/admin/add" className="nav-link">+ Add Movie</Link>

          {/* ✅ НЭМЭГДСЭН */}
          <Link to="/admin/analytics" className="nav-link">
            📊 Analytics
          </Link>

          <button
            className="nav-link"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/admin/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <h2 className="section-title">Admin Dashboard</h2>

      {movies.length === 0 ? (
        <div className="empty-box">No movies</div>
      ) : (
        <div className="movie-grid">
          {movies.map(m => (
            <div className="movie-card" key={m.id}>

              <img src={m.poster_url} />

              <div className="movie-info">
                <h3>{m.title}</h3>
                <p>{m.genre}</p>

                <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                  <Link to={`/movie/${m.id}`} className="nav-link">View</Link>

                  <button
                    className="nav-link"
                    onClick={() => deleteMovie(m.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;