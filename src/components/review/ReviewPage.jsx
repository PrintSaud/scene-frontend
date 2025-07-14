import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/api";
import { likeLog, likeReply } from "../../api/api";
import { backend } from "../../config";
import ReviewHeader from "./ReviewHeader";
import ReplyList from "./ReplyList";
import MoreReviewsList from "./MoreReviewsList";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${backend}/api/logs/${id}`);
      setReview(data);
      setReplies(data.replies || []);
      if (data.user?._id) {
        try {
          const res = await axios.get(`${backend}/api/logs/user/${data.user._id}`);
          const filtered = res.data.filter((r) => r._id !== id);
          setMoreReviews(filtered.slice(0, 3));
        } catch (err) {
          console.warn("Failed to load more reviews.");
        }
      }
    } catch (err) {
      console.error(err);
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to like reply.");
    }
  };

  const handleReply = () => navigate(`/reply/${id}`);
  const handleProfile = (profileId) => navigate(`/profile/${profileId}`);
  const handleMoreReviewsClick = (reviewId) => navigate(`/review/${reviewId}`);
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/review/${review._id}`);
    toast.success("🔗 Link copied!");
    setShowOptions(false);
  };

  const handleChangeBackdrop = () => toast("Change backdrop clicked!");
  const handleEdit = () => toast("Edit review clicked!");
  const handleDelete = () => toast("Delete review clicked!");

  const isOwner = review?.user?._id === userId;

  if (!review) return null;

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "#fff", minHeight: "100vh" }}>
      {/* Sticky Top Bar */}
      <div style={{
        position: "sticky",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        padding: "0 16px",
        background: "transparent"
      }}>
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
            justifyContent: "center"
          }}
        >
          ←
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#fff",
              fontSize: "22px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ⋯
          </button>

          {showOptions && (
            <div style={{
              position: "absolute",
              top: "38px",
              right: "0",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              padding: "12px 0",
              width: "200px",
              zIndex: 20
            }}>
              {(isOwner
                ? [
                    { label: "🎨 Change Backdrop", onClick: handleChangeBackdrop },
                    { label: "✏️ Edit Review/Log", onClick: handleEdit },
                    { label: "🗑️ Delete Review/Log", onClick: handleDelete },
                    { label: "🔗 Copy Link", onClick: handleShare }
                  ]
                : [
                    { label: "🔗 Copy Link", onClick: handleShare }
                  ]
              ).map((item, index) => (
                <div
                  key={index}
                  onClick={item.onClick}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14.5px",
                    fontWeight: "500",
                    color: "#fff",
                    fontFamily: "Inter",
                    transition: "0.2s",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewHeader
        review={review}
        userId={userId}
        onLike={handleLike}
        onReply={handleReply}
        onProfile={handleProfile}
      />

      <ReplyList
        replies={replies}
        userId={userId}
        reviewId={id}
        onReplyLike={handleReplyLike}
        onProfile={handleProfile}
      />

      <MoreReviewsList
        reviews={moreReviews}
        onClick={handleMoreReviewsClick}
      />
    </div>
  );
}
