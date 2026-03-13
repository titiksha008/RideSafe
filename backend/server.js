const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes      = require("./routes/authRoutes");
const rideRoutes      = require("./routes/rideRoutes");
const profileRoutes   = require("./routes/profileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// connect database
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth",      authRoutes);
app.use("/api/rides",     rideRoutes);
app.use("/api/profile",   profileRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("Cab Safety Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});