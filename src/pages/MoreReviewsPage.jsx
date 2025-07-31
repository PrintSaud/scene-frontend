import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { HiOutlineRefresh } from "react-icons/hi";
import StarRating from "../components/StarRating";
import getRelativeTime from "../utils/getRelativeTime";

export default function MoreReviewsPage() {
  const { id } = useParams(); // movie TMDB id
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [replyTo, setReplyTo] = useState(null); // which review we're replying to
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/api/logs/movie/${id}/popular?all=true`);
        setReviews(res.data);
      } catch (err) {
        console.error("❌ Failed to load more reviews", err);
      }
    };

    fetchReviews();
  }, [id]);

  const handleLike = async (logId) => {
    try {
      await api.post(`/api/logs/${logId}/like`);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === logId
            ? {
                ...r,
                likes: r.likes.includes(user._id)
                  ? r.likes.filter((u) => u !== user._id)
                  : [...r.likes, user._id],
              }
            : r
        )
      );
    } catch (err) {
      console.error("❌ Failed to like review:", err);
    }
  };

  const handleReply = async (logId) => {
    try {
      if (!replyText.trim()) return;

      await api.post(`/api/logs/${logId}/replies`, {
        text: replyText,
      });

      setReplyText("");
      setReplyTo(null);
      // Optionally: auto-navigate to full RepliesPage
      navigate(`/replies/${logId}`);
    } catch (err) {
      console.error("❌ Failed to post reply:", err);
    }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>All Reviews</h2>

      {reviews.length === 0 ? (
        <p style={{ color: "#888" }}>No reviews yet.</p>
      ) : (
        reviews.map((r) => {
          const isLiked = r.likes.includes(user?._id);
          const replying = replyTo === r._id;

          return (
            <div
              key={r._id}
              style={{
                paddingBottom: 16,
                borderBottom: "1px solid #222",
                marginBottom: 16,
              }}
            >
              {/* Top Section */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={r.avatar || "/default-avatar.jpg"}
                  alt="avatar"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/profile/${r.userId || r.user?._id}`)}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <strong
                      style={{ color: "#ddd", fontSize: 14, cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${r.userId || r.user?._id}`)}
                    >
                      @{r.username}
                    </strong>

                    {r.rating && <StarRating rating={r.rating} size={12} />}
                    {r.rewatchCount > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <HiOutlineRefresh size={12} color="#aaa" />
                        <span style={{ fontSize: 10, color: "#aaa" }}>
                          {r.rewatchCount}x
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: 10, color: "#888" }}>
                      {getRelativeTime(r.createdAt)}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => handleLike(r._id)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {isLiked ? (
                    <AiFillHeart size={16} color="#B327F6" />
                  ) : (
                    <AiOutlineHeart size={16} color="#888" />
                  )}
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                    {r.likes?.length || 0}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div style={{ marginTop: 6 }}>
                <p style={{ color: "#ddd", fontSize: 14 }}>{r.review}</p>

                {r.gif && (
                  <img
                    src={r.gif}
                    alt="gif"
                    style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                  />
                )}
                {r.image && (
                  <img
                    src={r.image}
                    alt="img"
                    style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                  />
                )}
              </div>

              {/* Reply button */}
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() =>
                    setReplyTo(replying ? null : r._id) ||
                    setReplyText(`@${r.username} `)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Reply
                </button>
              </div>

              {/* Reply Input */}
              {replying && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#111",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: 6,
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  />
                  <button
                    onClick={() => handleReply(r._id)}
                    style={{
                      background: "#B327F6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
