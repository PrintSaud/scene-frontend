import React from "react";

export default function ReviewBody({ review }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {review.review ? (
        <p style={{ marginTop: 8 }}>{review.review}</p>
      ) : (
        <p style={{ marginTop: 8, color: "#888" }}>No review text.</p>
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
