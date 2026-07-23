import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api";

function Watch() {
  const { id } = useParams();
  const videoRef = useRef(null);

  const [movie, setMovie] = useState(null);
  const [progress, setProgress] = useState(0);

  const userId = 1;

  useEffect(() => {
    fetch(`${API_URL}/api/watch/${id}?user_id=${userId}`)
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
      `${API_URL}/api/watch/${id}/progress?user_id=${userId}&progress=${Math.floor(
        videoRef.current.currentTime
      )}`,
      { method: "PUT" }
    );
  };

  if (!movie) return <div className="page">Loading...</div>;

  const videoUrl = `${API_URL}/api/stream/movie/${id}`;

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