const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String, default: "" }
});

const userSchema = new mongoose.Schema({

  // existing fields
  firstName:     { type: String, required: true },
  middleName:    { type: String, default: "" },
  lastName:      { type: String, required: true },
  age:           { type: Number },
  contactNumber: { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },

  // new profile fields
  profilePhoto:  { type: String, default: "" },
  vehicleType:   { type: String, enum: ["bike","scooter","car","other"], default: "bike" },
  nightRider:    { type: Boolean, default: false },
  notifications: { type: Boolean, default: true },

  // emergency contacts (max 3)
  emergencyContacts: {
    type: [emergencyContactSchema],
    validate: [arr => arr.length <= 3, "Maximum 3 emergency contacts allowed"]
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);