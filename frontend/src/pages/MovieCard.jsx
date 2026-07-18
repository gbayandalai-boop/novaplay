import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

function MovieCard({ movie }) {
  const track = () => {
    apiFetch("/api/recommendations/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1,
        movie_id: movie.id,
        action: "click"
      }),
    });
  };

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="movie-card"
      onClick={track}
    >
      <div className="poster-wrap">
        {movie.is_premium && (
          <div className="premium-badge">🔒 PREMIUM</div>
        )}

        <img src={movie.poster_url} />
      </div>

      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>{movie.genre} • {movie.release_year}</p>
      </div>
    </Link>
  );
}

export default MovieCard;