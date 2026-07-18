import { useState } from "react";
import { Link } from "react-router-dom";

function AdminAddMovie() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState(null);
  const [video, setVideo] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // ✅ НЭМЭГДСЭН
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");

  const uploadFile = async (url, file) => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  };

  const saveMovie = async (e) => {
    e.preventDefault();
    setMsg("Uploading...");

    try {
      const posterData = await uploadFile("http://127.0.0.1:8000/api/upload/poster", poster);
      const videoData = await uploadFile("http://127.0.0.1:8000/api/upload/video", video);

      const res = await fetch("http://127.0.0.1:8000/api/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          genre,
          description,
          poster_url: posterData.url,
          video_url: videoData.url,
          is_premium: isPremium, // ✅ НЭМЭГДСЭН
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      setMsg("✅ Movie saved");
      setTitle("");
      setGenre("");
      setDescription("");
      setPoster(null);
      setVideo(null);
      setIsPremium(false); // ✅ reset
    } catch {
      setMsg("❌ Алдаа гарлаа");
    }
  };

  return (
    <div className="page">
      <div className="navbar">
        <Link to="/admin" className="logo">NovaPlay Admin</Link>
        <Link to="/admin" className="nav-link">Back</Link>
      </div>

      <div className="admin-form-card">
        <h1>Add Movie</h1>
        <p>Upload poster, video and movie details</p>

        <form onSubmit={saveMovie} className="movie-form">
          <input
            type="text"
            placeholder="Movie title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
          />

          {/* ✅ PREMIUM CHECKBOX */}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Premium movie (захиалгатай хэрэглэгч үзнэ)
          </label>

          <label>Poster image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPoster(e.target.files[0])}
            required
          />

          <label>Video file</label>
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setVideo(e.target.files[0])}
            required
          />

          <button type="submit">Save Movie</button>

          {msg && <div className="form-msg">{msg}</div>}
        </form>
      </div>
    </div>
  );
}

export default AdminAddMovie;