import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { HiOutlineRefresh, HiDotsVertical } from "react-icons/hi";
import { FaImage } from "react-icons/fa";
import { BiSolidFileGif } from "react-icons/bi";
import { FiSend } from "react-icons/fi";
import api from "../api/api";
import StarRating from "../components/StarRating";
import GifSearchModal from "../components/GifSearchModal";
import toast from "react-hot-toast";

export default function AllReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [activeReviewId, setActiveReviewId] = useState(null);
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const [reviews, setReviews] = useState([]);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [selectedGif, setSelectedGif] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "friends"

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
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setUserId(user._id);
    }
    fetchReviews();
  }, [id, filter]);

  const fetchReviews = async () => {
    try {
      const endpoint =
        filter === "friends"
          ? `/api/logs/movie/${id}/friends` // ✅ fetch only friends logs
          : `/api/logs/movie/${id}/popular?all=true`;

      const res = await api.get(endpoint);

      // ✅ Only keep top-level reviews (not replies)
      const filtered = res.data.filter(
        (log) =>
          (log.review &&
            log.review.trim() !== "" &&
            !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(
              log.review.trim()
            )) ||
          log.gif ||
          log.image
      );

      setReviews(filtered);
    } catch (err) {
      console.error("❌ Failed to load reviews", err);
    }
  };

  const handleReply = (commentId, username, reviewId) => {
    setReplyingTo({ id: commentId, username });
    setInput(`@${username} `);
    setActiveReviewId(reviewId);
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedGif && !selectedImage) return;
    if (!activeReviewId)
      return console.error("❌ No activeReviewId — cannot send reply");

    try {
      const formData = new FormData();
      formData.append("text", input);
      if (!user?._id) return console.error("Missing user");

      if (replyingTo?.id) formData.append("parentComment", replyingTo.id);
      if (selectedGif) formData.append("gif", selectedGif);
      if (selectedImage) formData.append("image", selectedImage);

      await api.post(`/api/logs/${activeReviewId}/reply`, formData, {
        headers: {
          Authorization: `Bearer ${
            JSON.parse(localStorage.getItem("user"))?.token
          }`,
        },
      });

      setInput("");
      setSelectedGif("");
      setSelectedImage("");
      setReplyingTo(null);
      setActiveReviewId(null);
      toast.success("Reply sent 🎉");
    } catch (err) {
      console.error("❌ Failed to send reply", err);
      toast.error("Failed to send reply ❌");
    }
  };

  return (
    <div style={{ padding: "16px 12px", paddingBottom: 80 }}>
      {/* 🔙 Back + Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "20px",
              marginRight: "12px",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>
          {filter === "friends" ? "Friends Reviews" : "All Reviews"}
          </h2>
        </div>

        {/* Toggle (All first, Friends second) */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              background: filter === "all" ? "#B327F6" : "transparent",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "13px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("friends")}
            style={{
              background: filter === "friends" ? "#B327F6" : "transparent",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "13px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Friends
          </button>
        </div>
      </div>

      {/* 🔁 Reviews */}
      {reviews.map((review) => {
        const isLiked = review.likes?.includes(userId);
        return (
          <div
            key={review._id}
            style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #222",
              borderRadius: 8,
              padding: 10,
            }}
          >
        <div style={{ display: "flex", gap: 10 }}>
          <img
            src={review.user?.avatar || "/default-avatar.jpg"}
            onError={e => (e.target.src = "/default-avatar.jpg")}
            style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}
            onClick={() => navigate(`/profile/${review.user._id}`)}
          />

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong
                style={{
                  fontSize: 14,
                  color: "#ddd",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif"
                }}
                onClick={() => navigate(`/profile/${review.user._id}`)}
              >
                @{review.user.username}
              </strong>
              {review.rating && <StarRating rating={review.rating} size={12} />}
              {review.rewatchCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <HiOutlineRefresh size={12} color="#aaa" />
                  <span style={{ fontSize: 10, color: "#aaa" }}>
                    {review.rewatchCount}x
                  </span>
                </div>
              )}
              <span style={{ fontSize: 10, color: "#888" }}>
                {getRelativeTime(review.createdAt)}
              </span>
            </div>

            {review.review && review.review !== "__media__" && (
              <div
                style={{
                  fontSize: 14,
                  color: "#ddd",
                  marginTop: 2,
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "pre-wrap"
                }}
              >
                {review.review}
              </div>
            )}

            {review.gif && (
              <img
                src={review.gif}
                style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
              />
            )}
            {review.image && (
              <img
                src={review.image}
                style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
              />
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer"
                }}
                onClick={() =>
                  handleReply(review._id, review.user.username, review._id)
                }
              >
                Reply
              </button>

              <div
                onClick={() => handleLike(review._id)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {isLiked ? (
                  <AiFillHeart size={16} color="#B327F6" />
                ) : (
                  <AiOutlineHeart size={16} color="#888" />
                )}
                <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                  {review.likes?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

{/* 🧵 Replies */}
{review.replies?.map(reply => {
  console.log("🧪 MAIN REPLY OBJECT:", reply);

  const isChildLiked = reply.likes?.includes(userId);
  

  const replyUserId = typeof reply.user === "string" ? reply.user : reply.user?._id;
  const replyUsername = typeof reply.user === "object" ? reply.user.username : reply.username;
  const replyAvatar = typeof reply.user === "object" ? reply.user.avatar : reply.avatar || "/default-avatar.jpg";


  console.log("🧪 REPLY USER FIELDS:", {
    replyUserId,
    replyUsername,
    replyAvatar
  });
  
  

  return (
    <div key={reply._id} style={{ paddingLeft: 20, marginTop: 8 }}>
      <div style={{ display: "flex", gap: 10, position: "relative" }}>
        <img
          src={replyAvatar}
          onError={e => (e.target.src = "/default-avatar.jpg")}
          style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer" }}
          onClick={() => {
            console.log("👤 Navigating to reply user profile:", replyUserId);
            navigate(`/profile/${replyUserId}`);
          }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <strong
              style={{ fontSize: 13, color: "#ddd", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              onClick={() => {
                console.log("👤 Username clicked:", replyUsername, "→", replyUserId);
                navigate(`/profile/${replyUserId}`);
              }}
            >
              @{replyUsername || "DeletedUser"}
            </strong>
            <span style={{ fontSize: 10, color: "#888" }}>
              {getRelativeTime(reply.createdAt)}
            </span>
          </div>

          <div style={{ fontSize: 13, color: "#ddd", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
            {reply.text}
          </div>

          {reply.gif && <img src={reply.gif} style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />}
          {reply.image && <img src={reply.image} style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />}

          <button
            onClick={() => {
              console.log("🗨️ Replying to:", replyUsername);
              handleReply(reply._id, replyUsername, review._id);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 13,
              cursor: "pointer",
              marginTop: 4,
              padding: 0
            }}
          >
            Reply
          </button>

          {/* 🧵 Nested Replies */}
          {reply.children?.map(child => {
            console.log("🧪 NESTED REPLY OBJECT:", child);

            const isGrandChildLiked = child.likes?.includes(userId);
            const childUserId = typeof child.user === "string" ? child.user : child.user?._id;
            const childUsername = typeof child.user === "object" ? child.user.username : child.username;
            const childAvatar = typeof child.user === "object" ? child.user.avatar : child.avatar || "/default-avatar.jpg";

            console.log("🧪 CHILD USER FIELDS:", { childUserId, childUsername, childAvatar });

            return (
              <div key={child._id} style={{ paddingLeft: 20, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 10, position: "relative" }}>
                  <img
                    src={childAvatar}
                    onError={e => (e.target.src = "/default-avatar.jpg")}
                    style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer" }}
                    onClick={() => {
                      console.log("👶 Navigating to child user profile:", childUserId);
                      navigate(`/profile/${childUserId}`);
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <strong
                        style={{ fontSize: 13, color: "#ddd", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                        onClick={() => {
                          console.log("👶 Username clicked:", childUsername, "→", childUserId);
                          navigate(`/profile/${childUserId}`);
                        }}
                      >
                        @{childUsername || "DeletedUser"}
                      </strong>
                      <span style={{ fontSize: 10, color: "#888" }}>
                        {getRelativeTime(child.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#ddd", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                      {child.text}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      onClick={() => {
                        console.log("💗 Like CHILD:", child._id);
                        handleLikeReply(review._id, child._id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {isGrandChildLiked ? (
                        <AiFillHeart size={16} color="#B327F6" />
                      ) : (
                        <AiOutlineHeart size={16} color="#888" />
                      )}
                    </div>
                    {childUserId === userId && (
                      <div style={{ position: "relative" }}>
                        <HiDotsVertical
                          size={14}
                          onClick={() => setMenuOpenId(menuOpenId === child._id ? null : child._id)}
                          style={{ cursor: "pointer", color: "#888" }}
                        />
                        {menuOpenId === child._id && (
                          <div
                            style={{
                              position: "absolute",
                              top: 20,
                              right: 0,
                              background: "#222",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              color: "#f55",
                              cursor: "pointer",
                              zIndex: 5
                            }}
                            onClick={() => {
                              console.log("❌ Delete CHILD:", child._id);
                              handleDelete(child._id, review._id); 
                            }}
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

{/* ❤️ Like + 3-dot */}
<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
  <div
    onClick={() => {
      console.log("💗 Like MAIN REPLY:", reply._id);
      handleLikeReply(review._id, reply._id);
    }}
    style={{ cursor: "pointer" }}
  >
    {isChildLiked ? (
      <AiFillHeart size={16} color="#B327F6" />
    ) : (
      <AiOutlineHeart size={16} color="#888" />
    )}
  </div>

  {/* ✅ Add this right after the icon */}
  <span style={{ fontSize: 13, color: "#aaa" }}>
    {reply.likes?.length || 0}
  </span>

  {replyUserId === userId && (
    <div style={{ position: "relative" }}>
      <HiDotsVertical
        size={14}
        onClick={() => setMenuOpenId(menuOpenId === reply._id ? null : reply._id)}
        style={{ cursor: "pointer", color: "#888" }}
      />
      {menuOpenId === reply._id && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 0,
            background: "#222",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 12,
            color: "#f55",
            cursor: "pointer",
            zIndex: 5
          }}
          onClick={() => {
            console.log("❌ Delete MAIN REPLY:", reply._id); // ✅
            handleDelete(reply._id, review._id);             // ✅ use 'reply', not 'child'
          }}          
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



    
      {/* ✏️ Reply Input */}
      {replyingTo?.id && (
        <div style={{ position: "fixed", bottom: 0, width: "90%", background: "#0e0e0e", borderTop: "1px solid #222", padding: "12px 12px", zIndex: 99 }}>
          {(selectedGif || selectedImage) && (
            <div style={{ paddingBottom: 8, position: "relative" }}>
              <img
                src={selectedGif || selectedImage}
                alt="preview"
                style={{ width: "100%", borderRadius: 8, maxHeight: 180, objectFit: "cover" }}
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
          <div style={{ display: "flex", alignItems: "center" }}>
            <FaImage size={20} color="#888" style={{ cursor: "pointer", marginRight: 8 }} onClick={() => document.getElementById("imageUpload").click()} />
            <BiSolidFileGif size={20} color="#888" style={{ cursor: "pointer", marginRight: 8 }} onClick={() => setShowGifModal(true)} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a reply..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 99,
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                marginLeft: 8,
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              <FiSend />
            </button>
            <input
              type="file"
              accept="image/*"
              id="imageUpload"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setSelectedImage(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
             </div> 
          </div>
      )}

{showGifModal && (
  <GifSearchModal
    onSelect={(gif) => {
      setSelectedGif(gif);
      setShowGifModal(false);
    }}
    onClose={() => setShowGifModal(false)}
  />
)}
</div>
  );
}
