import { Link } from "react-router-dom";

function MovieCard({ movie }) {
  const previewUrl = movie.trailer_url || movie.video_url;

  const fullPreviewUrl = previewUrl?.startsWith("http")
    ? previewUrl
    : `http://127.0.0.1:8000${previewUrl}`;

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card netflix-card">
      <div className="poster-wrap">
        <img
          src={movie.poster_url || "/no-poster.png"}
          alt={movie.title}
          className="poster-img"
        />

        {previewUrl && (
          <video
            className="preview-video"
            muted
            loop
            preload="metadata"
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          >
            <source src={fullPreviewUrl} type="video/mp4" />
          </video>
        )}

        <div className="preview-overlay">
          <div className="play-circle">▶</div>
          <div>
            <h3>{movie.title}</h3>
            <p>{movie.genre || "Movie"}</p>
          </div>
        </div>
      </div>

      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>{movie.genre || "Movie"} {movie.release_year ? `• ${movie.release_year}` : ""}</p>
      </div>
    </Link>
  );
}

export default MovieCard;