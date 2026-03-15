const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// GET /api/dashboard
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const rides     = await Ride.find({ userId: req.userId }).sort({ createdAt: -1 });
    const completed = rides.filter(r => r.status === "COMPLETED");
    const active    = rides.find(r => r.status === "ACTIVE") || null;

    // ✅ Use actualDistance if available, otherwise fall back to planned distance
    const totalDistance = completed.reduce((sum, r) => {
      const dist = r.actualDistance !== null && r.actualDistance !== undefined
        ? r.actualDistance
        : (parseFloat(r.distance) || 0);
      return sum + dist;
    }, 0);

    // ✅ Use actualTime if available, otherwise calculate from startTime/endTime
    const totalTime = completed.reduce((sum, r) => {
      if (r.actualTime !== null && r.actualTime !== undefined) {
        return sum + r.actualTime;
      }
      if (r.startTime && r.endTime) {
        return sum + Math.round((new Date(r.endTime) - new Date(r.startTime)) / 60000);
      }
      return sum; // don't add expectedTime — that's just an estimate
    }, 0);

    res.json({
      user,
      stats: {
        totalRides:    completed.length,
        totalDistance: totalDistance.toFixed(1),
        totalTime,
        activeRide:    active ? active._id : null
      },
      recentRides: rides.slice(0, 5)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;