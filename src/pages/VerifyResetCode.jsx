import { useState } from "react";
import axios from "axios";
import "../styles/LoginPage.css";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    const email = localStorage.getItem("resetEmail");
    if (!email) {
      setError("Reset flow expired. Please try again.");
      return window.location.href = "/forgot-password";
    }

    try {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-reset-code`, {

        email,
        code,
      });

      localStorage.setItem("resetCode", code); // Save for next step
      window.location.href = "/reset-password";
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">Verify Code 📩</h1>
      <p className="welcome-text">Enter the 6-digit code we sent to your email</p>

      {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}

      <form onSubmit={handleVerify} className="login-form">
        <input
          type="text"
          placeholder="Reset code"
          className="login-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        <button type="submit" className="login-button">Verify Code</button>
      </form>

      <div className="signup-row">
        <a href="/forgot-password" className="signup-link">Go back</a>
      </div>
    </div>
  );
}
