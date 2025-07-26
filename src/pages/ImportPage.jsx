import React, { useState } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";

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
    <div style={{ padding: "24px", color: "white" }}>
      <h2 style={{ fontSize: "16px", marginBottom: "8px", textAlign: "center" }}>
        📦 Transfer Data from Letterboxd
      </h2>

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
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        ←
      </button>

      <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
        Upload your exported files one by one from the Letterboxd data folder (watchlist.csv, ratings.csv, etc.).
      </p>

      {["diary", "ratings","watchlist"].map((type) => (
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

      {(previews.diary || previews.ratings || previews.watchlist ) && (
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
    </div>
  );
}
