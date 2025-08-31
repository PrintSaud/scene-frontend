import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { likeLog, likeReply } from "../../api/api";
import ReviewHeader from "./ReviewHeader";
import MoreReviewsList from "./MoreReviewsList";
import StarRating from "../StarRating";
import api from "../../api/api";
import { HiOutlineRefresh } from "react-icons/hi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import useTranslate from "../../utils/useTranslate";

export default function ReviewPage() {
  const t = useTranslate();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [animatingLikeId, setAnimatingLikeId] = useState(null);


  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState([]);
  const [moreReviews, setMoreReviews] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id;

  // ---------- English fallback date helpers (same idea as ReviewHeader) ----------
  const MONTHS_EN = useMemo(
    () => [
          "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
    ],
    []
  );
  const englishOrdinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}`;
    switch (n % 10) {
      case 1: return `${n}`;
      case 2: return `${n}`;
      case 3: return `${n}`;
      default: return `${n}`;
    }
  };

  // localized relative time (short), with EN fallback date (e.g., "31st December")
  function formatRelative(iso) {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;

    const minute = 60 * 1000;
    const hour   = 60 * minute;
    const day    = 24 * hour;

    if (diffMs < minute) return t("Just now");
    if (diffMs < hour)   return t("{{n}}m ago", { n: Math.floor(diffMs / minute) });
    if (diffMs < day)    return t("{{n}}h ago", { n: Math.floor(diffMs / hour) });
    if (diffMs <= 7 * day) return t("{{n}}d ago", { n: Math.floor(diffMs / day) });

    const d = new Date(iso);
    const dayNum = d.getDate();
    const monthName = MONTHS_EN[d.getMonth()];
    return `${englishOrdinal(dayNum)} ${monthName}`;
  }

  const handleReply = () => {
    // no-op here (you navigate to replies below); hook if you add inline composer
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(t("Delete this review?"));
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/logs/${review._id}`);
      toast.success("🗑️ " + t("Review deleted!"));
      navigate("/profile");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error(t("Failed to delete review."));
    }
  };

  const handleEdit = () => {
    navigate(`/movie/${review.movie?.id || review.movie}?edit=1&logId=${review._id}`);
  };

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/api/logs/${id}`);
      setReview(data);
      setReplies(data.replies || []);

      if (data.user?._id) {
        const res = await api.get(`/api/logs/user/${data.user._id}`);
        const filtered = res.data.filter((r) => r._id !== id);
        setMoreReviews(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error("❌ Failed to fetch review:", err);
      toast.error(t("Failed to load review."));
    }
  };

  useEffect(() => {
    fetchData();
    if (location.state?.refreshAfterReply) {
      navigate(location.pathname, { replace: true });
    }
  }, [id, location.state?.refreshAfterReply]);

  const handleLike = async () => {
    if (!userId) return toast.error(t("You must be logged in to like."));
    try {
      await likeLog(id);
      setReview((prev) => ({
        ...prev,
        likes: (prev.likes || []).includes(userId)
          ? prev.likes.filter((uid) => uid !== userId)
          : [...(prev.likes || []), userId],
      }));
  
      // 🔥 trigger animation
      setAnimatingLikeId(review._id);
      setTimeout(() => setAnimatingLikeId(null), 300);
    } catch {
      toast.error(t("Failed to like."));
    }
  };
  

  const handleReplyLike = async (replyId) => {
    if (!userId) return toast.error(t("You must be logged in to like."));
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
  
      // 🔥 trigger animation
      setAnimatingLikeId(replyId);
      setTimeout(() => setAnimatingLikeId(null), 300);
    } catch {
      toast.error(t("Failed to like reply."));
    }
  };
  

  const handleProfile = (profileId) => navigate(`/profile/${profileId}`);
  const handleMoreReviewsClick = (reviewId) => navigate(`/review/${reviewId}`);

  if (!review) return null;

  return (
    <div
      style={{
        backgroundColor: "#0e0e0e",
        color: "#fff",
        minHeight: "100vh",
        overflowY: "auto",
        paddingBottom: "80px",
      }}
    >
      <ReviewHeader
        review={review}
        userId={userId}
        rewatchCount={review.rewatchCount}
        onLike={handleLike}
        onReply={handleReply}
        onProfile={handleProfile}
        onChangeBackdrop={() => navigate(`/review/${review._id}/change-backdrop`)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 💬 Comments section */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            marginBottom: replies.length === 0 ? 4 : 12,
          }}
        >
          <h3 style={{ fontSize: 18, margin: 0, marginLeft: -6 }}>{t("Comments")}</h3>
          <button
            onClick={() => navigate(`/review/${id}/replies`)}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 13,
              cursor: "pointer",
              marginRight: -12,
            }}
          >
            {t("More →")}
          </button>
        </div>

        {replies.length === 0 ? (
          <div style={{ paddingLeft: 24 }}>
            <p style={{ color: "#888", fontSize: 14, marginLeft: -6 }}>{t("No comments yet.")}</p>
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
                      alt={t("Avatar")}
                      style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}
                      onClick={() => handleProfile(r.userId)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.jpg";
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      {/* Username, stars, time */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong
                          style={{
                            fontSize: 14,
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 400,
                            color: "#ddd",
                            cursor: "pointer",
                          }}
                          onClick={() => handleProfile(r.userId)}
                        >
                          @{r.username}
                        </strong>

                        {r.ratingForThisMovie && (
                          <StarRating rating={r.ratingForThisMovie} size={12} />
                        )}

                        {/* Rewatch icon for the review (kept as in original) */}
                        {review.rewatchCount > 1 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <HiOutlineRefresh size={12} color="#aaa" />
                            <span style={{ fontSize: 10, color: "#aaa" }}>
                              {review.rewatchCount}x
                            </span>
                          </div>
                        )}

                        <span style={{ fontSize: 10, color: "#888" }}>
                          {formatRelative(r.createdAt)}
                        </span>
                      </div>

                      {/* Text comment */}
                      {r.text && (
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
                      )}

                      {/* Optional gif/image */}
                      {r.gif && (
                        <img
                          src={r.gif}
                          alt={t("GIF")}
                          style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                        />
                      )}
                      {r.image && (
                        <img
                          src={r.image}
                          alt={t("Image")}
                          style={{ marginTop: 4, maxWidth: "100%", borderRadius: 8 }}
                        />
                      )}

                      {/* Reply button */}
                      <button
                        onClick={() =>
                          navigate(`/replies/${id}`, {
                            state: { parentCommentId: r._id, parentUsername: r.username },
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

                    {/* Like button */}
                    <div
  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
  onClick={() => handleReplyLike(r._id)}
>
  <span
    style={{
      display: "flex",
      alignItems: "center",
      fontSize: 16,
      transform: animatingLikeId === r._id ? "scale(1.4)" : "scale(1)",
      transition: "transform 0.3s ease",
    }}
  >
    {isLikedByMe ? (
      <AiFillHeart color="#B327F6" />
    ) : (
      <AiOutlineHeart color="#888" />
    )}
  </span>
  <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
    {r.likes?.length || 0}
  </span>
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
