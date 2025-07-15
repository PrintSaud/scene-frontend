import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/api";
import { likeLog, likeReply } from "../../api/api";
import { backend } from "../../config";
import { AiOutlineHeart } from "react-icons/ai";
import ReviewHeader from "./ReviewHeader";
import MoreReviewsList from "./MoreReviewsList";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;

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

  const handleReply = () => navigate(`/reply/${id}`);
  const handleProfile = (profileId) => navigate(`/profile/${profileId}`);
  const handleMoreReviewsClick = (reviewId) => navigate(`/review/${reviewId}`);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/review/${review._id}`);
    toast.success("🔗 Link copied!");
  };

  const handleChangeBackdrop = () => toast("Change backdrop clicked!");
  const handleEdit = () => toast("Edit review clicked!");
  const handleDelete = () => toast("Delete review clicked!");

  if (!review) return null;

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "#fff", minHeight: "100vh" }}>
      <ReviewHeader
        review={review}
        userId={userId}
        onLike={handleLike}
        onReply={handleReply}
        onProfile={handleProfile}
        onChangeBackdrop={handleChangeBackdrop}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

{/* 💬 Comments section */}
<div style={{ marginTop: "24px" }}>
  {/* Heading with "More" button */}
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: replies.length === 0 ? "4px" : "12px", // tighter when no comments
    padding: "0 24px"
  }}>
    <h3 style={{ 
      fontSize: "18px", 
      margin: 0, 
      marginLeft: "-6px"  // push further left (cleaner than "2px")
    }}>
      Comments
    </h3>
    <button
      onClick={() => navigate(`/review/${id}/replies`)}
      style={{
        background: "none",
        border: "none",
        color: "#888",
        fontSize: "14px",
        cursor: "pointer",
        marginRight: "-8px" // push "More →" a bit right
      }}
    >
      More →
    </button>
  </div>

  {/* If no replies */}
  {replies.length === 0 ? (
    <div style={{ paddingLeft: "24px" }}>
      <p style={{ color: "#888", fontSize: "14px", marginLeft: "-6px" }}>No comments yet.</p>
    </div>
  ) : (
    <>
      {replies.slice(0, 3).map((r) => (
        <div
          key={r._id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            padding: "0 24px"
          }}
        >
                {/* Profile pic */}
                <img
                  src={r.user?.avatar || "/default-avatar.jpg"}
                  alt="avatar"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  onClick={() => handleProfile(r.userId)}
                />

                {/* Inline username, rating, comment */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <strong
                    style={{ cursor: "pointer", fontSize: 14 }}
                    onClick={() => handleProfile(r.userId)}
                  >
                    @{r.username}
                  </strong>

                  {r.ratingForThisMovie && (
                    <span style={{ fontSize: 12, color: "#ccc" }}>
                      ⭐️ {r.ratingForThisMovie.toFixed(1)}
                    </span>
                  )}

                  <span style={{ fontSize: 14, color: "#ddd" }}>{r.text}</span>
                </div>

                {/* Like button */}
                <div
                  style={{ marginLeft: "auto", cursor: "pointer" }}
                  onClick={() => handleReplyLike(r._id)}
                >
                  <AiOutlineHeart
                    size={18}
                    color={(r.likes || []).includes(userId) ? "#f00" : "#888"}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* More reviews section */}
      <MoreReviewsList
        reviews={moreReviews}
        onClick={handleMoreReviewsClick}
      />
    </div>
  );
}
