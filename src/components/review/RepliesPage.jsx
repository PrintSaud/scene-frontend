import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import { FiSend } from "react-icons/fi";
import StarRating from "../StarRating";
import { addLogReply, likeReply, getRepliesForLog, deleteReply } from "../../api/api";
import GifSearchModal from "../GifSearchModal";

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
  const [selectedGif, setSelectedGif] = useState("");
  const [showGifModal, setShowGifModal] = useState(false); // ✅ 2️⃣ Manage modal visibility
  const [selectedImage, setSelectedImage] = useState("");
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
    if (!input.trim() && !selectedGif && !selectedImage) return;
    await addLogReply(id, { text: input, gif: selectedGif, image: selectedImage });
    setInput("");
    setSelectedGif("");
    setSelectedImage("");
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

  const handlePickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setSelectedImage(reader.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handlePickGif = () => {
    setShowGifModal(true); // ✅ 3️⃣ Open your real modal
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
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 12,
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
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 500,
            color: "#fff",
            margin: 0,
          }}
        >
          Comments
        </h3>
      </div>

      {/* Gray separator line below header */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: "#333",
          opacity: 0.6,
        }}
      ></div>

      {/* Replies list */}
      <div ref={listRef} style={{ padding: "72px 16px 0 16px" }}>
        {replies.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888", fontSize: 14 }}>
            No comments yet. Be the first to reply!
          </div>
        )}

        {replies.map((r) => {
          const isLikedByMe = r.likes?.includes(userId);
          return (
            <div key={r._id} style={{ position: "relative", marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
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
                        fontWeight: 400,
                        color: "#ddd",
                      }}
                    >
                      @{r.username}
                    </strong>
                    {r.ratingForThisMovie && <StarRating rating={r.ratingForThisMovie} size={12} />}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#ddd",
                      fontFamily: "Inter, sans-serif",
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {r.text}
                  </span>
                  {r.gif && <img src={r.gif} alt="gif" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
                  {r.image && <img src={r.image} alt="img" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>{getRelativeTime(r.createdAt)}</div>
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
              {r.userId === userId && (
                <button
                  onClick={() => handleDelete(r._id)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#f55",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Input field */}
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
        <FaImage
          size={20}
          style={{ cursor: "pointer", color: "#888", marginRight: 8 }}
          onClick={handlePickImage}
        />
        <BiSolidFileGif
          size={20}
          style={{ cursor: "pointer", color: "#888", marginRight: 8 }}
          onClick={handlePickGif}
        />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a comment..."
          style={{
            flex: "0 0 60%",
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
       {/* 4️⃣ GifSearchModal integrated */}
       {showGifModal && (
        <GifSearchModal
          onSelect={handleGifSelect}
          onClose={() => setShowGifModal(false)}
        />
      )}
    </div>
  );
}

