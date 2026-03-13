import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import Navbar from "../components/Navbar";

function Landing() {

  const navigate = useNavigate();

  return (
    <div className="landing-container">

      <Navbar />

      <section className="hero">

        <h1>Cab Safety System</h1>

        <p>
          A smart platform designed to make cab rides safer using
          real-time monitoring, safety alerts, and emergency assistance.
        </p>

        <button
          className="cta"
          onClick={() => navigate("/start-ride")}
        >
          Get Started
        </button>

      </section>

      <footer className="footer">
        <p>© 2026 SafeRide | Cab Safety System</p>
      </footer>

    </div>
  );
}

export default Landing;