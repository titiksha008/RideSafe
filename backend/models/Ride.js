const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({

  // link ride to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // not required so existing rides don't break
  },

  startLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },

  endLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },

  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },

  destinationName: { type: String, default: "" },
  vehicleType:     { type: String, default: "" },
  distance:        { type: String, default: "0" },
  expectedTime:    { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
    default: "ACTIVE"
  },

  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date }

}, { timestamps: true });

module.exports = mongoose.model("Ride", rideSchema);