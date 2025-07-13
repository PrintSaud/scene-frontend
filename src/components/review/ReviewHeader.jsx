import React from "react";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { format, formatDistanceToNowStrict, differenceInDays, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ReviewHeader({ review, userId, onLike, onReply, onProfile }) {
  const navigate = useNavigate();

  const posterUrl = review.poster && review.poster.startsWith("http")
    ? review.poster
    : "/default-poster.jpg";

  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

  // 🔥 Determine timestamp display
  let logTimestamp = "";
  if (review.createdAt) {
    const created = parseISO(review.createdAt);
    const daysAgo = differenceInDays(new Date(), created);
    if (daysAgo > 7) {
      logTimestamp = format(created, "MMMM d, yyyy");
    } else {
      logTimestamp = `${formatDistanceToNowStrict(created)} ago`;
    }
  }

  return (
    <>
      {/* Backdrop with fade-down */}
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

      {/* Content layout */}
      <div style={{ display: "flex", padding: "16px", gap: "12px" }}>
        {/* Large Poster */}
        <img
          src={posterUrl}
          alt="Poster"
          style={{ width: 120, borderRadius: 8, cursor: "pointer" }}
          onClick={() => navigate(`/movie/${review.movie?.id || review.movie}`)}
        />

        {/* Film details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Title + release date */}
          <div>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 16, margin: 0 }}>
              {review.movie?.title || "Untitled"}
            </h3>
            {review.movie?.release_date && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, opacity: 0.8, margin: "4px 0 0 0" }}>
                {review.movie.release_date}
              </p>
            )}
            {logTimestamp && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa", margin: "4px 0 0 0" }}>
                Logged {logTimestamp}
              </p>
            )}
          </div>

          {/* Like + reply */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span onClick={onLike} style={{ cursor: "pointer", fontSize: "20px" }}>
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
      </div>

      {/* Profile + username + rating under poster */}
      <div style={{ paddingLeft: "16px", paddingRight: "16px", marginTop: "-12px" }}>
        {review.user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <img
                src={review.user.avatar}
                alt="Avatar"
                style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                onClick={() => onProfile(review.user._id)}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  opacity: 0.8,
                  cursor: "pointer"
                }}
                onClick={() => onProfile(review.user._id)}
              >
                @{review.user.username}
              </span>
            </div>
            <StarRating rating={review.rating} />
          </>
        ) : (
          <span style={{ fontSize: "10px", color: "#888" }}>Unknown user</span>
        )}
      </div>
    </>
  );
}
