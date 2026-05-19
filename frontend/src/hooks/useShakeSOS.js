// src/hooks/useShakeSOS.js
import { useCallback, useEffect, useRef, useState } from "react";

const SHAKE_THRESHOLD = 18;
const REQUIRED_SHAKES = 3;
const WINDOW_MS = 4000;
const COOLDOWN_MS = 500;

export default function useShakeSOS({ armed, onTrigger, onProgress }) {
  const [permissionState, setPermissionState] = useState("unknown");

  const lastAccelRef = useRef(null);
  const shakeTimesRef = useRef([]);
  const lastShakeRef = useRef(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.DeviceMotionEvent) {
      setPermissionState("unavailable");
      return;
    }

    if (typeof window.DeviceMotionEvent.requestPermission === "function") {
      setPermissionState("prompt");
    } else {
      setPermissionState("granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!window.DeviceMotionEvent) {
      setPermissionState("unavailable");
      return false;
    }

    if (typeof window.DeviceMotionEvent.requestPermission === "function") {
      try {
        const result = await window.DeviceMotionEvent.requestPermission();
        const granted = result === "granted";
        setPermissionState(granted ? "granted" : "denied");
        return granted;
      } catch (err) {
        console.error("Motion permission error:", err);
        setPermissionState("denied");
        return false;
      }
    }

    setPermissionState("granted");
    return true;
  }, []);

  useEffect(() => {
    if (!armed || permissionState !== "granted") {
      lastAccelRef.current = null;
      shakeTimesRef.current = [];
      triggeredRef.current = false;
      onProgress?.(0);
      return;
    }

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      if (!lastAccelRef.current) {
        lastAccelRef.current = { x, y, z };
        return;
      }

      const prev = lastAccelRef.current;

      const delta =
        Math.abs(x - prev.x) +
        Math.abs(y - prev.y) +
        Math.abs(z - prev.z);

      lastAccelRef.current = { x, y, z };

      const now = Date.now();

      if (delta > SHAKE_THRESHOLD && now - lastShakeRef.current > COOLDOWN_MS) {
        lastShakeRef.current = now;

        shakeTimesRef.current = shakeTimesRef.current.filter(
          (time) => now - time <= WINDOW_MS
        );

        shakeTimesRef.current.push(now);

        const count = Math.min(shakeTimesRef.current.length, REQUIRED_SHAKES);
        onProgress?.(count);

        if (count >= REQUIRED_SHAKES && !triggeredRef.current) {
          triggeredRef.current = true;
          onTrigger?.();

          setTimeout(() => {
            shakeTimesRef.current = [];
            triggeredRef.current = false;
            onProgress?.(0);
          }, 1000);
        }
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      lastAccelRef.current = null;
      shakeTimesRef.current = [];
      triggeredRef.current = false;
      onProgress?.(0);
    };
  }, [armed, permissionState, onTrigger, onProgress]);

  return { requestPermission, permissionState };
}