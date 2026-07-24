import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import { API_URL } from "../api";

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [status, setStatus] = useState({ is_subscribed: false, role: "user" });
  const [favMsg, setFavMsg] = useState("");

  useEffect(() => {
    const baseUrl = API_URL || "";

    fetch(`${baseUrl}/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => setMovie(data))
      .catch(() => setMovie(null));

    fetch(`${baseUrl}/api/recommendations/${id}`)
      .then((res) => res.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch(() => setRecommended([]));

    const token = localStorage.getItem("token");

    if (token) {
      fetch(`${baseUrl}/api/payment/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setStatus(data))
        .catch(() => {});
    }
  }, [id]);

  const addFavorite = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setFavMsg("Login хэрэгтэй");
      return;
    }

    try {
      const baseUrl = API_URL || "";
      const res = await fetch(`${baseUrl}/api/user/favorite/${movie.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavMsg(res.ok ? "❤️ Favorites-д нэмэгдлээ" : "Favorite нэмэгдсэнгүй");
    } catch {
      setFavMsg("Backend холбогдсонгүй");
    }
  };

  if (!movie) return <div className="page">Loading...</div>;

  const baseUrl = API_URL || "";
  const poster = movie.poster_url?.startsWith("http")
    ? movie.poster_url
    : `${baseUrl}${movie.poster_url || ""}`;

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