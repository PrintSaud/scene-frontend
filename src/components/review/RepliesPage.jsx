import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaImage, FaStar, FaRegStar } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import { FiSend } from "react-icons/fi";
import { addLogReply, likeReply, getRepliesForLog, deleteReply } from "../../api/api";

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

const renderStars = (rating) => {
  const stars = [];
  const roundedRating = Math.round(rating); // Round to nearest integer
  for (let i = 1; i <= 5; i++) {
    stars.push(
      i <= roundedRating ? (
        <FaStar key={i} size={12} color="#f5c518" />
      ) : (
        <FaRegStar key={i} size={12} color="#555" />
      )
    );
  }
  return stars;
};


export default function RepliesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [replies, setReplies] = useState([]);
  const [input, setInput] = useState("");
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const fetchReplies = async () => {
    try {
      const data = await getRepliesForLog(id);
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
    inputRef.current?.focus();
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleDelete = async (replyId) => {
    const confirmDelete = window.confirm("Delete this reply?");
    if (!confirmDelete) return;
    try {
      await deleteReply(id, replyId);
      fetchReplies();
    } catch (err) {
      console.error("Failed to delete reply", err);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [id]);

  return (
    <div
      style={{
        backgroundColor: "#0e0e0e",
        minHeight: "100vh",
        color: "#fff",
        position: "relative",
        overflowY: "auto",
        paddingBottom: "100px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>
        <h3 style={{ fontSize: "18px" }}>Comments</h3>
      </div>

      {/* Replies list */}
      <div ref={listRef} style={{ padding: "56px 16px 0 16px" }}>
        {replies.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888", fontSize: 14 }}>
            No comments yet. Be the first to reply!
          </div>
        )}

        {replies.map((r) => {
          const isLikedByMe = r.likes?.includes(userId);
          return (
            <div
              key={r._id}
              onContextMenu={(e) => {
                e.preventDefault();
                if (r.userId === userId) handleDelete(r._id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 14,
                gap: 10,
              }}
            >
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
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/profile/${r.userId}`)}
                >
                  <strong
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    @{r.username}
                  </strong>
                  {r.ratingForThisMovie && renderStars(r.ratingForThisMovie)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#ddd",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {r.text}
                </div>
              </div>
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

      {/* SceneBot-style input */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "12px 12px",
          background: "#0e0e0e",
          borderTop: "1px solid #222",
          display: "flex",
          alignItems: "center",
          zIndex: 99,
        }}
      >
        <FaImage size={20} style={{ cursor: "pointer", color: "#888", marginRight: 8 }} />
        <BiSolidFileGif size={20} style={{ cursor: "pointer", color: "#888", marginRight: 8 }} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a comment..."
          style={{
            flex: "0 0 75%",
            padding: "12px 16px",
            borderRadius: "999px",
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "#fff",
            fontSize: "15px",
            fontFamily: "Inter, sans-serif",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            marginLeft: "8px",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}
