import React from "react";
import { FaHeart } from "react-icons/fa";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

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
              onClick={() => onProfile(r.userId)}
            />
            <span
              style={{ cursor: "pointer", fontWeight: "bold", fontFamily: "Inter, sans-serif", fontSize: 14 }}
              onClick={() => onProfile(r.userId)}
            >
              @{r.username}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}>{r.text}</span>
          </div>
          <FaHeart
            onClick={() => onReplyLike(r._id)}
            style={{
              cursor: "pointer",
              color: (Array.isArray(r.likes) ? r.likes : []).includes(userId) ? "red" : "white"
            }}
          />
        </div>
      ))}
    </div>
  );
}
