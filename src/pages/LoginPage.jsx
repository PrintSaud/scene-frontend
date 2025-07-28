import { useEffect, useState } from "react";
import axios from "../api/api";
import "../styles/LoginPage.css";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post(`/api/auth/login`, {
        email,
        password,
      });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        token: res.data.token,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));

      toast.success("Logged in successfully!");
      window.location.href = "/home";
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
      <p className="welcome-text">Welcome back! We missed you 🎬</p>

      {error && (
        <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginBottom: "10px" }}>
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
          {isLoading ? (
            <FaSpinner className="spin" style={{ fontSize: "18px" }} />
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="or-separator">or</div>

      <div className="google-login">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              const { data } = await axios.post(`/api/auth/google`, {
                credential: credentialResponse.credential,
              });
              
              console.log("✅ Google login response:", data);

              if (!data.token || !data.user) {
                console.error("❌ Missing token or user in response");
                toast.error("Google login failed. Please try again.");
                return;
              }

              const mergedUser = {
                ...data.user,
                _id: data.user._id,
                token: data.token,
              };

              localStorage.setItem("user", JSON.stringify(mergedUser));
              localStorage.setItem("token", data.token);
              toast.success("Logged in with Google!");
              window.location.href = "/home";
            } catch (err) {
              console.error("❌ Google login error:", err);
              toast.error("Something went wrong with Google login.");
            }
          }}
          onError={() => {
            console.log("Google login failed");
            toast.error("Google sign-in failed.");
          }}
          width="280"
        />
      </div>

      <div className="signup-row">
        <span>Don’t have an account?</span>
        <a href="/signup" className="signup-link">
          Sign up
        </a>
      </div>
    </div>
  );
}
