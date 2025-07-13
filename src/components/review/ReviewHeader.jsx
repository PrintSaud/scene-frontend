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
      <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />

      <div style={{ display: "flex", padding: "16px", gap: "12px" }}>
        <img src={posterUrl} alt="Poster" style={{ width: 80, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {review.user ? (
                <>
                  <img
                    src={review.user.avatar}
                    alt="Avatar"
                    style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                    onClick={() => onProfile(review.user._id)}
                  />
                  <span
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => onProfile(review.user._id)}
                  >
                    @{review.user.username}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "13px", color: "#888" }}>Unknown user</span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StarRating rating={review.rating} />
              <FaHeart
                onClick={onLike}
                style={{
                  cursor: "pointer",
                  color: (review.likes || []).includes(userId) ? "red" : "white",
                }}
              />
              <button onClick={onReply}>Reply</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
