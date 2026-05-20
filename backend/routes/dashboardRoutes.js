import express from "express";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const rides = await Ride.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    const completed = rides.filter((r) => r.status === "COMPLETED");
    const active = rides.find((r) => r.status === "ACTIVE") || null;

    // Only real covered distance, never planned distance
    const totalDistance = completed.reduce((sum, r) => {
      return sum + (Number(r.actualDistance) || 0);
    }, 0);

    // Only real ride time, never expected time
    const totalTime = completed.reduce((sum, r) => {
      if (!r.startTime || !r.endTime) return sum;

      const minutes = Math.round(
        (new Date(r.endTime) - new Date(r.startTime)) / 60000
      );

      return sum + Math.max(minutes, 0);
    }, 0);

    const recentRides = rides.slice(0, 5).map((r) => ({
      ...r.toObject(),
      displayDistance:
        r.actualDistance !== undefined && r.actualDistance !== null
          ? r.actualDistance
          : 0,
      displayTime:
        r.startTime && r.endTime
          ? Math.max(
              Math.round((new Date(r.endTime) - new Date(r.startTime)) / 60000),
              0
            )
          : 0,
    }));

    res.json({
      user,
      stats: {
        totalRides: completed.length,
        totalDistance: totalDistance.toFixed(3),
        totalTime,
        activeRide: active ? active._id : null,
      },
      recentRides,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;