import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

export default function VerifyResetCodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  useEffect(() => {
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
      const res = await api.post("/api/auth/verify-reset-code", {
        email,
        code,
      });

      toast.success("Code verified!");
      localStorage.setItem("resetCode", code); // Save for reset-password step
      navigate("/reset-password");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code.");
      toast.error("Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ minHeight: "100vh", paddingTop: "20vh" }}>
      <h1 className="scene-logo">Enter Reset Code</h1>
      <p style={{ color: "#aaa", marginBottom: "24px", textAlign: "center" }}>
        A 6-digit code was sent to <b>{email}</b>. Enter it below to continue.
      </p>

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

      <input
        type="text"
        placeholder="6-digit code"
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
