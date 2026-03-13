const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const auth = require("../middleware/authMiddleware");

// START RIDE — now saves userId from token
router.post("/start", auth, async (req, res) => {
  try {
    const ride = new Ride({ ...req.body, userId: req.userId });
    await ride.save();
    res.json({ ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting ride", error: err });
  }
});

// GET RIDE
router.get("/:rideId", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: "Error fetching ride", error: err });
  }
});

// UPDATE LOCATION
router.post("/update-location", async (req, res) => {
  const { rideId, lat, lng } = req.body;
  const ride = await Ride.findByIdAndUpdate(
    rideId,
    { currentLocation: { lat, lng } },
    { new: true }
  );
  res.json(ride);
});

// STOP RIDE
router.post("/stop", async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: "COMPLETED", endTime: new Date() },
      { new: true }
    );
    res.json({ message: "Ride completed", ride });
  } catch (err) {
    res.status(500).json({ message: "Error stopping ride", error: err });
  }
});

module.exports = router;