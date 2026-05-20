import express from "express";
import Ride from "../models/Ride.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ── START RIDE ─────────────────────────────────────────
router.post("/start", auth, async (req, res) => {
  try {
    const {
      lat,
      lng,
      startLocationName,
      destLat,
      destLng,
      destinationName,
      vehicleType,
      distance,
      expectedTime,
    } = req.body;

    await Ride.updateMany(
      { userId: req.userId, status: "ACTIVE" },
      {
        status: "CANCELLED",
        endTime: new Date(),
        actualDistance: 0,
        actualTime: 0,
      }
    );

    const ride = new Ride({
      userId: req.userId,
      startLocation: { lat, lng },
      currentLocation: { lat, lng },
      startLocationName,
      endLocation: { lat: destLat, lng: destLng },
      destinationName,
      vehicleType,

      // planned values
      distance: Number(distance) || 0,
      expectedTime: Number(expectedTime) || 0,

      // real values start from zero
      actualDistance: 0,
      actualTime: 0,

      status: "ACTIVE",
      startTime: new Date(),
    });

    await ride.save();

    res.status(201).json({
      message: "Ride started successfully",
      ride,
    });
  } catch (err) {
    console.error("Start ride error:", err);
    res.status(500).json({ message: "Error starting ride", error: err.message });
  }
});

// ── GET RIDE ───────────────────────────────────────────
router.get("/:rideId", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.userId && ride.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised to view this ride." });
    }

    res.json(ride);
  } catch (err) {
    console.error("Fetch ride error:", err);
    res.status(500).json({ message: "Error fetching ride", error: err.message });
  }
});

// ── UPDATE LOCATION ────────────────────────────────────
router.post("/update-location", auth, async (req, res) => {
  try {
    const { rideId, lat, lng, actualDistance } = req.body;

    const updateData = {
      currentLocation: { lat, lng },
    };

    // Save real distance while ride is active, if frontend sends it
    if (actualDistance !== undefined && actualDistance !== null) {
      updateData.actualDistance = Math.max(Number(actualDistance) || 0, 0);
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        userId: req.userId,
        status: "ACTIVE",
      },
      updateData,
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: "Active ride not found" });
    }

    res.json(ride);
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ message: "Error updating location", error: err.message });
  }
});

// ── STOP RIDE ──────────────────────────────────────────
router.post("/stop", auth, async (req, res) => {
  try {
    const { rideId, actualDistance } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "ACTIVE") {
      return res.status(400).json({
        message: `Ride is already ${ride.status.toLowerCase()}.`,
      });
    }

    if (ride.userId && ride.userId.toString() !== req.userId) {
      return res.status(403).json({
        message: "Not authorised to stop this ride.",
      });
    }

    const endTime = new Date();

    const actualTime = ride.startTime
      ? Math.max(Math.round((endTime - new Date(ride.startTime)) / 60000), 0)
      : 0;

    let finalActualDistance = 0;

    if (actualDistance !== undefined && actualDistance !== null) {
      finalActualDistance = Math.max(Number(actualDistance) || 0, 0);
    } else if (ride.actualDistance !== undefined && ride.actualDistance !== null) {
      finalActualDistance = Math.max(Number(ride.actualDistance) || 0, 0);
    }

    ride.status = "COMPLETED";
    ride.endTime = endTime;
    ride.actualTime = actualTime;
    ride.actualDistance = finalActualDistance;

    await ride.save();

    res.json({
      message: "Ride completed",
      ride,
    });
  } catch (err) {
    console.error("Stop ride error:", err);
    res.status(500).json({ message: "Error stopping ride", error: err.message });
  }
});

export default router;