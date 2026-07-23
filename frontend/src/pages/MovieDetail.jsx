import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [status, setStatus] = useState({ is_subscribed: false, role: "user" });
  const [favMsg, setFavMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${API_URL}/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => setMovie(data));

    fetch(`${API_URL}/api/recommendations/${id}`)
      .then((res) => res.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch(() => setRecommended([]));

    const token = localStorage.getItem("token");

    if (token) {
      fetch(`${API_URL}/api/payment/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setStatus(data))
        .catch(() => {});
    }
  }, [id, API_URL]);

  const addFavorite = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setFavMsg("Login хэрэгтэй");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/user/favorite/${movie.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavMsg(res.ok ? "❤️ Favorites-д нэмэгдлээ" : "Favorite нэмэгдсэнгүй");
    } catch {
      setFavMsg("Backend холбогдсонгүй");
    }
  };

  if (!movie) return <div className="page">Loading...</div>;

  const poster = movie.poster_url?.startsWith("http")
    ? movie.poster_url
    : `${API_URL}${movie.poster_url}`;

  const canWatch =
    !movie.is_premium || status.is_subscribed || status.role === "admin";

  return (
    <div>
      <div className="detail-hero" style={{ backgroundImage: `url(${poster})` }}>
        <div className="detail-overlay">
          <Link to="/" className="back">⬅ Back</Link>

          {movie.is_premium && <div className="premium-tag">PREMIUM</div>}

          <div className="detail-content">
            <h1>{movie.title}</h1>

            <p className="meta">
              {movie.genre || "Movie"} {movie.release_year ? `• ${movie.release_year}` : ""}
            </p>

            <p className="desc">{movie.description}</p>

            <div className="detail-actions">
              {canWatch ? (
                <Link to={`/watch/${movie.id}`} className="play-btn">
                  ▶ Play
                </Link>
              ) : (
                <Link to="/subscribe" className="play-btn locked-btn">
                  🔒 Subscribe to Watch
                </Link>
              )}

              <button className="favorite-btn" onClick={addFavorite}>
                ❤️ Add to Favorites
              </button>
            </div>

            {favMsg && <p className="fav-msg">{favMsg}</p>}
          </div>
        </div>
      </div>

      <div className="page recommendation-section">
        <h2 className="section-title">AI Recommendations</h2>

        {recommended.length === 0 ? (
          <div className="empty-box">Санал болгох кино алга байна.</div>
        ) : (
          <div className="movie-grid">
            {recommended.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;