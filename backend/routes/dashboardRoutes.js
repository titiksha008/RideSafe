const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// GET /api/dashboard
// Returns user profile + ride stats + recent rides
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // All rides for this user
    const rides = await Ride.find({ userId: req.userId }).sort({ createdAt: -1 });

    const completed = rides.filter(r => r.status === "COMPLETED");
    const active    = rides.find(r => r.status === "ACTIVE") || null;

    // Total distance (sum of all completed rides)
    const totalDistance = completed.reduce((sum, r) => {
      return sum + (parseFloat(r.distance) || 0);
    }, 0);

    // Total time in minutes
    const totalTime = completed.reduce((sum, r) => {
      if (r.startTime && r.endTime) {
        return sum + Math.round((new Date(r.endTime) - new Date(r.startTime)) / 60000);
      }
      return sum + (r.expectedTime || 0);
    }, 0);

    res.json({
      user,
      stats: {
        totalRides:    completed.length,
        totalDistance: totalDistance.toFixed(1),
        totalTime,
        activeRide:    active ? active._id : null
      },
      recentRides: rides.slice(0, 5) // last 5 rides
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;