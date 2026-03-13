
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Auth() {

  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    contactNumber: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      if (isLogin) {

        const res = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email: formData.email,
            password: formData.password
          }
        );

        localStorage.setItem("token", res.data.token);

        alert("Login successful");

        navigate("/profile");

      } else {

        const res = await axios.post(
          "http://localhost:5000/api/auth/signup",
          formData
        );

        alert(res.data.message);

        setIsLogin(true);

      }

    } catch (error) {

      alert(error.response?.data?.message || "Something went wrong");

    }
  };

  return (
    <div className="auth-container">

      <div className="auth-box">

        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <input name="firstName" placeholder="First Name" onChange={handleChange} required />
              <input name="middleName" placeholder="Middle Name (optional)" onChange={handleChange} />
              <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
              <input name="age" type="number" placeholder="Age (optional)" onChange={handleChange} />
              <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} required />
            </>
          )}

          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />

          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />

          <button type="submit">
            {isLogin ? "Login" : "Sign Up"}
          </button>

        </form>

        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}

          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ cursor: "pointer", color: "blue" }}
          >
            {isLogin ? " Sign Up" : " Login"}
          </span>
        </p>

        <button onClick={() => navigate("/")}>
          Back
        </button>

      </div>

    </div>
  );
}

export default Auth;