import { useState } from "react";
import api from "../api/api";
import "../styles/LoginPage.css";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { TbUpload } from "react-icons/tb";
import CropperModal from "../components/CropperModal";

export default function SignupPage() {
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [rawAvatarFile, setRawAvatarFile] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckBusy, setEmailCheckBusy] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState(null); // null | true | false
  const [emailDeliverableReason, setEmailDeliverableReason] = useState("");

  const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
  const validateEmailFormat = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleUsernameChange = async (e) => {
    const val = e.target.value.trim();
    setUsername(val);
    const valid = isValidUsername(val);
    setUsernameValid(valid);
    setUsernameTaken(false);

    if (!valid || !val) return;

    try {
      const res = await api.get(`/api/auth/check-username`, { params: { username: val } });
      setUsernameTaken(!res.data?.available);
    } catch {
      setUsernameTaken(false);
    }
  };

  const handleEmailChange = async (e) => {
    const val = e.target.value.trim();
    setEmail(val);
    const valid = validateEmailFormat(val);
    setEmailValid(valid);
    setEmailTaken(false);
    setEmailDeliverable(null);
    setEmailDeliverableReason("");

    if (!valid || !val) return;

    try {
      const res = await api.get(`/api/auth/check-email`, { params: { email: val } });
      setEmailTaken(!res.data?.available);
    } catch {
      setEmailTaken(false);
    }
  };

  const verifyDeliverability = async (emailToCheck) => {
    try {
      setEmailCheckBusy(true);
      setEmailDeliverable(null);
      setEmailDeliverableReason("");
      const { data } = await api.post(`/api/auth/validate-email`, { email: emailToCheck });
      setEmailDeliverable(!!data?.ok);
      setEmailDeliverableReason(data?.reason || "");
      if (data?.didYouMean) {
        toast((t) => (
          <span>
            Did you mean <b>{data.didYouMean}</b>?
            <button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setEmail(data.didYouMean);
                toast.dismiss(t.id);
              }}
            >
              Use it
            </button>
          </span>
        ));
      }
      return !!data?.ok;
    } catch {
      setEmailDeliverable(false);
      setEmailDeliverableReason("validator_unreachable");
      return false;
    } finally {
      setEmailCheckBusy(false);
    }
  };
  

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "scene_avatar");

    const res = await fetch("https://api.cloudinary.com/v1_1/scenewebapp/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.secure_url;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawAvatarFile(file);
    setShowCropper(true);
  };

  const handleCropped = (croppedBlob) => {
    const previewURL = URL.createObjectURL(croppedBlob);
    setAvatar(croppedBlob);
    setAvatarPreview(previewURL);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!avatar) return showError("Please upload an avatar.");
    if (!isValidUsername(username)) return showError("Invalid username format.");
    if (usernameTaken) return showError("Username already taken.");
    if (!validateEmailFormat(email)) return showError("Invalid email.");
    if (emailTaken) return showError("Email already in use.");
    if (password.length < 4) return showError("Password too short.");

    const okDeliver = await verifyDeliverability(email);
    if (!okDeliver) {
      const msg =
        emailDeliverableReason === "no_mx"
          ? "That email domain can’t receive mail. Please use a different email."
          : "We couldn’t verify that email can receive mail. Please use a different email.";
      return showError(msg);
    }

    try {
      // register (without avatar)
      const res = await api.post(`/api/auth/register`, { username, email, password });

      const mergedUser = {
        ...res.data.user,
        _id: res.data.user._id,
        token: res.data.token,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));
      localStorage.setItem("token", res.data.token);

      // upload avatar to backend
      const formData = new FormData();
      formData.append("avatar", avatar);

      await api.post(`/api/upload/avatar/${mergedUser._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${res.data.token}`,
        },
      });

      toast.success("Signed up successfully! Check your inbox to verify.");
      window.location.href = "/verify-email";
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed.");
      toast.error("Signup failed. Try again.");
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
      <p className="welcome-text" style={{ textAlign: "center", fontSize: "16px", marginBottom: "16px" }}>
        Create your account to log your films ✨
      </p>

      {error && <p style={{ color: "#ff4d4d", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleSignup} className="login-form" style={{ marginTop: "10px" }}>
        <label htmlFor="avatar-upload" className="avatar-upload-label">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="avatar-preview" />
          ) : (
            <div className="avatar-placeholder">
              <TbUpload size={24} />
              <span>Upload Avatar</span>
            </div>
          )}
        </label>
        <input
          type="file"
          id="avatar-upload"
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleAvatarChange}
        />

        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={handleUsernameChange}
        />
        {!usernameValid && (
          <p style={{ color: "#ff4d4d", fontSize: "12px" }}>
            ❌ 3–20 letters, numbers, or underscores only
          </p>
        )}
        {usernameValid && username && usernameTaken && (
          <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Username is already taken</p>
        )}
        {usernameValid && username && !usernameTaken && (
          <p style={{ color: "#90ee90", fontSize: "12px" }}>✅ Username looks good!</p>
        )}

        <div style={{ position: "relative" }}>
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={handleEmailChange}
          />
          {emailCheckBusy && (
            <span
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: "#aaa",
              }}
            >
              checking…
            </span>
          )}
        </div>

        {!emailValid && <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Invalid email format</p>}
        {emailValid && email && emailTaken && (
          <p style={{ color: "#ff4d4d", fontSize: "12px" }}>❌ Email already in use</p>
        )}
        {emailValid && email && emailDeliverable === false && (
          <p style={{ color: "#ff4d4d", fontSize: "12px" }}>
            ❌ We couldn’t verify that email can receive mail. Try a different email.
          </p>
        )}
        {emailValid && email && emailDeliverable === true && !emailTaken && (
          <p style={{ color: "#90ee90", fontSize: "12px" }}>✅ Email looks deliverable</p>
        )}

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="login-button" disabled={isLoading || emailCheckBusy}>
          {isLoading ? <FaSpinner className="spin" /> : "Sign Up"}
        </button>
      </form>

      <div className="signup-row">
        <span>Already have an account?</span>
        <a href="/login" className="signup-link">Log in</a>
      </div>

      {showCropper && rawAvatarFile && (
        <CropperModal
          file={rawAvatarFile}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropped}
          shape="circle"
          aspectRatio={1}
        />
      )}
    </div>
  );
}
