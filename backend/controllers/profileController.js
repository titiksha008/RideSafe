const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ─── GET PROFILE ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      age,
      contactNumber,
      vehicleType,
      nightRider,
      notifications,
      profilePhoto
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        middleName,
        lastName,
        age,
        contactNumber,
        vehicleType,
        nightRider,
        notifications,
        profilePhoto
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── UPDATE EMERGENCY CONTACTS ────────────────────────────────────────────────
exports.updateEmergencyContacts = async (req, res) => {
  try {
    const { contacts } = req.body; // array of { name, phone, relation }

    if (!Array.isArray(contacts) || contacts.length > 3) {
      return res.status(400).json({ message: "Provide an array of up to 3 contacts" });
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { emergencyContacts: contacts },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Emergency contacts updated", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── SOS ─────────────────────────────────────────────────────────────────────
// Saves the SOS event and returns contacts so frontend can dial/message them
exports.triggerSOS = async (req, res) => {
  try {
    const { lat, lng, rideId } = req.body;

    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return res.status(400).json({ message: "No emergency contacts set" });
    }

    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // Return contacts + location so frontend can trigger WhatsApp / SMS
    res.json({
      message: "SOS triggered",
      contacts: user.emergencyContacts,
      location: { lat, lng, mapsLink },
      rideId: rideId || null,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.contactNumber
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};