const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
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

  // planned values set at ride start
  distance:        { type: String, default: "0" },
  expectedTime:    { type: Number, default: 0 },

  // actual values filled when ride stops
  actualDistance:  { type: Number, default: null }, // km actually covered
  actualTime:      { type: Number, default: null }, // minutes actually taken

  status: {
    type: String,
    enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
    default: "ACTIVE"
  },

  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date }

}, { timestamps: true });

module.exports = mongoose.model("Ride", rideSchema);