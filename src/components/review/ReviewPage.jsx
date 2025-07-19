import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/api";
import { likeLog, likeReply } from "../../api/api";
import { backend } from "../../config";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import ReviewHeader from "./ReviewHeader";
import MoreReviewsList from "./MoreReviewsList";
import StarRating from "../StarRating";
import api from "../../api/api";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;

  function getRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diff = (now - then) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString();
  }


  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this review?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/logs/${review._id}`);
      toast.success("🗑️ Review deleted!");
      navigate("/profile");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete review.");
    }
  };
  
  
  const handleEdit = () => {
    navigate(`/movie/${review.movie?.id || review.movie}?edit=1&logId=${review._id}`);
  };
  


  

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${backend}/api/logs/${id}`);
      setReview(data);
      setReplies(data.replies || []);
      if (data.user?._id) {
        const res = await axios.get(`${backend}/api/logs/user/${data.user._id}`);
        const filtered = res.data.filter((r) => r._id !== id);
        setMoreReviews(filtered.slice(0, 3));
      }
    } catch (err) {
      toast.error("Failed to load review.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (!userId) return toast.error("You must be logged in to like.");
    try {
      await likeLog(id);
      setReview((prev) => ({
        ...prev,
        likes: (prev.likes || []).includes(userId)
          ? (prev.likes || []).filter((uid) => uid !== userId)
          : [...(prev.likes || []), userId],
      }));
    } catch {
      toast.error("Failed to like.");
    }
  };

  const handleReplyLike = async (replyId) => {
    if (!userId) return toast.error("You must be logged in to like.");
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
    } catch {
      toast.error("Failed to like reply.");
    }
  };

  const handleProfile = (profileId) => navigate(`/profile/${profileId}`);
  const handleMoreReviewsClick = (reviewId) => navigate(`/review/${reviewId}`);

  if (!review) return null;

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "#fff", minHeight: "100vh" }}>
<ReviewHeader
  review={review}
  userId={userId}
  onLike={handleLike}
  onProfile={handleProfile}
  onChangeBackdrop={() => navigate(`/review/${review._id}/change-backdrop`)}
  onEdit={handleEdit}         // 🟢 Add this
  onDelete={handleDelete}     // 🟢 Add this
/>


      {/* 💬 Comments section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", marginBottom: replies.length === 0 ? 4 : 12 }}>
          <h3 style={{ fontSize: 18, margin: 0, marginLeft: -6 }}>Comments</h3>
          <button
            onClick={() => navigate(`/review/${id}/replies`)}
            style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginRight: -12 }}
          >
            More →
          </button>
        </div>

        {replies.length === 0 ? (
          <div style={{ paddingLeft: 24 }}>
            <p style={{ color: "#888", fontSize: 14, marginLeft: -6 }}>No comments yet.</p>
          </div>
        ) : (
          [...replies]
            .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
            .slice(0, 3)
            .map((r) => {
              const isLikedByMe = r.likes?.includes(userId);
              return (
                <div key={r._id} style={{ position: "relative", marginBottom: 14, padding: "0 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Avatar */}
                    <img
                      src={r.avatar || "/default-avatar.jpg"}
                      alt="avatar"
                      style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                      onClick={() => handleProfile(r.userId)}
                    />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {/* Username, stars, time */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 400, color: "#ddd", cursor: "pointer" }} onClick={() => handleProfile(r.userId)}>
                          @{r.username}
                        </strong>
                        {r.ratingForThisMovie && (
                          <StarRating rating={r.ratingForThisMovie} size={12} />
                        )}
                        <span style={{ fontSize: 10, color: "#888" }}>
                          {getRelativeTime(r.createdAt)}
                        </span>
                      </div>

                      {/* Text comment */}
                      {r.text && (
                        <span style={{ fontSize: 14, color: "#ddd", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
                          {r.text}
                        </span>
                      )}

                      {/* Optional gif/image */}
                      {r.gif && (
                        <img src={r.gif} alt="gif" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />
                      )}
                      {r.image && (
                        <img src={r.image} alt="img" style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }} />
                      )}

                      {/* Reply button */}
                      <button
                        onClick={() => navigate(`/replies/${id}`, {
                          state: { parentCommentId: r._id, parentUsername: r.username }
                        })}
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
                        Reply
                      </button>
                    </div>

                    {/* Like button */}
                    <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => handleReplyLike(r._id)}>
                      {isLikedByMe ? <AiFillHeart size={16} color="#B327F6" /> : <AiOutlineHeart size={16} color="#888" />}
                      <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{r.likes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* ⭐ More reviews section */}
      <MoreReviewsList reviews={moreReviews} onClick={handleMoreReviewsClick} />
    </div>
  );
}
