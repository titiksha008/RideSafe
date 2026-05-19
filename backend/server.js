import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import recordingRoutes from "./routes/recordingRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import callAiRoutes from "./routes/callAiRoutes.js";

dotenv.config();

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ride-safe-frontend.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Cab Safety Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/call-ai", callAiRoutes);

app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});