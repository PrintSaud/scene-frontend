import { useState } from "react";
import axios from "axios";
import "../styles/LoginPage.css";
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';
import { backend } from "../config"; // ✅ correct with named export


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


export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    const email = localStorage.getItem("resetEmail");
    const code = localStorage.getItem("resetCode");

    try {
await axios.put(`${backend}/api/auth/reset-password`, {

        email,
        code,
        password,
      });

      setSuccess("Password updated successfully! Redirecting to login...");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">Set New Password 🔐</h1>
      <p className="welcome-text">Make it something secure</p>

      {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleReset} className="login-form">
        <input
          type="password"
          placeholder="New password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="login-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button type="submit" className="login-button">Update Password</button>
        <button disabled={isLoading} style={{ padding: "10px 20px", borderRadius: "5px" }}>
  {isLoading ? (
    <FaSpinner className="spin" style={{ fontSize: "18px" }} />
  ) : (
    "Reset Password"
  )}
</button>

      </form>
    </div>
  );
}
