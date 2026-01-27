import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/LoginPage.css";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => {
      document.body.classList.remove("hide-navbar");
    };
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    const email = localStorage.getItem("resetEmail");
    if (!email) {
      setError("Reset flow expired. Please try again.");
      return setTimeout(() => navigate("/forgot-password"), 1000);
    }

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-reset-code`, {
        email,
        code,
      });

      localStorage.setItem("resetCode", code);
      navigate("/reset-password");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code.");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        paddingTop: "10vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1 className="scene-logo">Verify Code 📩</h1>
      <p
        style={{
          color: "#aaa",
          marginBottom: "24px",
          maxWidth: "320px",
          lineHeight: "1.4",
        }}
      >
        Enter the 6-digit code we sent to your email
      </p>

      {error && (
        <p style={{ color: "#ff4d4d", fontWeight: "500", marginBottom: "12px" }}>{error}</p>
      )}

      <form onSubmit={handleVerify} className="login-form">
        <input
          type="text"
          placeholder="Reset code"
          className="login-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          style={{ textAlign: "center", letterSpacing: "6px", fontSize: "18px" }}
          autoFocus
          required
        />

        <button type="submit" className="login-button" style={{ marginTop: "18px" }}>
          Verify Code
        </button>
      </form>

      <div className="signup-row" style={{ marginTop: "16px" }}>
        <a href="/forgot-password" className="signup-link">← Go back</a>
      </div>
    </div>
  );
}
