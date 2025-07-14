import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { HiDotsVertical } from "react-icons/hi";
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
  const handleMenu = () => {};

  if (!review) return null;

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      color: "#fff",
      minHeight: "100vh"  // ensure it fills screen but allows natural flow
    }}>
  
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
