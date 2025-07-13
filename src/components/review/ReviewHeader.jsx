import React from "react";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export default function ReviewHeader({ review, userId, onLike, onReply, onProfile }) {
  const posterUrl = review.poster && review.poster.startsWith("http")
    ? review.poster
    : "/default-poster.jpg";

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg"; // Safe fallback

  return (
    <>
      {/* Backdrop with fade-down mask */}
      <div style={{ position: "relative", width: "100%", maxHeight: 200, overflow: "hidden" }}>
        <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "50%",
          background: "linear-gradient(to top, #0e0e0e, transparent)"
        }} />
      </div>

      {/* Card */}
      <div style={{ display: "flex", padding: "16px", gap: "12px" }}>
        <img src={posterUrl} alt="Poster" style={{ width: 100, borderRadius: 8, cursor: "pointer" }} onClick={() => onProfile(review.movie?._id)} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {review.user ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={review.user.avatar}
                      alt="Avatar"
                      style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                      onClick={() => onProfile(review.user._id)}
                    />
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        opacity: 0.8,
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
              ) : (
                <span style={{ fontSize: "10px", color: "#888" }}>Unknown user</span>
              )}
            </div>

            {/* Like + Reply button together */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span onClick={onLike} style={{ cursor: "pointer", fontSize: "24px" }}>
                  {(review.likes || []).includes(userId) ? (
                    <AiFillHeart style={{ color: "#B327F6" }} />
                  ) : (
                    <AiOutlineHeart />
                  )}
                </span>
                <span style={{ fontSize: "14px" }}>{review.likes?.length || 0}</span>
              </div>

              <button
                style={{
                  background: "transparent",
                  border: "1px solid #555",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer"
                }}
                onClick={onReply}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
