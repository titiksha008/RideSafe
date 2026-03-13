//authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// SIGNUP
const signupUser = async (req, res) => {

  try {

    const {
      firstName,
      middleName,
      lastName,
      age,
      contactNumber,
      email,
      password
    } = req.body;

    // check required fields
    if (!firstName || !lastName || !contactNumber || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = new User({
      firstName,
      middleName,
      lastName,
      age,
      contactNumber,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

};



// LOGIN
const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

};


module.exports = {
  signupUser,
  loginUser
};