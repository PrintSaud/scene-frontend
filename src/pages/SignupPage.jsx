import { useState } from "react";
import axios from "axios";
import "../styles/LoginPage.css";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_BACKEND;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
      });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        token: res.data.token,
      };

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(mergedUser));

      toast.success("Signed up successfully!");
      window.location.href = "/upload-avatar";
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed.");
      toast.error("Signup failed. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">Join Scene 🎬</h1>

      <p
        className="welcome-text"
        style={{
          textAlign: "center",
          fontSize: "16px",
          marginBottom: "16px",
          lineHeight: "1.5",
        }}
      >
        Create your account to log your films ✨
      </p>

      {error && <p style={{ color: "#ff4d4d", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleSignup} className="login-form">
        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? (
            <FaSpinner className="spin" style={{ fontSize: "18px" }} />
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <div className="signup-row">
        <span>Already have an account?</span>
        <a href="/login" className="signup-link">
          Log in
        </a>
      </div>
    </div>
  );
}
