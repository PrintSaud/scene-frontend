import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { HiDotsVertical } from "react-icons/hi";
import { FaHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "../api/api";
import { likeLog, likeReply } from "../api/api";
import { backend } from "../config";
import StarRating from "../components/StarRating";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

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
      console.error(err);
      toast.error("Failed to load review.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLike = async () => {
    try {
      await likeLog(id);
      setReview((prev) => ({
        ...prev,
        likes: prev.likes?.includes(user._id)
          ? prev.likes.filter((uid) => uid !== user._id)
          : [...(prev.likes || []), user._id],
      }));
    } catch (err) {
      toast.error("Failed to like.");
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
                likes: r.likes?.includes(user._id)
                  ? r.likes.filter((uid) => uid !== user._id)
                  : [...(r.likes || []), user._id],
              }
            : r
        )
      );
    } catch (err) {
      toast.error("Failed to like reply.");
    }
  };

  const handleReply = () => navigate(`/reply/${id}`);
  const handleProfile = (userId) => navigate(`/profile/${userId}`);
  const handleMoreReviewsClick = (reviewId) => navigate(`/review/${reviewId}`);
  const handleMenu = () => {}; // TODO

  if (!review) return null;

  const posterUrl = review.poster || "/default-poster.jpg";
  const backdropUrl = review.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
    : "/default-backdrop.jpg";

  return (
    <div style={{ backgroundColor: "#0e0e0e", color: "#fff", minHeight: "100vh" }}>
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <IoArrowBack size={24} onClick={() => navigate(-1)} />
      </div>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <HiDotsVertical size={24} onClick={handleMenu} />
      </div>

      <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />

      <div style={{ display: "flex", padding: "16px", gap: "12px" }}>
        <img src={posterUrl} alt="Poster" style={{ width: 80, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {review.user ? (
                <>
                  <img
                    src={review.user.avatar}
                    alt="Avatar"
                    style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                    onClick={() => handleProfile(review.user._id)}
                  />
                  <span
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => handleProfile(review.user._id)}
                  >
                    @{review.user.username}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "13px", color: "#888" }}>Unknown user</span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StarRating rating={review.rating} />
              <FaHeart
                onClick={handleLike}
                style={{
                  cursor: "pointer",
                  color: review.likes?.includes(user._id) ? "red" : "white",
                }}
              />
              <button onClick={handleReply}>Reply</button>
            </div>
          </div>
          <p style={{ marginTop: 8 }}>{review.review}</p>
          {review.image && <img src={review.image} alt="Attached" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />}
          {review.gif && <img src={review.gif} alt="GIF" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {replies.slice(0, 2).map((r) => (
          <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={r.avatar}
                alt="Avatar"
                style={{ width: 24, height: 24, borderRadius: "50%", cursor: "pointer" }}
                onClick={() => handleProfile(r.userId)}
              />
              <span
                style={{ cursor: "pointer", fontWeight: "bold" }}
                onClick={() => handleProfile(r.userId)}
              >
                @{r.username}
              </span>
              <span>{r.text}</span>
            </div>
            <FaHeart
              onClick={() => handleReplyLike(r._id)}
              style={{
                cursor: "pointer",
                color: r.likes?.includes(user._id) ? "red" : "white",
              }}
            />
          </div>
        ))}
        {replies.length > 2 && <button onClick={() => navigate(`/reply/${id}`)}>Show more replies →</button>}
      </div>

      <div style={{ padding: "16px" }}>
        <h4>
          More reviews by @{review.user ? review.user.username : "unknown"}
        </h4>
        {moreReviews.map((r) => (
          <div
            key={r._id}
            style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: 12, cursor: "pointer" }}
            onClick={() => handleMoreReviewsClick(r._id)}
          >
            <img src={r.posterOverride || "/default-poster.jpg"} alt="Poster" style={{ width: 60, borderRadius: 6 }} />
            <div>
              <StarRating rating={r.rating} />
              {r.review && (
                <p>{r.review.split(" ").slice(0, 15).join(" ")} {r.review.split(" ").length > 15 && "…read more"}</p>
              )}
              {r.gif && <p>GIF 🎬</p>}
              {r.image && <p>📷 Image</p>}
            </div>
          </div>
        ))}
        {moreReviews.length > 3 && <button>show more…</button>}
      </div>
    </div>
  );
}
