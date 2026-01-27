import React, { useMemo } from "react";
import StarRating from "../StarRating";
import useTranslate from "../../utils/useTranslate";

export default function MoreReviewsList({ reviews = [], onClick }) {
  const t = useTranslate();

  const filteredReviews = useMemo(
    () =>
      (reviews || [])
        .filter((r) => r?.review && r.review.trim().length > 0)
        .slice(0, 3),
    [reviews]
  );

  // --- English fallback date helpers (consistent with ReviewHeader/ReviewPage) ---
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

  // localized relative time, with EN fallback like "31st December"
  const formatRelative = (iso) => {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;

    const minute = 60 * 1000;
    const hour   = 60 * minute;
    const day    = 24 * hour;

    if (diff < minute) return t("Just now");
    if (diff < hour)   return t("{{n}}m ago", { n: Math.floor(diff / minute) });
    if (diff < day)    return t("{{n}}h ago", { n: Math.floor(diff / hour) });
    if (diff <= 7 * day) return t("{{n}}d ago", { n: Math.floor(diff / day) });

    const d = new Date(iso);
    const dayNum = d.getDate();
    const monthName = MONTHS_EN[d.getMonth()];
    return `${englishOrdinal(dayNum)} ${monthName}`;
  };

  const previewText = (text, wordLimit = 30) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
  
    return (
      <>
        {words.slice(0, wordLimit).join(" ")}{" "}
        <span style={{ color: "#B327F6" }}>{t("…Read more")}</span>
      </>
    );
  };
  

  return (
    <div style={{ padding: "16px" }}>
      <h4 style={{ fontFamily: "Inter, sans-serif" }}>{t("More reviews")}</h4>

      {filteredReviews.map((r) => {
        const timeIso = r.watchedAt || r.createdAt;
        const posterSrc =
          r.posterOverride && r.posterOverride.startsWith("http")
            ? r.posterOverride
            : "/default-poster.jpg";

        return (
          <div
            key={r._id}
            onClick={() => onClick?.(r._id)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: 12,
              cursor: "pointer",
              background: "#1a1a1a",
              borderRadius: 8,
              padding: 6,
            }}
          >
            {/* ⏰ Timestamp top-right */}
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 8,
                fontSize: 10,
                color: "#888",
              }}
            >
              {formatRelative(timeIso)}
            </span>

            <img
              src={posterSrc}
              alt={t("Poster")}
              loading="lazy"
              style={{ width: 70, borderRadius: 6, flexShrink: 0, objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-poster.jpg";
              }}
            />

            <div>
              <StarRating rating={r.rating} />
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#ccc" }}>
                {previewText(r.review)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
