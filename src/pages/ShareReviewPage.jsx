import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FiEye, FiDownload } from "react-icons/fi";
import StarRating from "../components/StarRating";
import api from "../api/api";
import { backend } from "../config";
import useTranslate from "../utils/useTranslate";

export default function ShareReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const t = useTranslate();

  useEffect(() => {
    api.get(`/api/logs/${id}`).then(({ data }) => setReview(data));
  }, [id]);

  const handleSaveImage = () => {
    html2canvas(document.querySelector("#share-card"), {
      useCORS: true,
      backgroundColor: "#000",
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `scene-review-${review.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
      alert("✅ " + t("Saved! Check your device's Downloads folder."));
    });
  };

  const handleExitPreview = () => {
    if (previewMode) setPreviewMode(false);
  };

  if (!review)
    return (
      <div
        style={{
          color: "#fff",
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        {t("Loading...")}
      </div>
    );

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        position: "relative",
        overflowY: "auto",
        paddingBottom: 80,
      }}
      onClick={handleExitPreview}
    >
      {/* Top buttons */}
      {!previewMode && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            right: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode(true);
              }}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              <FiEye />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveImage();
              }}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              <FiDownload />
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        id="share-card"
        style={{
          maxWidth: 360,
          margin: "100px auto 40px",
          background: "#000",
          borderRadius: 12,
          padding: 16,
          textAlign: "center",
          color: "#fff",
        }}
      >
        {/* Poster smaller (~70%) */}
        <img
          src={
            review.poster
              ? `${backend}/api/logs/proxy/tmdb?url=${encodeURIComponent(
                  review.poster
                )}`
              : "/default-poster.jpg"
          }
          alt="Poster"
          style={{ width: "70%", borderRadius: 8 }}
          crossOrigin="anonymous"
        />

        <div style={{ marginTop: 16 }}>
          {/* User info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <img
              src={review.user?.avatar || "/default-avatar.jpg"}
              alt="avatar"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
              crossOrigin="anonymous"
            />
            <strong>@{review.user?.username}</strong>
          </div>

          {/* Dynamic "I’ve rated [movie]" text */}
          <div
            style={{
              marginTop: 8,
              fontWeight: 500,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              color: "#aaa",
            }}
          >
            {t("I’ve rated")} <strong>{review.movie?.title}</strong>
          </div>

          {/* Star rating centered */}
          <div
            style={{ marginTop: 12, display: "flex", justifyContent: "center" }}
          >
            <StarRating rating={review.rating} size={22} />
          </div>

          {/* "on" + Scene logo with gray lines */}
          <div
            style={{
              marginTop: 1,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              color: "#aaa",
            }}
          >
            {t("on")}
          </div>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#555" }} />
            <img
              src="/scene-og.png"
              alt="Scene logo"
              style={{ width: 90, objectFit: "contain" }}
            />
            <div style={{ flex: 1, height: 1, background: "#555" }} />
          </div>
        </div>
      </div>

      {/* Navbar hidden when previewMode is true */}
      {!previewMode && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: "transparent",
            borderTop: "none",
            zIndex: 15,
          }}
        >
          {/* Optional nav icons */}
        </div>
      )}
    </div>
  );
}
