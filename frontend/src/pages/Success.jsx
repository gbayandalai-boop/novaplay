import { Link } from "react-router-dom";

function Success() {
  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <h1>✅ Payment Successful</h1>
        <p>Premium эрх амжилттай идэвхжлээ.</p>

        <div className="price">🔥 Premium Active</div>

        <Link to="/" className="nav-link">
          Go Home
        </Link>

        <Link to="/profile" className="back-sub">
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default Success;