import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import useTranslate from "../../utils/useTranslate";
import { useLanguage } from "../../context/LanguageContext";
import { useParams,useLocation } from "react-router-dom";

export default function ReviewHeader({
  review,
  userId,
  onLike,
  onReply,
  onProfile,
  onChangeBackdrop,
  rewatchCount,
  onEdit,
  onDelete,
}) {
  const t = useTranslate();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const { id } = useParams();
  const TMDB_IMG = "https://image.tmdb.org/t/p/original";
  const fallbackImage = "https://scenesa.com/scene-og-review-fallback.png";
  const [animating, setAnimating] = useState(false);


  const backdropUrl =
    review.customBackdrop ||
    (review.reviewBackdrop ? `${TMDB_IMG}${review.reviewBackdrop}` : "") ||
    (review.movie?.backdrop_path ? `${TMDB_IMG}${review.movie.backdrop_path}` : "") ||
    fallbackImage;

  const posterUrl =
    review.posterOverride || review.poster || review.movie?.poster || "/default-poster.jpg";

  // --- Fixed English fallback date helpers ---
  const MONTHS_EN = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  function englishOrdinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}`;
    switch (n % 10) {
      case 1: return `${n}`;
      case 2: return `${n}`;
      case 3: return `${n}`;
      default: return `${n}`;
    }
  }

  // localized relative time (short), with EN fallback date (e.g., "31st December")
  const formatRelative = (iso) => {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return t("Just now");
    if (diffMs < hour) {
      const n = Math.floor(diffMs / minute);
      return t("{{n}}m ago", { n });
    }
    if (diffMs < day) {
      const n = Math.floor(diffMs / hour);
      return t("{{n}}h ago", { n });
    }
    if (diffMs <= 7 * day) {
      const n = Math.floor(diffMs / day);
      return t("{{n}}d ago", { n });
    }
    // 🔒 Always English month + proper ordinal
    const d = new Date(iso);
    const dayNum = d.getDate();
    const monthName = MONTHS_EN[d.getMonth()];
    return `${englishOrdinal(dayNum)} ${monthName}`;
  };

  const timestamp = review.createdAt ? formatRelative(review.createdAt) : "";
  const isOwner = review.user?._id === userId;

  const handleCopyLink = () => {
    const ogLink = `${window.location.origin}/review/${review._id}`;
    navigator.clipboard.writeText(ogLink);
    toast.success("🔗 " + t("Link copied with preview!"));
    setShowOptions(false);
  };

  const menuItems = isOwner
    ? [
        { label: t("🎨 Change Backdrop"), onClick: onChangeBackdrop },
        { label: t("✏️ Edit Review/Log"), onClick: onEdit },
        { label: t("🗑️ Delete Review/Log"), onClick: onDelete },
        { label: t("📤 Share to Friends"), onClick: () => navigate(`/share/log/${review._id}`) },
        { label: t("💾 Save Photo"), onClick: () => navigate(`/share-review/${review._id}`) },
        { label: t("🔗 Copy Link"), onClick: handleCopyLink },
      ]
    : [
        { label: t("📤 Share to Friends"), onClick: () => navigate(`/share/log/${review._id}`) },
        { label: t("🔗 Copy Link"), onClick: handleCopyLink },
      ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          overflow: "hidden",
          marginBottom: -30,
        }}
      >
        <img
          src={backdropUrl}
          alt={t("Backdrop")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage;
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "70%",
            background: "linear-gradient(to top, #0e0e0e, transparent)",
          }}
        />

        {/* Top buttons */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 5,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label={t("Back")}
            title={t("Back")}
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
              justifyContent: "center",
            }}
          >
            ←
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowOptions((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={showOptions}
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
                justifyContent: "center",
              }}
            >
              ⋯
            </button>

            {showOptions && (
              <div
                role="menu"
                style={{
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
                  overflowY: "auto",
                }}
              >
                {menuItems.map((item, i) => (
                  <div
                    key={i}
                    role="menuitem"
                    onClick={() => {
                      item.onClick?.();
                      setShowOptions(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14.5px",
                      fontWeight: "500",
                      color: "#fff",
                      fontFamily: "Inter",
                      transition: "0.2s",
                      whiteSpace: "nowrap",
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

        {/* Go to Movie */}
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
              fontFamily: "Inter, sans-serif",
            }}
            onClick={() => {
              const movieId = review?.movie?.id || review?.movie;
              if (movieId) navigate(`/movie/${movieId}`);
            }}
          >
            {t("Go to Movie")}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px", position: "relative", zIndex: 2 }}>
        {review.user && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={review.user?.avatar || "/default-avatar.jpg"}
                alt={t("Avatar")}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
                onClick={() => onProfile?.(review.user._id)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-avatar.jpg";
                }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  opacity: 0.9,
                  cursor: "pointer",
                }}
                onClick={() => onProfile?.(review.user._id)}
              >
                @{review.user.username}
              </span>
            </div>

            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating rating={review.rating} />

                {/* Rewatch */}
                {rewatchCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      paddingLeft: 4,
                      marginTop: 1,
                      position: "relative",
                      top: "-1.5px",
                    }}
                    title={t("Rewatch count")}
                  >
                    <HiOutlineRefresh size={14} color="#aaa" />
                    <span style={{ fontSize: 10, color: "#aaa", top: "-1px" }}>
                      {rewatchCount}x
                    </span>
                  </div>
                )}
              </div>

              {timestamp && <div style={{ fontSize: 11, color: "#aaa" }}>{timestamp}</div>}
            </div>
          </>
        )}

        {review.review && review.review !== "__media__" && (
          <p
            style={{
              marginTop: 8,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            {review.review}
          </p>
        )}

        {review.image && (
          <img
            src={review.image}
            alt={t("Attached image")}
            style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
          />
        )}
        {review.gif && (
          <img src={review.gif} alt={t("GIF")} style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 8,
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
  <span
    onClick={() => {
      onLike?.();
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    }}
    style={{
      cursor: "pointer",
      fontSize: "20px",
      position: "relative",
      top: "1px",
      display: "flex",
      alignItems: "center",
      transition: "transform 0.3s ease, color 0.3s ease",
      transform: animating ? "scale(1.4)" : "scale(1)",
    }}
    aria-label={t("Like")}
    title={t("Like")}
  >
    {(review.likes || []).includes(userId) ? (
      <AiFillHeart style={{ color: "#B327F6", transition: "color 0.3s ease" }} />
    ) : (
      <AiOutlineHeart style={{ color: "#888" }} />
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
              cursor: "pointer",
            }}
            onClick={() => navigate(`/review/${id}/replies`)}
          >
            {t("Reply")}
          </button>
        </div>
      </div>
    </>
  );
}
