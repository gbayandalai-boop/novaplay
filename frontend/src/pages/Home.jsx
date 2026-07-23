JavaScript
import { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import MovieCard from "../components/MovieCard";
import { apiFetch, API_URL } from "../api";

function Row({ title, items }) {
  if (!items || items.length === 0) return null;

  const scroll = (id, direction) => {
    const row = document.getElementById(id);
    if (!row) return;

    row.scrollBy({
      left: direction === "right" ? 700 : -700,
      behavior: "smooth",
    });
  };

  const rowId = `row-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="movie-row-section">
      <div className="row-head">
        <h2 className="section-title">{title}</h2>

        <div className="row-arrows">
          <button onClick={() => scroll(rowId, "left")}>‹</button>
          <button onClick={() => scroll(rowId, "right")}>›</button>
        </div>
      </div>

      <div
        className="row-scroll"
        id={rowId}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {items.map((m) => (
          <div className="row-item" key={`${title}-${m.id}`}>
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [continueMovies, setContinueMovies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [ai, setAi] = useState([]);
  const [rt, setRt] = useState([]);

  const loadRT = async () => {
    try {
      const data = await apiFetch("/api/recommendations/realtime/1");
      setRt(Array.isArray(data) ? data : []);
    } catch {
      setRt([]);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/movies/`)
      .then((r) => r.json())
      .then((d) => setMovies(Array.isArray(d) ? d : []))
      .catch(() => setMovies([]));

    fetch(`${API_URL}/api/watch/continue?user_id=1`)
      .then((r) => r.json())
      .then((d) => setContinueMovies(Array.isArray(d) ? d : []))
      .catch(() => setContinueMovies([]));

    const loadAI = async () => {
      try {
        const data = await apiFetch("/api/recommendations/cf/1");
        setAi(Array.isArray(data) ? data : []);
      } catch {
        setAi([]);
      }
    };

    loadAI();
    loadRT();
  }, []);

  // Genre бүлэглэлт
  const byGenre = useMemo(() => {
    const map = {};
    for (const m of movies) {
      const g = m.genre || "Other";
      if (!map[g]) map[g] = [];
      map[g].push(m);
    }
    return map;
  }, [movies]);

  const premium = useMemo(
    () => movies.filter((m) => m.is_premium),
    [movies]
  );

  // Recommended (rating + сүүлд нэмэгдсэн)
  useEffect(() => {
    const sorted = [...movies].sort((a, b) => {
      const r = (b.rating || 0) - (a.rating || 0);
      if (r !== 0) return r;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    setRecommended(sorted.slice(0, 10));
  }, [movies]);

  return (
    <div className="layout">
      <Sidebar />

      <main className="page">
        <Hero movies={movies} />

        {/* Continue Watching */}
        <Row title="Continue Watching" items={continueMovies} />

        {/* AI For You */}
        <Row title="🤖 AI For You" items={ai} />

        {/* Real-Time AI */}
        <Row title="⚡ Real-Time AI" items={rt} />

        {/* Popular */}
        <Row title="Popular Movies" items={movies.slice(0, 12)} />

        {/* Genre */}
        {Object.keys(byGenre)
          .sort()
          .map((g) => (
            <Row key={g} title={`${g} Movies`} items={byGenre[g]} />
          ))}

        {/* Premium */}
        <Row title="Premium Movies" items={premium} />

        {/* Recommended */}
        <Row title="Recommended" items={recommended} />
      </main>
    </div>
  );
}

function Hero({ movies }) {
  const [hero, setHero] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (movies.length > 0) {
      const pick =
        movies.find((m) => m.trailer_url) ||
        movies.find((m) => m.video_url) ||
        movies[0];

      setHero(pick);
    }
  }, [movies]);

  const videoUrl = hero?.trailer_url || hero?.video_url;
  const fullVideo =
    videoUrl?.startsWith("http")
      ? videoUrl
      : `${API_URL}${videoUrl}`;

  if (!hero) return null;

  return (
    <div className="hero-video">
      {videoUrl && (
        <video ref={videoRef} autoPlay muted loop className="hero-bg-video">
          <source src={fullVideo} type="video/mp4" />
        </video>
      )}

      <div className="hero-overlay">
        <div className="hero-content">
          <h1>{hero.title}</h1>
          <p>{hero.description}</p>

          <div className="hero-actions">
            <a href={`/watch/${hero.id}`} className="hero-play">
              ▶ Play
            </a>

            <button
              className="hero-sound"
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.muted = !videoRef.current.muted;
              }}
            >
              🔊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;