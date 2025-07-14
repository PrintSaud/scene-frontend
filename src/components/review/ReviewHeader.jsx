import React, { useState } from "react";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function ReviewHeader({
  review,
  userId,
  onLike,
  onReply,
  onProfile,
  onChangeBackdrop,
  onEdit,
  onDelete
}) {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const posterUrl = review.poster && review.poster.startsWith("http")
    ? review.poster
    : "/default-poster.jpg";

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

  const avatarUrl = review.user?.avatar
    ? review.user.avatar
    : "/default-avatar.jpg";

  const timestamp = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  const isOwner = review.user?._id === userId;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/review/${review._id}`);
    setShowOptions(false);
  };

  return (
    <>
      {/* Backdrop section */}
      <div style={{ position: "relative", width: "100%", height: 220, overflow: "hidden", marginBottom: -30 }}>
        <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "70%",
          background: "linear-gradient(to top, #0e0e0e, transparent)"
        }} />

        {/* Top bar: back + options */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
          {/* Back button */}
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
              justifyContent: "center"
            }}
          >
            ←
          </button>

          {/* 3-dots menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowOptions((prev) => !prev)}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                color: "#fff",
                fontSize: "22px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ⋯
            </button>

            {showOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "38px",
                  right: "0",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  padding: "12px 0",
                  width: "200px",
                  zIndex: 20
                }}
              >
                {(isOwner
                  ? [
                      { label: "🎨 Change Backdrop", onClick: onChangeBackdrop },
                      { label: "✏️ Edit Review/Log", onClick: onEdit },
                      { label: "🗑️ Delete Review/Log", onClick: onDelete },
                      { label: "🔗 Copy Link", onClick: handleShare }
                    ]
                  : [
                      { label: "🔗 Copy Link", onClick: handleShare }
                    ]
                ).map((item, index) => (
                  <div
                    key={index}
                    onClick={item.onClick}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14.5px",
                      fontWeight: "500",
                      color: "#fff",
                      fontFamily: "Inter",
                      transition: "0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Go to film */}
        <div style={{ position: "absolute", bottom: 30, right: 8, textAlign: "right" }}>
          <button
            style={{
              background: "rgba(100, 100, 100, 0.6)",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              fontSize: 12,
              padding: "4px 8px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif"
            }}
            onClick={() => navigate(`/movie/${review.movie?.id || review.movie}`)}
          >
            Go to film
          </button>
        </div>
      </div>

      {/* Content section */}
      <div style={{ padding: "0 16px", position: "relative", zIndex: 2 }}>
        {review.user && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover"
                }}
                onClick={() => onProfile(review.user._id)}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  opacity: 0.9,
                  cursor: "pointer"
                }}
                onClick={() => onProfile(review.user._id)}
              >
                @{review.user.username}
              </span>
            </div>

            {/* Rating + timestamp aligned */}
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <StarRating rating={review.rating} />
              {timestamp && (
                <div style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>
                  {timestamp}
                </div>
              )}
            </div>
          </>
        )}

        {review.review && (
          <p style={{
            marginTop: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: 1.4
          }}>
            {review.review}
          </p>
        )}

        {review.image && (
          <img src={review.image} alt="Attached" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
        )}
        {review.gif && (
          <img src={review.gif} alt="GIF" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
        )}

        {/* Likes and reply */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 8, gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span onClick={onLike} style={{ cursor: "pointer", fontSize: "20px", position: "relative", top: "1px" }}>
              {(review.likes || []).includes(userId) ? (
                <AiFillHeart style={{ color: "#B327F6" }} />
              ) : (
                <AiOutlineHeart />
              )}
            </span>
            <span style={{ fontSize: "13px" }}>{review.likes?.length || 0}</span>
          </div>
          <button
            style={{
              background: "transparent",
              border: "1px solid #555",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              color: "#fff",
              cursor: "pointer"
            }}
            onClick={onReply}
          >
            Reply
          </button>
        </div>
      </div>
    </>
  );
}
