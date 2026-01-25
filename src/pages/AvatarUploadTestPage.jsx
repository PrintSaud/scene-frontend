// src/pages/AvatarUploadTestPage.jsx
import React, { useState } from "react";
import { backend } from "../config";

export default function AvatarUploadTestPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));


  const handleUpload = async () => {
    if (!file || !user?._id) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(`${backend}/api/upload/${user._id}/upload-avatar`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Upload successful!");
        console.log("Cloudinary avatar URL:", data.avatar);
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setMessage("❌ Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong.");
    }
  };

  return (
    <div style={{ padding: "30px", color: "#fff", fontFamily: "Inter" }}>
      <h2>Avatar Upload Test</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setPreview(URL.createObjectURL(e.target.files[0]));
        }}
      />
      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ width: "100px", height: "100px", borderRadius: "50%", marginTop: "12px" }}
        />
      )}
      <br />
      <button
        onClick={handleUpload}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          backgroundColor: "#222",
          color: "#fff",
          border: "1px solid #444",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Upload Avatar
      </button>
      <p style={{ marginTop: "10px", color: "#ccc" }}>{message}</p>
    </div>
  );
}
