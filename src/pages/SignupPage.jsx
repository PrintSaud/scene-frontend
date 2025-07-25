import { useState } from "react";
import api from "../api/api"; // ✅ token-ready instance
import "../styles/LoginPage.css";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [emailTaken, setEmailTaken] = useState(false);

  const isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleUsernameChange = async (e) => {
    const val = e.target.value;
    setUsername(val);
    const valid = isValidUsername(val);
    setUsernameValid(valid);

    if (valid) {
      try {
        const res = await api.get(`/api/auth/check-username?username=${val}`); 
        setUsernameTaken(!res.data.available);
      } catch (err) {
        console.error("Username check failed:", err);
        setUsernameTaken(false);
      }
    } else {
      setUsernameTaken(false);
    }
  };

  const handleEmailChange = async (e) => {
    const val = e.target.value;
    setEmail(val);
    const valid = validateEmail(val);
    setEmailValid(valid);

    if (valid) {
      try {
        const res = await api.get(`/api/auth/check-email?email=${val}`); // ✅ FIXED
        setEmailTaken(!res.data.available);
      } catch (err) {
        console.error("Email check failed:", err);
        setEmailTaken(false);
      }
    } else {
      setEmailTaken(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name.trim()) return showError("Please enter your name.");
    if (!isValidUsername(username)) return showError("Invalid username format.");
    if (usernameTaken) return showError("Username already taken.");
    if (!validateEmail(email)) return showError("Invalid email.");
    if (emailTaken) return showError("Email already in use.");

    try {
      const res = await api.post(`/api/auth/register`, { // ✅ FIXED
        name,
        username,
        email,
        password,
      });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        name: res.data.user.name,
        token: res.data.token,
      };
      
      localStorage.setItem("user", JSON.stringify(mergedUser));
      
      localStorage.setItem("token", res.data.token);

      toast.success("Signed up successfully!");
      window.location.href = "/upload-avatar";
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed.");
      console.log("❌ Signup Error:", err);
      toast.error("Signup failed. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (msg) => {
    setError(msg);
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <h1 className="scene-logo">Join Scene 🎬</h1>
      <p className="welcome-text" style={{ textAlign: "center", fontSize: "16px", marginBottom: "16px", lineHeight: "1.5" }}>
        Create your account to log your films ✨
      </p>

      {error && <p style={{ color: "#ff4d4d", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleSignup} className="login-form">
        <input type="text" placeholder="Full Name" className="login-input" value={name} onChange={(e) => setName(e.target.value)} />

        <input type="text" placeholder="Username" className="login-input" value={username} onChange={handleUsernameChange} />
        {!usernameValid && <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ 3–20 lowercase letters, numbers, or underscores only</p>}
        {usernameValid && username && usernameTaken && <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Username is already taken</p>}
        {usernameValid && username && !usernameTaken && <p style={{ color: "#90ee90", fontSize: "12px" }}>✅ Username looks good!</p>}

        <input type="email" placeholder="Email" className="login-input" value={email} onChange={handleEmailChange} />
        {!emailValid && <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Invalid email format</p>}
        {emailValid && email && emailTaken && <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Email already in use</p>}
        {emailValid && email && !emailTaken && <p style={{ color: "#90ee90", fontSize: "12px" }}>✅ Email is available</p>}

        <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? <FaSpinner className="spin" style={{ fontSize: "18px" }} /> : "Sign Up"}
        </button>
      </form>

      <div className="signup-row">
        <span>Already have an account?</span>
        <a href="/login" className="signup-link">Log in</a>
      </div>
    </div>
  );
}
