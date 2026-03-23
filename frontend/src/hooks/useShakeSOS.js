// src/hooks/useShakeSOS.js
//
// Detects 3 strong shakes within 4 seconds → calls onTrigger().
// Android Chrome : works automatically, no permission needed.
// iOS 13+        : needs one-time permission tap via requestPermission().
//
// permissionState: "unknown" | "prompt" | "granted" | "denied" | "unavailable"

import { useEffect, useRef, useCallback, useState } from "react";

const SHAKE_THRESHOLD = 15;   // lowered: sum of axis deltas to count as a shake
const REQUIRED_SHAKES = 3;
const WINDOW_MS       = 4000; // widened: all 3 shakes must happen within this window
const COOLDOWN_MS     = 250;  // lowered: minimum gap between two shake counts

export default function useShakeSOS({ armed, onTrigger, onProgress }) {
  const shakeTimesRef = useRef([]);
  const lastShakeRef  = useRef(0);
  const lastAccelRef  = useRef({ x: 0, y: 0, z: 0 });
  const triggeredRef  = useRef(false); // prevent double-fire in same gesture
  const [permissionState, setPermissionState] = useState("unknown");

  // ── Detect permission model on mount ─────────────────────────────────────
  useEffect(() => {
    if (!window.DeviceMotionEvent) {
      setPermissionState("unavailable");
      return;
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      // iOS 13+ — check if permission was already granted in a previous session
      // We can't read the current state without calling requestPermission(), but we
      // can fire a one-time test listener: if the browser delivers an event within
      // 200ms, permission is already granted (no dialog was shown).
      let resolved = false;
      const testHandler = () => {
        if (!resolved) {
          resolved = true;
          setPermissionState("granted");
          window.removeEventListener("devicemotion", testHandler);
        }
      };
      window.addEventListener("devicemotion", testHandler, { passive: true });
      setTimeout(() => {
        window.removeEventListener("devicemotion", testHandler);
        if (!resolved) {
          // No event arrived → permission not yet granted
          setPermissionState("prompt");
        }
      }, 300);
    } else {
      // Android / desktop — permission not required
      setPermissionState("granted");
    }
  }, []);

  // ── iOS permission request (must be called from a user-gesture handler) ──
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent?.requestPermission === "function") {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        const ok = result === "granted";
        setPermissionState(ok ? "granted" : "denied");
        return ok;
      } catch (err) {
        console.warn("DeviceMotion permission error:", err);
        setPermissionState("denied");
        return false;
      }
    }
    // Android — always granted
    setPermissionState("granted");
    return true;
  }, []);

  // ── Motion handler ────────────────────────────────────────────────────────
  const handleMotion = useCallback(
    (e) => {
      // Prefer accelerationIncludingGravity for broadest device support
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;

      const { x = 0, y = 0, z = 0 } = acc;
      const prev = lastAccelRef.current;

      const delta =
        Math.abs(x - prev.x) +
        Math.abs(y - prev.y) +
        Math.abs(z - prev.z);

      lastAccelRef.current = { x, y, z };

      const now = Date.now();

      if (delta > SHAKE_THRESHOLD && now - lastShakeRef.current > COOLDOWN_MS) {
        lastShakeRef.current = now;

        // Prune shakes outside the time window
        shakeTimesRef.current = shakeTimesRef.current.filter(
          (t) => now - t < WINDOW_MS
        );
        shakeTimesRef.current.push(now);

        const count = shakeTimesRef.current.length;
        onProgress?.(Math.min(count, REQUIRED_SHAKES));

        if (count >= REQUIRED_SHAKES && !triggeredRef.current) {
          triggeredRef.current = true;

          // Show 3rd dot briefly before resetting
          setTimeout(() => {
            shakeTimesRef.current = [];
            triggeredRef.current  = false;
            onProgress?.(0);
          }, 600);

          onTrigger();
        }
      }
    },
    [onTrigger, onProgress]
  );

  // ── Attach / detach listener based on arm state ───────────────────────────
  useEffect(() => {
    if (!armed || permissionState !== "granted") {
      shakeTimesRef.current = [];
      triggeredRef.current  = false;
      onProgress?.(0);
      return;
    }

    window.addEventListener("devicemotion", handleMotion, { passive: true });

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      shakeTimesRef.current = [];
      triggeredRef.current  = false;
      onProgress?.(0);
    };
  }, [armed, permissionState, handleMotion, onProgress]);

  return { requestPermission, permissionState };
}