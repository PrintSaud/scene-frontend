import React from "react";
import { FaHeart } from "react-icons/fa";

export default function ReplyList({ replies, userId, reviewId, onReplyLike, onProfile }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {replies.slice(0, 2).map((r) => (
        <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={r.avatar}
              alt="Avatar"
              style={{ width: 24, height: 24, borderRadius: "50%", cursor: "pointer" }}
              onClick={() => onProfile(r.user?._id || r.userId)}
            />
            <span
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() => onProfile(r.user?._id || r.userId)}
            >
              @{r.username}
            </span>
            <span>{r.text}</span>
          </div>
          <FaHeart
            onClick={() => onReplyLike(r._id)}
            style={{
              cursor: "pointer",
              color: (Array.isArray(r.likes) ? r.likes : []).includes(userId) ? "red" : "white",
            }}
          />
        </div>
      ))}
      {replies.length > 2 && (
        <button onClick={() => onProfile(reviewId)}>Show more replies →</button>
      )}
    </div>
  );
}
