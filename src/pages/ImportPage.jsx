import React, { useState } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";
import { AiOutlineQuestionCircle } from "react-icons/ai";

const importEndpoints = {
    diary: "/api/letterboxd/logs",
    ratings: "/api/letterboxd/logs",
    watchlist: "/api/letterboxd/watchlist",
  };
  
    

export default function ImportPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState({
    diary: null,
    ratings: null,
    watchlist: null,
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const [previews, setPreviews] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = async (type, file) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [type]: file }));

    const text = await file.text();
    const rows = text.split("\n").slice(1, 4);
    setPreviews((prev) => ({ ...prev, [type]: rows }));
  };

  const handleUpload = async () => {
    setLoading(true);
    const summary = {};

    for (const [type, file] of Object.entries(files)) {
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post(importEndpoints[type], formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        summary[type] = res.data.message;
      } catch (err) {
        summary[type] = `❌ Import failed for ${type}`;
      }
    }

    setMessage("✅ Import complete.");
    setUploadComplete(true);
    setLoading(false);

    if (Object.values(summary).some((m) => m.includes("✅"))) {
      alert("🎬 Welcome to Scene!");
    }
  };

  const undoImport = () => {
    setFiles({ diary: null, ratings: null, watchlist: null, });
    setPreviews({});
    setUploadComplete(false);
    setMessage("🗑️ Cleared last import.");
  };

  return (
    <div style={{ position: "relative", padding: "24px", color: "white", maxHeight: "calc(100vh - 60px)", overflowY: "auto", paddingBottom: "160px" }}>
      {/* ❓ Top Right Help Icon */}
      <div style={{ position: 'absolute', top: 30, right: 20, zIndex: 10 }}>
        <AiOutlineQuestionCircle
          onClick={() => setShowInstructions(true)}
          style={{
            cursor: 'pointer',
            fontSize: 24,
            color: '#aaa',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
        />
      </div>
  
      {/* Title + Back Button Row */}
<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
  <button
    onClick={() => navigate(-1)}
    style={{
      background: "rgba(0,0,0,0.5)",
      border: "none",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      color: "#fff",
      fontSize: "18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "left",
      justifyContent: "left",
    }}
  >
    ←
  </button>

  <h2 style={{ fontSize: "14px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
    Transfer Data from Letterboxd
  </h2>
</div>

  
      {/* Instructions */}
      <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
        Upload your exported files one by one from the Letterboxd data folder (watchlist.csv, ratings.csv, etc.).
      </p>
  
      {/* Upload Inputs */}
      {["diary", "ratings", "watchlist"].map((type) => (
        <div key={type} style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "4px" }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}.csv
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(type, e.target.files[0])}
          />
          {previews[type] && (
            <ul style={{ fontSize: "12px", color: "#ccc", marginTop: "4px" }}>
              {previews[type].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
  
      {loading && <p style={{ color: "#fff" }}>⏳ Uploading files...</p>}
      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
  
      {!uploadComplete && (
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            fontSize: "14px",
            background: "#111",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🚀 Upload All Files
        </button>
      )}
  
      {uploadComplete && (
        <button
          onClick={() => navigate("/profile")}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            fontSize: "14px",
            background: "#0f0",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✅ Continue to Profile
        </button>
      )}
  
      {(previews.diary || previews.ratings || previews.watchlist) && (
        <button
          onClick={undoImport}
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            background: "#331111",
            border: "1px solid #511",
            borderRadius: "6px",
            color: "#f55",
            fontWeight: "600",
            cursor: "pointer",
            display: "block",
          }}
        >
          🗑️ Undo Last Import
        </button>
      )}
  
      {/* 📋 Instructions Modal */}
      {showInstructions && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#111',
            padding: 20,
            borderRadius: 30,
            maxWidth: 350,
            color: '#fff',
            fontSize: 14,
          }}>
            <h2 style={{ marginBottom: 12 }}>📥 How to Import from Letterboxd</h2>
            <ul style={{ paddingLeft: 20, marginBottom: 16, fontFamily: "Inter, sans-serif", }}>
              <li>1. Go to your Letterboxd Account from The Website not the App </li>
              <li>2. Go to Settings → Export your data </li>
              <li>3. Come back to Scene</li>
              <li>4. Upload them here in the correct fields</li>
              <li>5. Click Save — we'll handle the rest! 🚀</li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                background: '#444',
                color: '#fff',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );  
}
