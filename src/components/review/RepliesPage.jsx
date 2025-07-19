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
  const location = useLocation();
const { parentCommentId, parentUsername } = location.state || {};
  const { id } = useParams();  // ✅ keep only `id`
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
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [parentComment, setParentComment] = useState(null);

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

  useEffect(() => {
    if (parentUsername) {
      setInput(`@${parentUsername} `);
      inputRef.current?.focus();
    }
  }, [parentUsername]);


  const handleSend = async () => {
    if (!input.trim() && !selectedGif && !selectedImage) return;
  
    const formData = new FormData();
    formData.append('text', input || '');
    if (selectedGif) formData.append('gif', selectedGif);
    if (selectedImage) formData.append('externalImage', selectedImage);
    if (parentCommentId) formData.append('parentComment', parentCommentId);
  
    try {
      await addLogReply(id, formData);
      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      fetchReplies();
      inputRef.current?.focus();
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("❌ Failed to send reply", err);
    }
  };

  const handleDelete = async (replyId) => {
    const confirmDelete = window.confirm("Delete this reply?");
    if (!confirmDelete) return;
    try {
      await deleteReply(id, replyId);
      fetchReplies(); // Refresh after deletion
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
<div ref={listRef} style={{ padding: "72px 16px 0 16px", fontFamily: "Inter, sans-serif" }}>
  {replies.length === 0 && (
    <div style={{ textAlign: "center", marginTop: 40, color: "#888", fontSize: 14 }}>
      No comments yet. Be the first to reply!
    </div>
  )}

{replies
  .filter(r => !r.parentComment)
  .map(parent => {
    const isLikedByMeParent = parent.likes?.includes(userId);
    const childReplies = replies.filter(c => c.parentComment === parent._id);

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
              alt="avatar"
              style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
              onClick={() => navigate(`/profile/${parent.userId}`)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong
                  style={{ fontSize: 14, color: "#ddd", cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${parent.userId}`)}
                >
                  @{parent.username}
                </strong>
                <span style={{ fontSize: 10, color: "#888" }}>{getRelativeTime(parent.createdAt)}</span>
              </div>
              <span style={{ fontSize: 14, color: "#ddd", marginTop: 2, display: "block" }}>{parent.text}</span>
              {parent.gif && <img src={parent.gif} alt="gif" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
              {parent.image && <img src={parent.image} alt="img" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
              <button
                onClick={() => navigate(`/replies/${id}`, { state: { parentCommentId: parent._id, parentUsername: parent.username } })}
                style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", padding: 0, marginTop: 4, textAlign: "left" }}
              >
                Reply
              </button>
            </div>

            {/* Like + 3-dots for parent */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => handleReplyLike(parent._id)}>
                {isLikedByMeParent ? <AiFillHeart size={16} color="#B327F6" /> : <AiOutlineHeart size={16} color="#888" />}
                <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{parent.likes?.length || 0}</span>
              </div>

              {parent.userId === userId && (
                <div style={{ position: "relative" }}>
                  <HiDotsVertical
                    size={14}
                    style={{ cursor: "pointer", color: "#888" }}
                    onClick={() => setMenuOpenId(menuOpenId === parent._id ? null : parent._id)}
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
                      Delete
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Child replies */}
        {childReplies.map(child => {
          const isLikedByMeChild = child.likes?.includes(userId);
          return (
            <div key={child._id} style={{ paddingLeft: 20, fontSize: 13, opacity: 0.9, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={child.avatar || "/default-avatar.jpg"}
                  alt="avatar"
                  style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${child.userId}`)}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong
                      style={{ fontSize: 13, color: "#ddd", cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${child.userId}`)}
                    >
                      @{child.username}
                    </strong>
                    <span style={{ fontSize: 10, color: "#888" }}>{getRelativeTime(child.createdAt)}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#ddd", marginTop: 2, display: "block" }}>{child.text}</span>
                  {child.gif && <img src={child.gif} alt="gif" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
                  {child.image && <img src={child.image} alt="img" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />}
                  <button
                    onClick={() => navigate(`/replies/${id}`, { state: { parentCommentId: child._id, parentUsername: child.username } })}
                    style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", padding: 0, marginTop: 4, textAlign: "left" }}
                  >
                    Reply
                  </button>
                </div>

                {/* Like + 3-dots for child */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => handleReplyLike(child._id)}>
                    {isLikedByMeChild ? <AiFillHeart size={16} color="#B327F6" /> : <AiOutlineHeart size={16} color="#888" />}
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{child.likes?.length || 0}</span>
                  </div>

                  {child.userId === userId && (
                    <div style={{ position: "relative" }}>
                      <HiDotsVertical
                        size={14}
                        style={{ cursor: "pointer", color: "#888" }}
                        onClick={() => setMenuOpenId(menuOpenId === child._id ? null : child._id)}
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
                          Delete
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
    alignItems: "flex-end", // Align at bottom
    gap: 8,
    zIndex: 99,
  }}
>
  {/* Icons */}
  <FaImage
    size={20}
    style={{ cursor: "pointer", color: "#888" }}
    onClick={handlePickImage}
  />
  <BiSolidFileGif
    size={20}
    style={{ cursor: "pointer", color: "#888" }}
    onClick={handlePickGif}
  />

{/* Input footer */}
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
  {/* Preview container inside fixed footer */}
  {(selectedGif || selectedImage) && (
    <div style={{ padding: "8px 12px", position: "relative" }}>
      <img
        src={selectedGif || selectedImage}
        alt="preview"
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
</div>
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
