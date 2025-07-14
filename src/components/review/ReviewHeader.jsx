import React from "react";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function ReviewHeader({
  review,
  userId,
  onLike,
  onReply,
  onProfile
}) {
  const navigate = useNavigate();

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

  const avatarUrl = review.user?.avatar
    ? review.user.avatar
    : "/default-avatar.jpg";

  const timestamp = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

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

        {/* Go to Movie */}
        <div style={{ position: "absolute", bottom: 40, right: 14, textAlign: "right" }}>
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
            Go to Movie
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

            <div style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <StarRating rating={review.rating} />
              {timestamp && (
                <div style={{ fontSize: 11, color: "#aaa" }}>
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
