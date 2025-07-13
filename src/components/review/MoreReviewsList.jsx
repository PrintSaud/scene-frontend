import React from "react";
import StarRating from "../StarRating";

export default function MoreReviewsList({ reviews, onClick }) {
  return (
    <div style={{ padding: "16px" }}>
      <h4>More reviews</h4>
      {reviews.map((r) => (
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
            {r.review && (
              <p>
                {r.review.split(" ").slice(0, 15).join(" ")}
                {r.review.split(" ").length > 15 && "…read more"}
              </p>
            )}
            {r.gif && <p>GIF 🎬</p>}
            {r.image && <p>📷 Image</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
