const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  updateEmergencyContacts,
  triggerSOS
} = require("../controllers/profileController");

router.get("/",               auth, getProfile);
router.put("/update",         auth, updateProfile);
router.put("/change-password",auth, changePassword);
router.put("/emergency-contacts", auth, updateEmergencyContacts);
router.post("/sos",           auth, triggerSOS);

module.exports = router;