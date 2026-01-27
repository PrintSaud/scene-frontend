import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => {
      document.body.classList.remove("hide-navbar");
    };
  }, []);

  const handleSubmit = async () => {
    if (!username || !email) {
      setError("Please enter both username and email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/request-reset-code", {
        username,
        email,
      });

      localStorage.setItem("resetEmail", email); // save for next step
      toast.success("Verification code sent to your email!");
      navigate("/verify-reset-code");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      toast.error("Failed to send reset code.");
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
        justifyContent: "flex-start",
        textAlign: "center",
        paddingTop: "8vh", // ⬅️ lifted higher
      }}
    >
      <h1 className="scene-logo">Forgot Password?</h1>

      <p
        style={{
          color: "#aaa",
          marginBottom: "24px",
          maxWidth: "320px",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        Enter your Scene username and email to receive a reset code.
      </p>

      {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
      )}

      <input
        type="text"
        placeholder="Your Scene username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="login-input"
        autoFocus
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="login-input"
        style={{ marginTop: "12px" }}
      />

      <button
        onClick={handleSubmit}
        className="login-button"
        style={{ marginTop: "18px" }}
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Reset Code"}
      </button>
    </div>
  );
}
