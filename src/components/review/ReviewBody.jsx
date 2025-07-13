import React from "react";

export default function ReviewBody({ review }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {review.review ? (
        <p style={{ 
          marginTop: 8, 
          fontFamily: "Inter, sans-serif", 
          fontSize: 12,  // 🔹 Slightly smaller font than default (you can set to 13 if you want even smaller)
          lineHeight: "1.4" 
        }}>
          {review.review}
        </p>
      ) : (
        <p style={{ marginTop: 8, color: "#888", fontSize: 14 }}>No review text.</p>
      )}

      {review.image && (
        <img src={review.image} alt="Attached" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
      )}

      {review.gif && (
        <img src={review.gif} alt="GIF" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
      )}
    </div>
  );
}

