import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { backend } from "../config";
import { FiEye, FiDownload } from "react-icons/fi";

export default function ShareReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    axios.get(`${backend}/api/logs/${id}`).then(({ data }) => setReview(data));
  }, [id]);

  const handleSaveImage = () => {
    html2canvas(document.querySelector("#share-card")).then(canvas => {
      const link = document.createElement("a");
      link.download = `scene-review-${review.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const handleExitPreview = () => {
    if (previewMode) setPreviewMode(false);
  };

  if (!review) return <div style={{ color: "#fff", padding: 20 }}>Loading...</div>;

  return (
    <div
      style={{ background: "#0e0e0e", minHeight: "100vh", position: "relative", padding: 16 }}
      onClick={handleExitPreview}
    >
      {/* Top controls */}
      {!previewMode && (
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
              width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer"
            }}
          >
            ←
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewMode(!previewMode); }}
              style={{
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer"
              }}
            >
              <FiEye />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSaveImage(); }}
              style={{
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer"
              }}
            >
              <FiDownload />
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div id="share-card" style={{
        maxWidth: 360, margin: "100px auto 0", background: "#0e0e0e", borderRadius: 12, padding: 16,
        textAlign: "center", color: "#fff"
      }}>
        <img src={review.poster} alt="Poster" style={{ width: "100%", borderRadius: 8 }} />
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <img src={review.user?.avatar || "/default-avatar.jpg"} alt="avatar"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />
            <strong>@{review.user?.username}</strong>
          </div>
          <div style={{ marginTop: 8, fontWeight: "500" }}>i’ve rated</div>
          <div style={{ fontWeight: "bold", fontSize: 18 }}>{review.title}</div>

          {/* Scene rating stars design */}
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 4 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={{
                width: 20, height: 20, borderRadius: 4, background: idx < review.rating ? "#B327F6" : "#333"
              }} />
            ))}
          </div>

          {/* "on" + Scene logo + gray lines */}
          <div style={{ marginTop: 16 }}>
            <div style={{ color: "#aaa", fontSize: 14, marginBottom: 6 }}>on</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#555" }} />
              <img src="/default-avatarc.png" alt="Scene logo" style={{ width: 48, height: 24, objectFit: "contain" }} />
              <div style={{ flex: 1, height: 1, background: "#555" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
