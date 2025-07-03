// src/pages/UploadAvatar.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css"; // reuse styling
import { backend } from "../config";

export default function UploadAvatar() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected)); // preview image
    }
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a photo.");
  
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("📦 Uploading avatar for user:", user); // <-- ✅ ADD THIS HERE
    console.log("👤 User in UploadAvatar:", user);

  
    const formData = new FormData();
    formData.append("avatar", file);
  
    try {
      const res = await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/upload/${user.id}/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      // Update local user avatar
      user.avatar = res.data.avatar;
      localStorage.setItem("user", JSON.stringify(user));
  
      navigate("/home");
    } catch (err) {
      setError("Upload failed. Try again.");
      console.error("❌ Upload error:", err); // ✅ log the full error too
    }
  };
  


  return (
    <div className="login-container">
      <h1 className="scene-logo">Upload Your Profile Picture 📷</h1>
      <p className="welcome-text">Choose a photo to represent you on Scene.</p>

      {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            marginTop: 20,
            objectFit: "cover",
            border: "3px solid #a855f7"
          }}
        />
      )}

      <button onClick={handleUpload} className="login-button" style={{ marginTop: 30 }}>
        Upload & Enter Scene
      </button>
    </div>
  );
}
