import { useState } from "react";
import axios from "axios";

export default function UploadAvatarPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || null;
if (!user || !user._id) return setMessage("❌ User not found.");
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload/${user._id}/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      user.avatar = res.data.avatar;
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("✅ Upload successful!");
      setTimeout(() => {
        window.location.href = "/home";
      }, 1000);
    } catch (err) {
      setMessage("❌ Upload failed.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center", color: "white" }}>
      <h2>Avatar Upload Test</h2>

      <img
      src={
        preview ||
        (JSON.parse(localStorage.getItem("user"))?.avatar ?? "/default-avatar.png")
      }      
        alt="Preview"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          marginBottom: "10px",
          objectFit: "cover",
          border: "2px solid white",
        }}
      />

      <br />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setPreview(URL.createObjectURL(e.target.files[0]));
        }}
      />
      <br />
      <button
        onClick={handleUpload}
        disabled={!file}
        style={{
          marginTop: "16px",
          background: "#111",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Upload Avatar
      </button>

      {message && (
        <p
          style={{
            marginTop: "12px",
            fontWeight: "bold",
            color: message.includes("failed") ? "red" : "lime",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
