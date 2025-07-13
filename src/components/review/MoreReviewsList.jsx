import React from "react";
import StarRating from "../StarRating";

export default function MoreReviewsList({ reviews, onClick }) {
  // Only show reviews that have non-empty review text
  const filteredReviews = reviews.filter(r => r.review && r.review.trim().length > 0);

  return (
    <div style={{ padding: "16px" }}>
      <h4>More reviews</h4>
      {filteredReviews.map((r) => (
        <div
          key={r._id}
          style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: 12, cursor: "pointer" }}
          onClick={() => onClick(r._id)}
        >
          <img
            src={(r.posterOverride && r.posterOverride.startsWith("http")) ? r.posterOverride : "/default-poster.jpg"}
            alt="Poster"
            style={{ width: 60, borderRadius: 6 }}
          />
          <div>
            <StarRating rating={r.rating} />
            <p style={{ fontFamily: "Inter, sans-serif" }}>
              {r.review.split(" ").slice(0, 15).join(" ")}
              {r.review.split(" ").length > 15 && "…read more"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
