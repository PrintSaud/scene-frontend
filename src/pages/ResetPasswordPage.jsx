import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const email = localStorage.getItem("resetEmail");
  const code = localStorage.getItem("resetCode");

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => {
      document.body.classList.remove("hide-navbar");
    };
  }, []);
  
  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        code,
        newPassword: password,
      });

      toast.success("Password updated!");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        paddingTop: "20vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",      // ✅ Horizontally center children
        justifyContent: "flex-start", // ✅ Vertically push from top
        textAlign: "center",
      }}
    >
  
      <p
        style={{
          color: "#aaa",
          marginBottom: "24px",
          maxWidth: "320px",   // ✅ Prevents full-width stretching
          textAlign: "center", // ✅ Aligns text inside the box
          lineHeight: "1.4",   // ✅ Optional but improves mobile UX
        }}
      >
        Enter your new password below to complete the reset.
      </p>
  
      {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
      )}
  
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="login-input"
      />

      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="login-input"
      />

      <button
        onClick={handleReset}
        className="login-button"
        style={{ marginTop: "18px" }}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}
