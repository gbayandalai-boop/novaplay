import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import Watch from "./pages/Watch";
import Subscribe from "./pages/Subscribe";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAddMovie from "./pages/AdminAddMovie";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Success from "./pages/Success";
import Billing from "./pages/Billing";
import Devices from "./pages/Devices";
import AdminAnalytics from "./pages/AdminAnalytics";
import ResetPassword from "./pages/ResetPassword";

import UserDashboard from "./pages/UserDashboard";
import Profile from "./pages/Profile";
import Search from "./pages/Search";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/search" element={<Search />} />

        {/* Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/success" element={<Success />} />
        <Route path="/devices" element={<Devices />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add"
          element={
            <ProtectedRoute>
              <AdminAddMovie />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;