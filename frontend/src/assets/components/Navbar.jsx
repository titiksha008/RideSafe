import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <nav className="navbar">

      <div className="nav-logo" onClick={() => navigate("/")}>
        SafeRide
      </div>

      <div className="nav-links">

        <button
          className={isActive("/dashboard") ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        <button
          className={isActive("/start-ride") ? "active" : ""}
          onClick={() => navigate("/start-ride")}
        >
          Start Ride
        </button>

        <button
          className={isActive("/safety-center") ? "active" : ""}
          onClick={() => navigate("/safety-center")}
        >
          Safety
        </button>

        <button
          className={isActive("/profile") ? "active" : ""}
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;