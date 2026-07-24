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

  useEffect(() => {
    const baseUrl = API_URL || "";

    // 1. All Movies
    fetch(`${baseUrl}/api/movies/`)
      .then((r) => r.json())
      .then((d) => setMovies(Array.isArray(d) ? d : []))
      .catch((err) => {
        console.error("Fetch movies error:", err);
        setMovies([]);
      });

    // 2. Continue Watching
    fetch(`${baseUrl}/api/watch/continue?user_id=1`)
      .then((r) => r.json())
      .then((d) => setContinueMovies(Array.isArray(d) ? d : []))
      .catch((err) => {
        console.error("Fetch continue error:", err);
        setContinueMovies([]);
      });

    // 3. AI Recommendations
    const loadAI = async () => {
      try {
        const data = await apiFetch("/api/recommendations/cf/1");
        setAi(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load AI error:", err);
        setAi([]);
      }
    };

    // 4. Real-time Recommendations
    const loadRT = async () => {
      try {
        const data = await apiFetch("/api/recommendations/realtime/1");
        setRt(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load RT error:", err);
        setRt([]);
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
    if (!movies.length) return;
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
    if (movies && movies.length > 0) {
      const pick =
        movies.find((m) => m.trailer_url) ||
        movies.find((m) => m.video_url) ||
        movies[0];

      setHero(pick);
    }
  }, [movies]);

  if (!hero) return null;

  const videoUrl = hero?.trailer_url || hero?.video_url;
  const baseUrl = API_URL || "";
  const fullVideo = videoUrl
    ? videoUrl.startsWith("http")
      ? videoUrl
      : `${baseUrl}${videoUrl.startsWith("/") ? "" : "/"}${videoUrl}`
    : "";

  return (
    <div className="hero-video">
      {fullVideo && (
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