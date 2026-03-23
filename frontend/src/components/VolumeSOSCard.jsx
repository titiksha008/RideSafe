// src/components/VolumeSOSCard.jsx
//
// Drop into SOSCenter.jsx:
//   import VolumeSOSCard from "../components/VolumeSOSCard";
//   <VolumeSOSCard armed={volumeArmed} onToggle={setVolumeArmed} />

import React, { useState, useEffect } from "react";
import "../styles/VolumeSOSCard.css";

export default function VolumeSOSCard({ armed, onToggle }) {

  const [justTriggered, setJustTriggered] = useState(false);

  // Called by the parent when SOS actually fires via volume button
  // Parent should pass a `lastTrigger` timestamp prop to animate this
  useEffect(() => {
    if (!armed) setJustTriggered(false);
  }, [armed]);

  const handleToggle = () => {
    onToggle(!armed);
  };

  return (
    <div className={`vsос-card ${armed ? "vsос-card-armed" : ""}`}>

      {/* Header row */}
      <div className="vsос-header">
        <div className="vsос-icon-wrap">
          <span className="vsос-icon">🔉</span>
        </div>
        <div className="vsос-info">
          <p className="vsос-title">Volume Button SOS</p>
          <p className="vsос-desc">Press Volume Down 3× fast to send SOS</p>
        </div>
        <button
          className={`vsос-toggle ${armed ? "vsос-toggle-on" : "vsос-toggle-off"}`}
          onClick={handleToggle}
          aria-label={armed ? "Disarm volume SOS" : "Arm volume SOS"}
        >
          <span className="vsос-toggle-knob" />
        </button>
      </div>

      {/* Step indicators — always visible so user knows the pattern */}
      <div className="vsос-steps">
        <div className={`vsос-step ${armed ? "vsос-step-armed" : ""}`}>
          <span className="vsос-step-num">1</span>
          <span className="vsос-step-label">Vol Down</span>
        </div>
        <span className="vsос-step-arrow">›</span>
        <div className={`vsос-step ${armed ? "vsос-step-armed" : ""}`}>
          <span className="vsос-step-num">2</span>
          <span className="vsос-step-label">Vol Down</span>
        </div>
        <span className="vsос-step-arrow">›</span>
        <div className={`vsос-step ${armed ? "vsос-step-armed" : ""}`}>
          <span className="vsос-step-num">3</span>
          <span className="vsос-step-label">Vol Down</span>
        </div>
        <span className="vsос-step-arrow">›</span>
        <div className={`vsос-step vsос-step-result ${armed ? "vsос-step-armed" : ""}`}>
          <span className="vsос-step-num">🆘</span>
          <span className="vsос-step-label">SOS Sent</span>
        </div>
      </div>

      {/* Status bar */}
      <div className={`vsос-status ${armed ? "vsос-status-armed" : "vsос-status-idle"}`}>
        <span className="vsос-status-dot" />
        <span className="vsос-status-text">
          {armed
            ? "Armed — listening for Volume Down × 3"
            : "Disarmed — toggle to activate"}
        </span>
      </div>

      {/* Note about browser limitation */}
      {armed && (
        <p className="vsос-note">
          ⚡ Works while app is open. Wake Lock requested to keep screen active.
        </p>
      )}

    </div>
  );
}