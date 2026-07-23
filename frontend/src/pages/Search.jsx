import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import MovieCard from "../components/MovieCard";

function Search() {
  const [movies, setMovies] = useState([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("all");
  const [type, setType] = useState("all");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${API_URL}/api/movies/`)
      .then((res) => res.json())
      .then((data) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => setMovies([]));
  }, [API_URL]);

  const genres = useMemo(() => {
    return ["all", ...new Set(movies.map((m) => m.genre).filter(Boolean))];
  }, [movies]);

  const filtered = movies.filter((m) => {
    const matchText =
      m.title?.toLowerCase().includes(q.toLowerCase()) ||
      m.description?.toLowerCase().includes(q.toLowerCase());

    const matchGenre = genre === "all" || m.genre === genre;

    const matchType =
      type === "all" ||
      (type === "premium" && m.is_premium) ||
      (type === "free" && !m.is_premium);

    return matchText && matchGenre && matchType;
  });

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <div className="search-head">
          <h1>Search Movies</h1>
          <p>Find movies by title, genre and premium status.</p>

          <div className="search-controls">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movie..."
            />

            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All genres" : g}
                </option>
              ))}
            </select>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        <h2 className="section-title">Results ({filtered.length})</h2>

        {filtered.length === 0 ? (
          <div className="empty-box">Илэрц олдсонгүй.</div>
        ) : (
          <div className="movie-grid">
            {filtered.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;