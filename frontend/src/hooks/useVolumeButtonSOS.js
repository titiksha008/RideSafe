// src/hooks/useVolumeButtonSOS.js
//
// Detects Volume Down pressed 3× within 2 seconds and calls onTrigger().
// Works app-wide when imported in App.jsx or SOSCenter.jsx.
// Uses Wake Lock API to keep screen alive when armed (best-effort).
//
// Usage:
//   import useVolumeButtonSOS from "../hooks/useVolumeButtonSOS";
//   useVolumeButtonSOS({ armed: true, onTrigger: handleSOS });

import { useEffect, useRef } from "react";

const REQUIRED_PRESSES = 3;
const WINDOW_MS        = 2000; // presses must happen within 2 seconds
const VOLUME_DOWN_CODE = "VolumeDown";

export default function useVolumeButtonSOS({ armed, onTrigger }) {
  const pressTimesRef = useRef([]); // timestamps of recent volume-down presses
  const wakeLockRef   = useRef(null);

  // ── Wake Lock — keeps screen alive so the listener stays active ──
  useEffect(() => {
    if (!armed) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    const acquireWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          // Re-acquire if released by browser (e.g. tab switch)
          wakeLockRef.current.addEventListener("release", () => {
            if (armed) acquireWakeLock();
          });
        }
      } catch (e) {
        // Wake lock not available — listener still works while screen is on
        console.warn("Wake lock unavailable:", e.message);
      }
    };

    acquireWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [armed]);

  // ── Volume key listener ───────────────────────────────────────
  useEffect(() => {
    if (!armed) return;

    const handleKeyDown = (e) => {
      // Match Volume Down on Android Chrome
      const isVolumeDown =
        e.key  === "AudioVolumeDown" ||
        e.code === VOLUME_DOWN_CODE  ||
        e.key  === "VolumeDown";

      if (!isVolumeDown) return;

      // Prevent default volume change — keeps the action discreet
      e.preventDefault();

      const now = Date.now();

      // Prune presses outside the time window
      pressTimesRef.current = pressTimesRef.current.filter(
        (t) => now - t < WINDOW_MS
      );

      // Record this press
      pressTimesRef.current.push(now);

      // Check if we've hit the required count
      if (pressTimesRef.current.length >= REQUIRED_PRESSES) {
        pressTimesRef.current = []; // reset so it doesn't double-fire
        onTrigger();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [armed, onTrigger]);
}