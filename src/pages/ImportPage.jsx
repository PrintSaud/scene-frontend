import React, { useState } from "react";
import axios from "../api/api";

const importEndpoints = {
  diary: "/api/import/letterboxd/diary",
  ratings: "/api/import/letterboxd/ratings",
  watchlist: "/api/import/letterboxd/watchlist",
  reviews: "/api/import/letterboxd/reviews",
};

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    let type = "";

    if (name.includes("diary")) type = "diary";
    else if (name.includes("rating")) type = "ratings";
    else if (name.includes("watchlist")) type = "watchlist";
    else if (name.includes("review")) type = "reviews";
    else {
      setMessage("❌ File name must include: diary, ratings, watchlist, or reviews");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(importEndpoints[type], formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "✅ Import successful!");
    } catch (err) {
      setMessage("❌ Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", color: "white" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>📦 Transfer Data from Letterboxd</h2>
      <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px" }}>
        Export your data from Letterboxd and upload the CSV files below (diary.csv, ratings.csv, etc.).
        The system will auto-detect each file type based on the filename.
      </p>

      <input type="file" onChange={handleFileUpload} accept=".csv" />

      {loading && <p style={{ color: "#00f" }}>⏳ Uploading...</p>}
      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </div>
  );
}
