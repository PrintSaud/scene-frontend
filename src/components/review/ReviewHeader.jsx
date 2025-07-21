import React, { useState } from "react";
import toast from "react-hot-toast";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi"

export default function ReviewHeader({
    review,
    userId,
    onLike,
    onReply,
    onProfile,
    onChangeBackdrop,
    rewatchCount,
    onEdit,
    onDelete
  }) {
    const navigate = useNavigate();
    const [showOptions, setShowOptions] = useState(false);
  
    const handleCopyLink = () => {
      const link = `${window.location.origin}/review/${review._id}`;
      navigator.clipboard.writeText(link);
      toast.success("🔗 Link copied!");
      setShowOptions(false);
    };
  
    const backdropUrl = review.customBackdrop
      ? review.customBackdrop
      : review.movie?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${review.movie.backdrop_path}`
        : "/default-backdrop.jpg";
  
    const avatarUrl = review.user?.avatar
      ? review.user.avatar
      : "/default-avatar.jpg";
  
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
  
    const timestamp = review.createdAt ? getRelativeTime(review.createdAt) : "";
    const isOwner = review.user?._id === userId;
  
    return (
      <>
        {/* Backdrop section */}
        <div style={{ position: "relative", width: "100%", height: 220, overflow: "hidden", marginBottom: -30 }}>
          <img src={backdropUrl} alt="Backdrop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 0, width: "100%", height: "70%", background: "linear-gradient(to top, #0e0e0e, transparent)" }} />
  
          {/* Top buttons */}
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
            <button onClick={() => navigate(-1)} style={{
              background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#fff", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>←</button>
  
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowOptions((prev) => !prev)} style={{
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#fff", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}>⋯</button>
  
              {showOptions && (
                <div style={{
                  position: "fixed",
                  top: "56px",
                  right: "12px",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  padding: "12px 0",
                  width: "200px",
                  zIndex: 20,
                  maxHeight: "260px",
                  overflowY: "auto"
                }}>
                  {(isOwner
                    ? [
                      { label: "🎨 Change Backdrop", onClick: onChangeBackdrop },
                      { label: "✏️ Edit Review/Log", onClick: onEdit },  // 🟢 FIX: use onEdit not handleEdit
                      { label: "🗑️ Delete Review/Log", onClick: onDelete },
                      { label: "📤 Share to Friends", onClick: () => navigate(`/share/log/${review._id}`) },
                      { label: "💾 Save Photo", onClick: () => navigate(`/share-review/${review._id}`) },
                      { label: "🔗 Copy Link", onClick: handleCopyLink }
                    ]
                    : [
                      { label: "📤 Share to Friends", onClick: () => navigate(`/share/log/${review._id}`) },
                      { label: "🔗 Copy Link", onClick: handleCopyLink }
                    ]
                  ).map((item, index) => (
                    <div key={index} onClick={() => { item.onClick(); setShowOptions(false); }} style={{
                      padding: "10px 16px", cursor: "pointer", fontSize: "14.5px", fontWeight: "500", color: "#fff", fontFamily: "Inter", transition: "0.2s", whiteSpace: "nowrap"
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >{item.label}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Go to Movie button */}
        <div style={{ position: "absolute", bottom: 40, right: 14, textAlign: "right" }}>
          <button
            style={{
              background: "rgba(100, 100, 100, 0.6)",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              fontSize: 12,
              padding: "4px 8px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif"
            }}
            onClick={() => navigate(`/movie/${review.movie?.id || review.movie}`)}
          >
            Go to Movie
          </button>
        </div>
      </div>

      {/* Content section (unchanged) */}
      <div style={{ padding: "0 16px", position: "relative", zIndex: 2 }}>
        {review.user && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover"
                }}
                onClick={() => onProfile(review.user._id)}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  opacity: 0.9,
                  cursor: "pointer"
                }}
                onClick={() => onProfile(review.user._id)}
              >
                @{review.user.username}
              </span>
            </div>

            <div style={{
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <StarRating rating={review.rating} />
    {rewatchCount > 1 && (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <HiOutlineRefresh size={12} color="#aaa" />
        <span style={{ fontSize: 10, color: "#aaa" }}>
          {rewatchCount}x
        </span>
      </div>
    )}
  </div>
  {timestamp && (
    <div style={{ fontSize: 11, color: "#aaa" }}>
      {timestamp}
    </div>
  )}
</div>


          </>
        )}

        {review.review && (
          <p style={{
            marginTop: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: 1.4
          }}>
            {review.review}
          </p>
        )}

        {review.image && (
          <img src={review.image} alt="Attached" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
        )}
        {review.gif && (
          <img src={review.gif} alt="GIF" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 8, gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span onClick={onLike} style={{ cursor: "pointer", fontSize: "20px", position: "relative", top: "1px" }}>
              {(review.likes || []).includes(userId) ? (
                <AiFillHeart style={{ color: "#B327F6" }} />
              ) : (
                <AiOutlineHeart />
              )}
            </span>
            <span style={{ fontSize: "13px" }}>{review.likes?.length || 0}</span>
          </div>
          <button
  style={{
    background: "transparent",
    border: "1px solid #555",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
    color: "#fff",
    cursor: "pointer"
  }}
  onClick={() => navigate(`/review/${review._id}/replies`)}
>
  Reply
</button>

        </div>
      </div>
    </>
  );
}
