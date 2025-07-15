import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import { addLogReply, likeReply, getRepliesForLog } from "../../api/api";

const getRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}min`;
  if (hr < 24) return `${hr}h`;
  return `${day}d`;
};

export default function RepliesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [replies, setReplies] = useState([]);
  const [input, setInput] = useState("");
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;

  const fetchReplies = async () => {
    try {
      const data = await getRepliesForLog(id);
      console.log("Replies API response:", data); // 🔥 Debug log
      const sorted = (data || []).sort(
        (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
      );
      setReplies(sorted);
    } catch (err) {
      console.error("Failed to load replies", err);
    }
  };

  const handleReplyLike = async (replyId) => {
    try {
      await likeReply(id, replyId);
      setReplies((prev) =>
        prev.map((r) =>
          r._id === replyId
            ? {
                ...r,
                likes: (r.likes || []).includes(userId)
                  ? r.likes.filter((uid) => uid !== userId)
                  : [...(r.likes || []), userId],
              }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to like reply", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await addLogReply(id, { text: input });
    setInput("");
    fetchReplies();
  };

  useEffect(() => {
    fetchReplies();
  }, [id]);

  return (
    <div style={{ backgroundColor: "#0e0e0e", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px" }}>
        <button onClick={() => navigate(-1)}>←</button>
        <h3 style={{ marginLeft: "8px", fontSize: "18px" }}>Comments</h3>
      </div>

      {/* Replies list */}
      <div style={{ padding: "0 16px", paddingBottom: "80px" }}>
        {replies.map((r) => {
          const isLikedByMe = r.likes?.includes(userId);
          return (
            <div
              key={r._id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 14,
                gap: 10,
              }}
            >
              {/* Avatar */}
              <img
                src={r.avatar || "/default-avatar.jpg"}
                alt="avatar"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/profile/${r.userId}`)}
              />
              {/* Username, rating, comment */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong
                    style={{ fontSize: 14, cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${r.userId}`)}
                  >
                    @{r.username}
                  </strong>
                  {r.ratingForThisMovie && (
                    <span style={{ fontSize: 12, color: "#ccc" }}>
                      ⭐️ {r.ratingForThisMovie.toFixed(1)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 14, color: "#ddd" }}>{r.text}</span>
              </div>
              {/* Timestamp + Like */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {getRelativeTime(r.createdAt)}
                </div>
                <div
                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                  onClick={() => handleReplyLike(r._id)}
                >
                  {isLikedByMe ? (
                    <AiFillHeart size={16} color="#B327F6" />
                  ) : (
                    <AiOutlineHeart size={16} color="#888" />
                  )}
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                    {r.likes?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky input */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#1c1c1c",
          padding: "12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FaImage size={20} style={{ cursor: "pointer", color: "#888" }} />
        <BiSolidFileGif size={20} style={{ cursor: "pointer", color: "#888" }} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a comment..."
          style={{
            flex: 1,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: "14px",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: "none",
            border: "none",
            color: "#B327F6",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
