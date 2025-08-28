import React, { useState, useMemo } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import useTranslate from "../utils/useTranslate";

const importEndpoints = {
  diary: "/api/letterboxd/logs",
  ratings: "/api/letterboxd/logs",
  watchlist: "/api/letterboxd/watchlist",
};

export default function ImportPage() {
  const t = useTranslate();
  const navigate = useNavigate();

  const [files, setFiles] = useState({ diary: null, ratings: null, watchlist: null });
  const [showInstructions, setShowInstructions] = useState(false);
  const [previews, setPreviews] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [results, setResults] = useState({}); // { diary: "✅ …" | "❌ …", ... }

  // Recompute labels whenever language changes
  const LABELS = useMemo(() => ({
    diary: t("Diary"),
    ratings: t("Ratings"),
    watchlist: t("Watchlist"),
  }), [t]);

  const anyFileSelected = !!(files.diary || files.ratings || files.watchlist);

  const handleFileChange = async (type, file) => {
    if (!file) {
      setFiles(prev => ({ ...prev, [type]: null }));
      setPreviews(prev => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      return;
    }
    setFiles((prev) => ({ ...prev, [type]: file }));

    try {
      const text = await file.text();
      const lines = text.split("\n");
      const rows = lines.slice(1, Math.min(lines.length, 4)); // show up to 3 preview rows
      setPreviews((prev) => ({ ...prev, [type]: rows }));
    } catch {
      setPreviews((prev) => ({ ...prev, [type]: [t("Preview unavailable")] }));
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    const summary = {};
    const perTypeResults = {};

    for (const [type, file] of Object.entries(files)) {
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post(importEndpoints[type], formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const msg = (res.data?.message && String(res.data.message)) || "✅";
        summary[type] = msg;
        perTypeResults[type] = `✅ ${LABELS[type]} — ${t("Imported")}`;
      } catch (err) {
        summary[type] = "❌";
        perTypeResults[type] = t("❌ Import failed for {{type}}", { type: LABELS[type] });
      }
    }

    setResults(perTypeResults);
    setMessage("✅ " + t("Import complete."));
    setUploadComplete(true);
    setLoading(false);

    if (Object.values(summary).some((m) => String(m).includes("✅"))) {
      alert("🎬 " + t("Welcome to Scene!"));
    }
  };

  const undoImport = () => {
    setFiles({ diary: null, ratings: null, watchlist: null });
    setPreviews({});
    setResults({});
    setUploadComplete(false);
    setMessage("🗑️ " + t("Cleared last import."));
  };

  return (
    <div
      style={{
        position: "relative",
        padding: "24px",
        color: "white",
        maxHeight: "calc(100vh - 60px)",
        overflowY: "auto",
        paddingBottom: "160px",
      }}
    >
      {/* ❓ Top Right Help Icon */}
      <div style={{ position: "absolute", top: 30, right: 20, zIndex: 10 }}>
        <AiOutlineQuestionCircle
          onClick={() => setShowInstructions(true)}
          aria-label={t("How to import")}
          title={t("How to import")}
          style={{ cursor: "pointer", fontSize: 24, color: "#aaa", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
        />
      </div>

      {/* Title + Back Button Row */}
      <div>
        <button
          onClick={() => navigate(-1)}
          aria-label={t("Back")}
          title={t("Back")}
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
          }}
        >
          ←
        </button>

        <h2 style={{ fontSize: "14px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
          {t("Transfer Data from Letterboxd")}
        </h2>
      </div>

      {/* Instructions blurb */}
      <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
        {t("Upload your exported files one by one from the Letterboxd data folder (watchlist.csv, ratings.csv, etc.).")}
      </p>

      {/* Upload Inputs */}
      {["diary", "ratings", "watchlist"].map((type) => {
        const file = files[type];
        const hasPreview = !!previews[type];
        return (
          <div key={type} style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "4px" }}>
              {LABELS[type]}.csv
            </label>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
            />

            {/* filename + count */}
            {file && (
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                {t("Selected")}: <strong>{file.name}</strong>
              </div>
            )}

            {hasPreview && (
              <ul style={{ fontSize: "12px", color: "#ccc", marginTop: "4px" }}>
                {previews[type].map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {loading && <p style={{ color: "#fff" }}>⏳ {t("Uploading files...")}</p>}

      {/* Per-file results after upload */}
      {uploadComplete && Object.keys(results).length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#ddd" }}>
          {Object.entries(results).map(([type, text]) => (
            <div key={type} style={{ marginBottom: 4 }}>{text}</div>
          ))}
        </div>
      )}

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}

      {!uploadComplete && (
        <button
          onClick={handleUpload}
          disabled={loading || !anyFileSelected}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            fontSize: "14px",
            background: anyFileSelected ? "#111" : "#2a2a2a",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: "8px",
            cursor: anyFileSelected ? "pointer" : "not-allowed",
          }}
        >
          🚀 {t("Upload All Files")}
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
          ✅ {t("Continue to Profile")}
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
          🗑️ {t("Undo Last Import")}
        </button>
      )}

      {/* 📋 Instructions Modal */}
      {showInstructions && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: 30,
              maxWidth: 350,
              color: "#fff",
              fontSize: 14,
            }}
          >
            <h2 style={{ marginBottom: 12 }}>📥 {t("How to Import from Letterboxd")}</h2>
            <ul style={{ paddingLeft: 20, marginBottom: 16, fontFamily: "Inter, sans-serif" }}>
              <li>1. {t("Go to your Letterboxd account on the website (not the app).")}</li>
              <li>2. {t("Go to Settings → Export your data.")}</li>
              <li>3. {t("Come back to Scene.")}</li>
              <li>4. {t("Upload them here in the correct fields.")}</li>
              <li>5. {t("Click Save — we'll handle the rest! 🚀")}</li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                background: "#444",
                color: "#fff",
                padding: "8px 12px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              {t("Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
