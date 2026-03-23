// src/hooks/useShakeSOS.js
//
// Detects 3 strong shakes within 3 seconds → calls onTrigger().
// Android Chrome: works automatically, no permission needed.
// iOS 13+: needs one-time permission tap — call requestPermission() on a button click.
//
// Usage:
//   const { requestPermission, permissionState } = useShakeSOS({ armed, onTrigger, onProgress });
//
// permissionState: "unknown" | "prompt" | "granted" | "denied" | "unavailable"

import { useEffect, useRef, useCallback, useState } from "react";

const SHAKE_THRESHOLD = 22;   // sum of axis deltas to count as a shake
const REQUIRED_SHAKES = 3;
const WINDOW_MS       = 3000; // all 3 shakes must happen within this window
const COOLDOWN_MS     = 400;  // minimum gap between two shake counts

export default function useShakeSOS({ armed, onTrigger, onProgress }) {
  const shakeTimesRef = useRef([]);
  const lastShakeRef  = useRef(0);
  const lastAccelRef  = useRef({ x: 0, y: 0, z: 0 });
  const [permissionState, setPermissionState] = useState("unknown");

  // ── Detect permission model on mount ─────────────────────────
  useEffect(() => {
    if (!window.DeviceMotionEvent) {
      setPermissionState("unavailable");
    } else if (typeof DeviceMotionEvent.requestPermission === "function") {
      setPermissionState("prompt"); // iOS 13+
    } else {
      setPermissionState("granted"); // Android Chrome
    }
  }, []);

  // ── iOS permission (must be triggered by a user gesture) ─────
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent?.requestPermission === "function") {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        const ok  = res === "granted";
        setPermissionState(ok ? "granted" : "denied");
        return ok;
      } catch {
        setPermissionState("denied");
        return false;
      }
    }
    setPermissionState("granted");
    return true;
  }, []);

  // ── Motion handler ────────────────────────────────────────────
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const { x = 0, y = 0, z = 0 } = acc;
    const delta =
      Math.abs(x - lastAccelRef.current.x) +
      Math.abs(y - lastAccelRef.current.y) +
      Math.abs(z - lastAccelRef.current.z);
    lastAccelRef.current = { x, y, z };

    const now = Date.now();
    if (delta > SHAKE_THRESHOLD && now - lastShakeRef.current > COOLDOWN_MS) {
      lastShakeRef.current = now;

      shakeTimesRef.current = shakeTimesRef.current.filter(t => now - t < WINDOW_MS);
      shakeTimesRef.current.push(now);

      const count = shakeTimesRef.current.length;
      onProgress?.(Math.min(count, REQUIRED_SHAKES));

      if (count >= REQUIRED_SHAKES) {
        shakeTimesRef.current = [];
        onProgress?.(0);
        onTrigger();
      }
    }
  }, [onTrigger, onProgress]);

  // ── Attach / detach listener ──────────────────────────────────
  useEffect(() => {
    if (!armed || permissionState !== "granted") {
      shakeTimesRef.current = [];
      onProgress?.(0);
      return;
    }
    window.addEventListener("devicemotion", handleMotion, { passive: true });
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      shakeTimesRef.current = [];
      onProgress?.(0);
    };
  }, [armed, permissionState, handleMotion, onProgress]);

  return { requestPermission, permissionState };
}