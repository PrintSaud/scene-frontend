// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import axios from "../api/api";
import "../styles/LoginPage.css";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext"; // ⬅️ add this

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setLanguage } = useLanguage(); // ⬅️ add this

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post(`/api/auth/login`, { email, password });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        token: res.data.token,
      };

      // Store user
      localStorage.setItem("user", JSON.stringify(mergedUser));
      // ⬅️ Flip UI language immediately (per-user)
      setLanguage(res.data.user?.language || "en");

      toast.success("Logged in successfully!");
      navigate("/home"); // use SPA navigation so context change applies instantly
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      toast.error("Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">
        Scene <span className="popcorn">🎭</span>
      </h1>
      <p className="welcome-text">Welcome back! We missed you!</p>

      {error && (
        <p style={{ color: "#ff4d4d", fontSize: "0.15rem", marginBottom: "10px", textAlign: "center" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "10px" }}>
          <span
            onClick={() => navigate("/forgot-password")}
            style={{ color: "#aaa", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
          >
            Forgot password?
          </span>
        </div>

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? <FaSpinner className="spin" style={{ fontSize: "18px" }} /> : "Login"}
        </button>
      </form>

      <div className="signup-row" style={{ marginTop: "15px" }}>
        <span>Don’t have an account?</span>
        <a href="/signup" className="signup-link">
          Sign up
        </a>
      </div>
    </div>
  );
}
