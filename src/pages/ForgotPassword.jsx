// src/pages/ForgotPassword.jsx
import { useState } from "react";
import axios from "../api/api";

import "../styles/LoginPage.css"; // reuse styling
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';
import { backend } from "../config";
   

const handleSignup = async () => {
  setIsLoading(true);
  try {
    const res = await axios.post("/api/signup", signupData);
    toast.success("Signed up successfully!");
    // redirect or continue
  } catch (err) {
    toast.error("Signup failed. Try again!");
  } finally {
    setIsLoading(false);
  }
};


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleSendCode = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    try {
        await axios.post("/api/auth/forgot-password", { email });
      localStorage.setItem("resetEmail", email); // save for next step
      setStatus("Reset code sent. Please check your email.");
      window.location.href = "/verify-code";
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset code.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">Forgot Password?</h1>
      <p className="welcome-text">Enter your email and we’ll send you a reset code ✉️</p>

      {status && <p style={{ color: "#90ee90" }}>{status}</p>}
      {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}

      <form onSubmit={handleSendCode} className="login-form">
        <input
          type="email"
          placeholder="Your email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" className="login-button">Send Reset Code</button>
      </form>


      <div className="signup-row">
        <a href="/login" className="signup-link">Back to login</a>
      </div>
    </div>
  );
}
