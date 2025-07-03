import { useState } from "react";
import axios from "axios";
import { backend } from "../config";

export default function UploadAvatarPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || null;
    const userId = user?._id || user?.id;
    console.log("📦 User from localStorage:", user);

    if (!user || !userId) {
      console.warn("❌ User not found.");
      setMessage("❌ User not found.");
      return;
    }

    const token = localStorage.getItem("token");
    console.log("🔐 Token:", token);

    const formData = new FormData();
    formData.append("avatar", file);
    console.log("📤 Uploading file:", file?.name);

    try {
      const res = await axios.post(
        `${backend}/api/upload/${userId}/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Upload success:", res.data);

      user.avatar = res.data.avatar;
      localStorage.setItem("user", JSON.stringify(user));
      setMessage("✅ Upload successful!");

      setTimeout(() => {
        console.log("🚀 Redirecting to /home...");
        window.location.href = "/home";
      }, 1000);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setMessage("❌ Upload failed.");
    }
  };

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const imageSrc = preview || storedUser?.avatar || "/default-avatar.png";
  console.log("🖼️ Image source:", imageSrc);

  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        textAlign: "center",
        marginTop: "60px",
      }}
    >
      <h2>Avatar Upload</h2>

      {(preview || storedUser?.avatar) ? (
        <img
          src={imageSrc}
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
      ) : (
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
            color: "#aaa",
            fontSize: "12px",
          }}
        >
          No Image
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const selected = e.target.files[0];
          console.log("🖱️ File selected:", selected);
          if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
          }
        }}
      />
      <br />
      <button onClick={handleUpload}>Upload Avatar</button>

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
