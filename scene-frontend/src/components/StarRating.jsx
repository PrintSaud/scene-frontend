// src/components/StarRating.jsx
import React from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function StarRating({ rating = 0, size = 16, compact = false }) {
  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <FaStar style={{ color: "#B327F6", fontSize: size }} />
        <span style={{ color: "#ccc", fontSize: size * 0.85 }}>
          {rating.toFixed(1)} / 10
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[...Array(5)].map((_, i) => {
        const isFull = i + 1 <= rating;
        const isHalf = rating >= i + 0.5 && rating < i + 1;
        return (
          <span key={i}>
            {isFull ? (
              <FaStar style={{ color: "#B327F6", fontSize: size }} />
            ) : isHalf ? (
              <FaStarHalfAlt style={{ color: "#B327F6", fontSize: size }} />
            ) : (
              <FaRegStar style={{ color: "#777", fontSize: size }} />
            )}
          </span>
        );
      })}
    </div>
  );
}
