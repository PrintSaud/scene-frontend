import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Hide navbar (Scene-specific logic if needed)
    document.body.classList.add("hide-navbar");

    return () => {
      document.body.classList.remove("hide-navbar");
    };
  }, []);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/verify-email-code", {
        email: user.email,
        code,
      });

      toast.success("Email verified!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
      toast.error("Invalid code. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
  className="login-container"
  style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 24px",
    transform: "translateY(-10%)",
  }}
>

      <h1 className="scene-logo">Verify Your Email</h1>
      <p style={{ color: "#aaa", marginBottom: "24px", textAlign: "center" }}>
        We've sent a 6-digit code to <b>{user.email}</b><br />
        Enter it below to activate your account.
      </p>

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="login-input"
        style={{ textAlign: "center", letterSpacing: "6px", fontSize: "18px" }}
      />

      <button
        onClick={handleVerify}
        className="login-button"
        style={{ marginTop: "18px" }}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}
