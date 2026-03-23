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

  // ── Toggle handler ──────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (armed) {
      onToggle(false);
      return;
    }

    // If iOS hasn't given permission yet, request it first
    if (needsPrompt || isUnknown) {
      const granted = await onRequestPermission();
      if (!granted) return;
      // onRequestPermission updates permissionState in the hook;
      // the parent will re-render with "granted" and we can arm now
      onToggle(true);
      return;
    }

    if (canArm) {
      onToggle(true);
    }
  };

  // ── Permission request standalone button (shown before arming on iOS) ──
  const handlePermissionBtn = async () => {
    await onRequestPermission();
    // After granting, user still needs to press the toggle to arm
  };

  return (
    <div
      className={[
        "shake-card",
        armed        ? "shake-card-armed"       : "",
        isUnavailable ? "shake-card-unavailable" : "",
        isDenied      ? "shake-card-denied"      : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="shake-header">
        <div className={`shake-icon-wrap ${armed ? "shake-icon-armed" : ""}`}>
          <span className="shake-icon">📳</span>
        </div>

        <div className="shake-info">
          <p className="shake-title">Shake to SOS</p>
          <p className="shake-desc">Shake phone 3× hard to trigger SOS</p>
        </div>

        {/* Right-side control */}
        {isUnavailable ? (
          <span className="shake-badge shake-badge-unavailable">Not Supported</span>
        ) : isDenied ? (
          <span className="shake-badge shake-badge-denied">Denied</span>
        ) : isUnknown ? (
          <span className="shake-badge shake-badge-unknown">Checking…</span>
        ) : (
          /* Toggle for both "prompt" (iOS pre-permission) and "granted" states */
          <button
            className={`shake-toggle ${armed ? "shake-toggle-on" : "shake-toggle-off"}`}
            onClick={handleToggle}
            aria-label={armed ? "Disarm shake SOS" : "Arm shake SOS"}
          >
            <span className="shake-toggle-knob" />
          </button>
        )}
      </div>

      {/* ── iOS: explicit permission button (shown before first grant) ── */}
      {needsPrompt && !armed && (
        <button className="shake-permission-btn" onClick={handlePermissionBtn}>
          📱 Allow motion access (required on iOS)
        </button>
      )}

      {/* ── Denied: recovery instructions ── */}
      {isDenied && (
        <p className="shake-denied-note">
          Motion access was denied. On iOS go to{" "}
          <strong>Settings → Safari → Motion &amp; Orientation Access</strong> and
          re-enable it, then reload this page.
        </p>
      )}

      {/* ── Unavailable ── */}
      {isUnavailable && (
        <p className="shake-unavailable-note">
          Your browser doesn't support motion detection. Try opening this page in{" "}
          <strong>Chrome on Android</strong> or <strong>Safari on iPhone</strong>.
        </p>
      )}

      {/* ── Progress dots — shown when device is capable ── */}
      {(canArm || needsPrompt) && (
        <div className="shake-dots-row">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={[
                "shake-dot",
                armed              ? "shake-dot-armed"  : "",
                shakeCount >= n    ? "shake-dot-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      )}

      {/* ── Status text ── */}
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
              ? "Tap the button above to allow motion access"
              : "Disarmed — toggle to activate"}
          </span>
        </div>
      )}

      {/* ── Active tip ── */}
      {armed && canArm && (
        <p className="shake-note">
          ✅ Shake detection is active. Keep this tab open — detection stays on
          even when your screen is locked.
        </p>
      )}
    </div>
  );
}