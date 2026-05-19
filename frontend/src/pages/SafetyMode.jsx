import React from "react";
import { useSafetyMode } from "../context/SafetyModeContext";

const SafetyMode = () => {
  const {
    isSafetyMode,
    seconds,
    enableSafetyMode,
    disableSafetyMode,
  } = useSafetyMode();

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
        gap: "20px",
      }}
    >
      <h1>Safety Mode</h1>

      <h2>Status: {isSafetyMode ? "ACTIVE" : "INACTIVE"}</h2>

      <h2>Timer: {formatTime(seconds)}</h2>

      {!isSafetyMode ? (
        <button
          onClick={enableSafetyMode}
          style={{
            padding: "12px 24px",
            fontSize: "18px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Enable Safety Mode
        </button>
      ) : (
        <button
          onClick={disableSafetyMode}
          style={{
            padding: "12px 24px",
            fontSize: "18px",
            background: "red",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Disable Safety Mode
        </button>
      )}
    </div>
  );
};

export default SafetyMode;