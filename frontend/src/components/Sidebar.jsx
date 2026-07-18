import { Link } from "react-router-dom";

function Sidebar() {
  const token = localStorage.getItem("token");

  return (
    <aside className="sidebar">
      <Link to="/" className="side-logo">N</Link>

      <nav>
        <Link to="/">🏠 Home</Link>
        <Link to="/search">🔎 Search</Link>
        <Link to="/dashboard">🎬 Dashboard</Link>
        <Link to="/dashboard">❤️ Favorites</Link>
        <Link to="/profile">👤 Profile</Link>
        <Link to="/admin">⚙ Admin</Link>
      </nav>

      {token && (
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      )}
    </aside>
  );
}

export default Sidebar;