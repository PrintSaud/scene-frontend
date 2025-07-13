import React from "react";
import StarRating from "../StarRating";
import { FaHeart } from "react-icons/fa";

export default function ReviewHeader({ review, userId, onLike, onReply, onProfile }) {
  const posterUrl = review.poster && review.poster.startsWith("http")
    ? review.poster
    : "/default-poster.jpg";

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

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
        <img src={posterUrl} alt="Poster" style={{ width: 80, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                        fontWeight: 400,
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
                <span style={{ fontSize: "13px", color: "#888" }}>Unknown user</span>
              )}
            </div>

            {/* Like button styled like ListViewPage */}
            <button
              onClick={onLike}
              style={{
                background: "none",
                border: "1px solid #fff",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: (review.likes || []).includes(userId) ? 1 : 0.5
              }}
            >
              <FaHeart size={14} style={{ color: (review.likes || []).includes(userId) ? "red" : "#fff" }} />
            </button>

            <button onClick={onReply}>Reply</button>
          </div>
        </div>
      </div>
    </>
  );
}
