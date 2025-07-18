import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { backend } from "../config";

export default function ShareReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    axios.get(`${backend}/api/logs/${id}`).then(({ data }) => setReview(data));
  }, [id]);

  if (!review) return <div style={{ color: "#fff", padding: 20 }}>Loading...</div>;

  const handleSaveImage = () => {
    html2canvas(document.querySelector("#share-card")).then(canvas => {
      const link = document.createElement("a");
      link.download = `scene-review-${review.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", position: "relative", padding: 16 }}>
      {/* Header actions */}
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
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer"
              }}
            >
              👁️
            </button>
            <button
              onClick={handleSaveImage}
              style={{
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer"
              }}
            >
              ⬇️
            </button>
          </div>
        </div>
      )}

      {/* Main card */}
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
          <div style={{ marginTop: 8, fontSize: 20 }}>
            {"⭐️".repeat(Math.floor(review.rating || 0))}
          </div>
          <div style={{ marginTop: 16, fontSize: 14, color: "#aaa" }}>
            On <span style={{ fontWeight: "600", color: "#fff" }}>Scene 🎬</span>
          </div>
        </div>
      </div>
    </div>
  );
}
