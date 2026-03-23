// src/components/ShakeSOSCard.jsx
import React from "react";
import "../styles/ShakeSOSCard.css";

export default function ShakeSOSCard({
  armed,
  onToggle,
  shakeCount = 0,
  permissionState, // "unknown"|"prompt"|"granted"|"denied"|"unavailable"
  onRequestPermission,
}) {
  const unavailable = permissionState === "unavailable";
  const needsPrompt = permissionState === "prompt";
  const denied      = permissionState === "denied";
  const canArm      = !unavailable && !denied;

  const handleToggle = async () => {
    if (armed) { onToggle(false); return; }
    if (needsPrompt) {
      const granted = await onRequestPermission();
      if (!granted) return;
    }
    onToggle(true);
  };

  return (
    <div className={`shake-card ${armed ? "shake-card-armed" : ""} ${unavailable ? "shake-card-unavailable" : ""}`}>

      <div className="shake-header">
        <div className={`shake-icon-wrap ${armed ? "shake-icon-armed" : ""}`}>
          <span className="shake-icon">📳</span>
        </div>
        <div className="shake-info">
          <p className="shake-title">Shake to SOS</p>
          <p className="shake-desc">Shake phone 3× hard to trigger SOS</p>
        </div>

        {unavailable ? (
          <span className="shake-badge shake-badge-unavailable">Not Supported</span>
        ) : denied ? (
          <span className="shake-badge shake-badge-denied">Denied</span>
        ) : (
          <button
            className={`shake-toggle ${armed ? "shake-toggle-on" : "shake-toggle-off"}`}
            onClick={handleToggle}
            aria-label={armed ? "Disarm shake SOS" : "Arm shake SOS"}
          >
            <span className="shake-toggle-knob" />
          </button>
        )}
      </div>

      {/* iOS permission prompt */}
      {needsPrompt && !armed && (
        <button className="shake-permission-btn" onClick={onRequestPermission}>
          Tap here to allow motion access (required on iOS)
        </button>
      )}

      {/* Denied instructions */}
      {denied && (
        <p className="shake-denied-note">
          Motion permission was denied. On iOS, go to <strong>Settings → Safari → Motion & Orientation Access</strong> to re-enable, then reload the page.
        </p>
      )}

      {unavailable && (
        <p className="shake-unavailable-note">
          Your browser doesn't support motion detection. Try opening this page in Chrome on Android.
        </p>
      )}

      {/* Progress dots — shown when available */}
      {canArm && (
        <div className="shake-dots-row">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`shake-dot ${armed ? "shake-dot-armed" : ""} ${shakeCount >= n ? "shake-dot-active" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Status */}
      {canArm && (
        <div className={`shake-status ${armed ? "shake-status-armed" : "shake-status-idle"}`}>
          <span className="shake-status-dot" />
          <span className="shake-status-text">
            {armed
              ? shakeCount > 0
                ? `${shakeCount}/3 shakes — keep going!`
                : "Armed — shake your phone 3× hard"
              : needsPrompt
              ? "Tap the button above to enable"
              : "Disarmed — toggle to activate"}
          </span>
        </div>
      )}

      {armed && !unavailable && !denied && (
        <p className="shake-note">
          ✅ Works on Android automatically. Works on iOS after the permission tap above.
          Keep this tab open for detection to stay active.
        </p>
      )}
    </div>
  );
}