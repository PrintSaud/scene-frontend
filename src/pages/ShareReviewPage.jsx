import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { backend } from "../config";
import { FiEye, FiDownload } from "react-icons/fi";
import StarRating from "../components/StarRating";

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
      alert("✅ Saved! Check your device's Downloads folder.");
    });
  };
  
  

  const handleExitPreview = () => {
    if (previewMode) setPreviewMode(false);
  };

  if (!review) return <div style={{ color: "#fff", padding: 20 }}>Loading...</div>;

  return (
    <div
      style={{
        background: "#0e0e0e",
        minHeight: "100vh",
        position: "relative",
        overflowY: "auto",
        paddingBottom: 80 // Extra scroll space
      }}
      onClick={handleExitPreview}
    >
      {/* Top buttons */}
      {!previewMode && (
        <div style={{
          position: "fixed", top: 16, left: 16, right: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20
        }}>
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
              onClick={(e) => { e.stopPropagation(); setPreviewMode(true); }}
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
  maxWidth: 360,
  margin: "100px auto 40px",
  background: "#0e0e0e",
  borderRadius: 12,
  padding: 16,
  textAlign: "center",
  color: "#fff"
}}>
  {/* Poster smaller (~80%) */}
  <img
    src={review.poster ? `${backend}/api/logs/proxy/tmdb?url=${encodeURIComponent(review.poster)}` : "/default-poster.jpg"}
    alt="Poster"
    style={{ width: "80%", borderRadius: 8 }}
  />

  <div style={{ marginTop: 16 }}>
    {/* User info */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <img src={review.user?.avatar || "/default-avatar.jpg"} alt="avatar"
        style={{ width: 40, height: 40, borderRadius: "50%" }}
      />
      <strong>@{review.user?.username}</strong>
    </div>

    {/* Dynamic "I’ve rated [movie]" text */}
    <div style={{
      marginTop: 8,
      fontWeight: 500,
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
      color: "#aaa"
    }}>
      I’ve rated <strong>{review.movie?.title}</strong>
    </div>

    {/* Star rating centered */}
    <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
      <StarRating rating={review.rating} size={22} />
    </div>

{/* "on" + Scene logo with gray lines */}
<div style={{ marginTop: 10, fontSize: 14, fontFamily: "Inter, sans-serif", color: "#aaa" }}>on</div>
<div style={{
  marginTop: -8,  // even tighter spacing below "on"
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12
}}>
  <div style={{ flex: 1, height: 1, background: "#555" }} />
  <img src="/default-avatarc.png" alt="Scene logo" style={{ width: 90, objectFit: "contain" }} />
  <div style={{ flex: 1, height: 1, background: "#555" }} />
</div>
  </div>
</div>


      {/* Navbar hidden when previewMode is true */}
      {!previewMode && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "transparent",  // transparent background
  borderTop: "none",          // remove border line
          zIndex: 15
        }}>
          {/* Optional: Add your actual nav bar icons here */}
        </div>
      )}
    </div>
  );
}
