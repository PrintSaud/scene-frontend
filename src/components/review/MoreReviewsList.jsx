import React from "react";
import StarRating from "../StarRating";

export default function MoreReviewsList({ reviews, onClick }) {
  const filteredReviews = reviews.filter(r => r.review && r.review.trim().length > 0).slice(0, 3);

  const getRelativeTime = (date) => {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day <= 7) return `${day}d ago`;
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  return (
    <div style={{ padding: "16px", maxHeight: 240, overflowY: "auto" }}>  {/* ✅ Allow scrolling */}
      <h4 style={{ fontFamily: "Inter, sans-serif" }}>More reviews</h4>
      {filteredReviews.map((r) => (
        <div
          key={r._id}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: 12,
            cursor: "pointer",
            background: "#1a1a1a",
            borderRadius: 8,
            padding: 6
          }}
          onClick={() => onClick(r._id)}
        >
          {/* ⏰ Timestamp top-right */}
          <span style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 10,
            color: "#888"
          }}>
            {getRelativeTime(r.watchedAt)}
          </span>

          <img
            src={(r.posterOverride && r.posterOverride.startsWith("http")) ? r.posterOverride : "/default-poster.jpg"}
            alt="Poster"
            style={{ width: 70, borderRadius: 6, flexShrink: 0 }}
          />
          <div>
            <StarRating rating={r.rating} />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#ccc" }}>
              {r.review.split(" ").slice(0, 15).join(" ")}
              {r.review.split(" ").length > 15 && "…read more"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
