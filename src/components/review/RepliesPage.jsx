import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaImage } from "react-icons/fa6";
import { BiSolidFileGif } from "react-icons/bi";
import { FiSend } from "react-icons/fi";
import StarRating from "../StarRating";
import { addLogReply, likeReply, getRepliesForLog, deleteReply } from "../../api/api"; // ✅ keep this line only!
import GifSearchModal from "../GifSearchModal";
import { HiDotsVertical } from "react-icons/hi";
import { useLocation } from "react-router-dom";
import api from "../../api/api"; // ✅ fix relative path
import toast from "react-hot-toast";
import useTranslate from "../../utils/useTranslate"; // ✅ NEW

// ⏱️ Leave timestamps EXACTLY as-is (per your request)
const getRelativeTime = (date) => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return "Just now";
  if (min < 60) return `${min}min ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day <= 7) return `${day}d ago`;

  const d = new Date(date);
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
};

export default function RepliesPage() {
  const t = useTranslate(); // ✅ NEW
  const location = useLocation();
  const { parentCommentId, parentUsername } = location.state || {};
  const { id } = useParams();  // ✅ keep only `id`
  const navigate = useNavigate();
  const [replies, setReplies] = useState([]);

  const topLevelReplies = replies.filter(r => !r.parentComment);
  const rootReplies = topLevelReplies.length > 0 ? topLevelReplies : replies;

  const [tmdbId, setTmdbId] = useState(null);
  const [animatingLikes, setAnimatingLikes] = useState([]);

  const [input, setInput] = useState("");
  const [selectedGif, setSelectedGif] = useState("");
  const [showGifModal, setShowGifModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [parentComment, setParentComment] = useState(null);
  const [log, setLog] = useState(null);

  const fetchReplies = async () => {
    try {
      const res = await api.get(`/api/logs/${id}`);
      const replies = res.data.replies || [];
      const sorted = replies.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setReplies(sorted);
    } catch (err) {
      console.error("❌ Failed to load replies", err);
    }
  };

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await api.get(`/api/logs/${id}`);
        const fullLog = res.data;
        setTmdbId(fullLog.tmdbId);
        setLog(fullLog);
      } catch (err) {
        console.error("❌ Failed to fetch log", err);
      }
    };
    fetchLog();
  }, [id]);

  const handleReplyLike = async (replyId) => {
    try {
      // Optimistic update
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
  
      // 🚀 trigger animation
      setAnimatingLikes((prev) => [...prev, replyId]);
      setTimeout(() => {
        setAnimatingLikes((prev) => prev.filter((id) => id !== replyId));
      }, 400);
  
      // Backend call
      await likeReply(id, replyId);
    } catch (err) {
      console.error("Failed to like reply", err);
      toast.error(t("Failed to like reply"));
    }
  };
  

  useEffect(() => {
    if (parentUsername) {
      setInput(`@${parentUsername} `);
      inputRef.current?.focus();
    }
  }, [parentUsername]);

  const handleSend = async () => {
    if (!input.trim() && !selectedGif && !selectedImage) return;

    const formData = new FormData();
    formData.append("text", input || "");
    if (selectedGif) formData.append("gif", selectedGif);
    if (selectedImage) formData.append("externalImage", selectedImage);
    if (parentCommentId) formData.append("parentComment", parentCommentId);

    try {
      await addLogReply(id, formData);
      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      fetchReplies();
      inputRef.current?.focus();

      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);

      toast.success(t("Reply sent"));
    } catch (err) {
      console.error("❌ Failed to send reply", err);
      toast.error(t("Failed to send reply"));
    }
  };

  const handleDelete = async (replyId) => {
    const confirmDelete = window.confirm(t("Delete this reply?"));
    if (!confirmDelete) return;

    try {
      await deleteReply(id, replyId); // `id` = logId
      fetchReplies();
      toast.success(t("Reply deleted"));
    } catch (err) {
      console.error("Failed to delete reply", err);
      toast.error(t("Failed to delete reply"));
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

  const handlePickGif = () => setShowGifModal(true);
  const handleGifSelect = (gifUrl) => {
    setSelectedGif(gifUrl);
    setShowGifModal(false);
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
          aria-label={t("Back")}
          title={t("Back")}
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
          {t("Comments")}
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
      <div ref={listRef} style={{ padding: "72px 16px 0 16px", fontFamily: "Inter, sans-serif" }}>
        {rootReplies.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888", fontSize: 14 }}>
            {t("No comments yet. Be the first to reply!")}
          </div>
        )}

        {rootReplies.map((parent) => {
          const isLikedByMeParent = parent.likes?.includes(userId);
          const childReplies = replies.filter((c) => c.parentComment === parent._id);

          return (
            <div key={parent._id} style={{ marginBottom: 16 }}>
              {/* Parent comment */}
              <div
                style={{
                  backgroundColor: parent._id === parentCommentId ? "#1e1e1e" : "transparent",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src={parent.avatar || "/default-avatar.jpg"}
                    alt={t("Avatar")}
                    style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${parent.userId}`)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-avatar.jpg";
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <strong
                        style={{ fontSize: 14, color: "#ddd", cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${parent.userId}`)}
                      >
                        @{parent.username || t("Unknown")}
                      </strong>

                      {/* ⭐ Star rating right next to username */}
                      {parent.ratingForThisMovie && <StarRating rating={parent.ratingForThisMovie} size={14} />}

                      <span style={{ fontSize: 10, color: "#888" }}>
                        {getRelativeTime(parent.createdAt)}
                      </span>
                    </div>

                    {/* 💬 Comment text */}
                    <span style={{ fontSize: 14, color: "#ddd", marginTop: 2, display: "block" }}>
                      {parent.text}
                    </span>

                    {/* 🎞️ Media attachments */}
                    {parent.gif && (
                      <img
                        src={parent.gif}
                        alt={t("GIF")}
                        style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                      />
                    )}
                    {parent.image && (
                      <img
                        src={parent.image}
                        alt={t("Image")}
                        style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                      />
                    )}

                    {/* 🗨️ Reply button */}
                    <button
                      onClick={() =>
                        navigate(`/replies/${id}`, {
                          state: { parentCommentId: parent._id, parentUsername: parent.username },
                        })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "#888",
                        fontSize: 13,
                        cursor: "pointer",
                        padding: 0,
                        marginTop: 4,
                        textAlign: "left",
                      }}
                    >
                      {t("Reply")}
                    </button>
                  </div>

{/* Like + 3-dots for parent */}
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div
    onClick={() => handleReplyLike(parent._id)}
    style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
  >
    <span
      style={{
        display: "flex",
        alignItems: "center",
        transition: "transform 0.3s ease, color 0.3s ease",
        transform: animatingLikes.includes(parent._id) ? "scale(1.4)" : "scale(1)",
      }}
    >
      {isLikedByMeParent ? (
        <AiFillHeart size={16} color="#B327F6" style={{ transition: "color 0.3s ease" }} />
      ) : (
        <AiOutlineHeart size={16} color="#888" />
      )}
    </span>
    <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
      {parent.likes?.length || 0}
    </span>
  </div>


                    {parent.userId === userId && (
                      <div style={{ position: "relative" }}>
                        <HiDotsVertical
                          size={14}
                          style={{ cursor: "pointer", color: "#888" }}
                          onClick={() => setMenuOpenId(menuOpenId === parent._id ? null : parent._id)}
                          aria-label={t("Options")}
                          title={t("Options")}
                        />
                        {menuOpenId === parent._id && (
                          <div
                            style={{
                              position: "absolute",
                              top: 18,
                              right: 0,
                              background: "#222",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              color: "#f55",
                              cursor: "pointer",
                            }}
                            onClick={() => handleDelete(parent._id)}
                          >
                            {t("Delete")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Child replies */}
              {childReplies.map((child) => {
                const isLikedByMeChild = child.likes?.includes(userId);
                return (
                  <div key={child._id} style={{ paddingLeft: 20, fontSize: 13, opacity: 0.9, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={child.avatar || "/default-avatar.jpg"}
                        alt={t("Avatar")}
                        style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${child.userId}`)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/default-avatar.jpg";
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <strong
                            onClick={() => navigate(`/profile/${child.userId}`)}
                            style={{ fontSize: 13, color: "#ddd", cursor: "pointer" }}
                          >
                            @{child.username || t("Unknown")}
                          </strong>
                          <span style={{ fontSize: 10, color: "#888" }}>
                            {getRelativeTime(child.createdAt)}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, color: "#ddd", marginTop: 2, display: "block" }}>
                          {child.text}
                        </span>
                        {child.rating && (
                          <div style={{ marginTop: 4 }}>
                            <StarRating rating={child.rating} size={10} />
                          </div>
                        )}
                        {child.gif && (
                          <img
                            src={child.gif}
                            alt={t("GIF")}
                            style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                          />
                        )}
                        {child.image && (
                          <img
                            src={child.image}
                            alt={t("Image")}
                            style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                          />
                        )}
                        <button
                          onClick={() =>
                            navigate(`/replies/${id}`, {
                              state: { parentCommentId: child._id, parentUsername: child.username },
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#888",
                            fontSize: 13,
                            cursor: "pointer",
                            padding: 0,
                            marginTop: 4,
                            textAlign: "left",
                          }}
                        >
                          {t("Reply")}
                        </button>
                      </div>

{/* Like + 3-dots for child */}
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div
    onClick={() => handleReplyLike(child._id)}
    style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
  >
    <span
      style={{
        display: "flex",
        alignItems: "center",
        transition: "transform 0.3s ease, color 0.3s ease",
        transform: animatingLikes.includes(child._id) ? "scale(1.4)" : "scale(1)",
      }}
    >
      {isLikedByMeChild ? (
        <AiFillHeart size={16} color="#B327F6" style={{ transition: "color 0.3s ease" }} />
      ) : (
        <AiOutlineHeart size={16} color="#888" />
      )}
    </span>
    <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
      {child.likes?.length || 0}
    </span>
  </div>


                        {child.userId === userId && (
                          <div style={{ position: "relative" }}>
                            <HiDotsVertical
                              size={14}
                              style={{ cursor: "pointer", color: "#888" }}
                              onClick={() => setMenuOpenId(menuOpenId === child._id ? null : child._id)}
                              aria-label={t("Options")}
                              title={t("Options")}
                            />
                            {menuOpenId === child._id && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 18,
                                  right: 0,
                                  background: "#222",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 12,
                                  color: "#f55",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleDelete(child._id)}
                              >
                                {t("Delete")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer composer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "#0e0e0e",
          borderTop: "1px solid #222",
          zIndex: 99,
        }}
      >
        {/* Preview (gif/image) */}
        {(selectedGif || selectedImage) && (
          <div style={{ padding: "8px 12px", position: "relative" }}>
            <img
              src={selectedGif || selectedImage}
              alt={t("Preview")}
              style={{
                width: "100%",
                borderRadius: 8,
                objectFit: "cover",
                maxHeight: 180,
              }}
            />
            <button
              onClick={() => {
                setSelectedGif("");
                setSelectedImage("");
              }}
              aria-label={t("Remove attachment")}
              title={t("Remove attachment")}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "rgba(0,0,0,0.6)",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 12px",
          }}
        >
          <FaImage
            size={20}
            style={{ cursor: "pointer", color: "#888", marginRight: 8 }}
            onClick={handlePickImage}
            title={t("Add image")}
            aria-label={t("Add image")}
          />
          <BiSolidFileGif
            size={20}
            style={{ cursor: "pointer", color: "#888", marginRight: 8 }}
            onClick={handlePickGif}
            title={t("Add GIF")}
            aria-label={t("Add GIF")}
          />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("Write a comment...")}
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
            aria-label={t("Send")}
            title={t("Send")}
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

      {/* GIF Modal */}
      {showGifModal && <GifSearchModal onSelect={handleGifSelect} onClose={() => setShowGifModal(false)} />}
    </div>
  );
}
