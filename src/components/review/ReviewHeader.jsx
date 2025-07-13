import React from "react";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function ReviewHeader({ review, userId, onLike, onReply, onProfile }) {
  const navigate = useNavigate();

  const posterUrl = review.poster && review.poster.startsWith("http")
    ? review.poster
    : "/default-poster.jpg";

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

  // ✅ More permissive avatar fallback (supports relative paths from backend)
  const avatarUrl = review.user?.avatar
    ? review.user.avatar
    : "/default-avatar.jpg";

  const timestamp = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <>
      {/* Backdrop with fade-down */}
      <div style={{ position: "relative", width: "100%", height: 220, overflow: "hidden", marginBottom: -30 }}>
        <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "70%",
          background: "linear-gradient(to top, #0e0e0e, transparent)"
        }} />
        {/* "Go to film" button → white text, transparent bg, positioned properly */}
        <div style={{ position: "absolute", bottom: 30, right: 15, textAlign: "right" }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: 12,
              padding: 0,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif"
            }}
            onClick={() => navigate(`/movie/${review.movie?.id || review.movie}`)}
          >
            Go to film
          </button>
          {/* Timestamp below button */}
          {timestamp && (
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {timestamp}
            </div>
          )}
        </div>
      </div>

      {/* User + review text */}
      <div style={{ padding: "0 16px" }}>
        {review.user && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: 28, height: 28, borderRadius: "50%", cursor: "pointer" }}
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
            <div style={{ marginTop: 4 }}>
              <StarRating rating={review.rating} />
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

        {/* Like + Reply under review, far right */}
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
