import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function Watch() {
  const { id } = useParams();
  const videoRef = useRef(null);

  const [movie, setMovie] = useState(null);
  const [progress, setProgress] = useState(0);

  const userId = 1;

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/watch/${id}?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMovie(data);
        setProgress(data.progress || 0);
      });
  }, [id]);

  const handleLoaded = () => {
    if (videoRef.current && progress > 0) {
      videoRef.current.currentTime = progress;
    }
  };

  const saveProgress = () => {
    if (!videoRef.current) return;

    fetch(
      `http://127.0.0.1:8000/api/watch/${id}/progress?user_id=${userId}&progress=${Math.floor(
        videoRef.current.currentTime
      )}`,
      { method: "PUT" }
    );
  };

  if (!movie) return <div className="page">Loading...</div>;

  const videoUrl = `http://127.0.0.1:8000/api/stream/movie/${id}`;

  return (
    <div className="watch-full">
      <Link to={`/movie/${id}`} className="back">⬅ Back</Link>

      <video
        ref={videoRef}
        controls
        autoPlay
        className="video-full"
        onLoadedMetadata={handleLoaded}
        onTimeUpdate={saveProgress}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}

export default Watch;