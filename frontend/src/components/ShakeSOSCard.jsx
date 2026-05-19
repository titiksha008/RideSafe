// src/components/ShakeSOSCard.jsx
import React from "react";
import "../styles/ShakeSOSCard.css";

export default function ShakeSOSCard({
  armed,
  onToggle,
  shakeCount = 0,
  permissionState, // "unknown" | "prompt" | "granted" | "denied" | "unavailable"
  onRequestPermission,
}) {
  const isUnavailable = permissionState === "unavailable";
  const isDenied      = permissionState === "denied";
  const needsPrompt   = permissionState === "prompt";
  const isUnknown     = permissionState === "unknown";
  const canArm        = permissionState === "granted";

  // ── Arm button handler ────────────────────────────────────────
  const handleArmBtn = async () => {
    if (armed) {
      onToggle(false);
      return;
    }

    // iOS: request permission then arm in one tap
    if (needsPrompt || isUnknown) {
      const granted = await onRequestPermission();
      if (granted) onToggle(true);
      return;
    }

    if (canArm) onToggle(true);
  };

  // ── Standalone iOS permission button (shown below arm btn) ────
  const handlePermissionBtn = async () => {
    await onRequestPermission();
  };

  return (
    <div
      className={[
        "shake-card",
        armed         ? "shake-card-armed"       : "",
        isUnavailable ? "shake-card-unavailable" : "",
        isDenied      ? "shake-card-denied"      : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Header row ──────────────────────────────────────────── */}
      <div className="shake-header">
        <div className={`shake-icon-wrap ${armed ? "shake-icon-armed" : ""}`}>
          <span className="shake-icon">📳</span>
        </div>

        <div className="shake-info">
          <p className="shake-title">Shake to SOS</p>
          <p className="shake-desc">Shake phone 3× hard to trigger SOS</p>
        </div>

        {/* Right-side badge for non-actionable states only */}
        {isUnavailable && (
          <span className="shake-badge shake-badge-unavailable">Not Supported</span>
        )}
        {isDenied && (
          <span className="shake-badge shake-badge-denied">Denied</span>
        )}
        {isUnknown && (
          <span className="shake-badge shake-badge-unknown">Checking…</span>
        )}
        {/* Armed live indicator replaces toggle in header */}
        {armed && canArm && (
          <span className="shake-badge shake-badge-denied" style={{
            background: "rgba(245,158,11,0.12)",
            borderColor: "rgba(245,158,11,0.4)",
            color: "#fde68a",
          }}>● LIVE</span>
        )}
      </div>

      {/* ── Progress dots (shown when device is capable) ──────────── */}
      {(canArm || needsPrompt) && (
        <div className="shake-dots-row">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={[
                "shake-dot",
                armed           ? "shake-dot-armed"  : "",
                shakeCount >= n ? "shake-dot-active"  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      )}

      {/* ── Status text ───────────────────────────────────────────── */}
      {(canArm || needsPrompt) && (
        <div
          className={`shake-status ${
            armed ? "shake-status-armed" : "shake-status-idle"
          }`}
        >
          <span className="shake-status-dot" />
          <span className="shake-status-text">
            {armed
              ? shakeCount > 0
                ? `${shakeCount}/3 shakes — keep going!`
                : "Armed — shake your phone 3× hard"
              : needsPrompt
              ? "Tap below to allow motion &amp; arm"
              : "Disarmed — tap below to activate"}
          </span>
        </div>
      )}

      {/* ── BIG ARM / DISARM BUTTON ──────────────────────────────────
          Full-width, 56 px tall — replaces the small toggle.
          Shown whenever the device is capable (granted or prompt).
      ───────────────────────────────────────────────────────────── */}
      {!isUnavailable && !isDenied && !isUnknown && (
        <button
          className={`shake-arm-btn ${
            armed ? "shake-arm-btn-disarm" : "shake-arm-btn-arm"
          }`}
          onClick={handleArmBtn}
          aria-label={armed ? "Disarm shake SOS" : "Arm shake SOS"}
        >
          <span className="shake-arm-btn-icon">
            {armed ? "🛡️" : needsPrompt ? "📱" : "🔔"}
          </span>
          <span>
            {armed
              ? "ARMED — Tap to Disarm"
              : needsPrompt
              ? "Allow Motion & Arm"
              : "Arm Shake SOS"}
          </span>
        </button>
      )}

      {/* ── iOS: separate permission-only button (optional, below arm btn) ── */}
      {needsPrompt && !armed && (
        <button className="shake-permission-btn" onClick={handlePermissionBtn}>
          📱 Allow motion access only (iOS)
        </button>
      )}

      {/* ── Denied: recovery instructions ─────────────────────────── */}
      {isDenied && (
        <p className="shake-denied-note">
          Motion access was denied. On iOS go to{" "}
          <strong>Settings → Safari → Motion &amp; Orientation Access</strong> and
          re-enable it, then reload this page.
        </p>
      )}

      {/* ── Unavailable ───────────────────────────────────────────── */}
      {isUnavailable && (
        <p className="shake-unavailable-note">
          Your browser doesn't support motion detection. Try opening this page in{" "}
          <strong>Chrome on Android</strong> or <strong>Safari on iPhone</strong>.
        </p>
      )}

      {/* ── Active tip ────────────────────────────────────────────── */}
      {armed && canArm && (
        <p className="shake-note">
          ✅ Shake detection is active. Keep this tab open — detection stays on
          even when your screen is locked.
        </p>
      )}
    </div>
  );
}