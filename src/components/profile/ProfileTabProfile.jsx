// src/components/profile/ProfileTabProfile.jsx
import React, { useState, useMemo } from "react";
import StarRating from "../StarRating";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { getPlatformIcon } from "../../utils/getPlatformIcon.jsx";
import { FaRegComment } from "react-icons/fa";
import { subDays, isBefore, formatDistanceToNowStrict } from "date-fns";
import { FiExternalLink } from "react-icons/fi";
import { AiOutlineCheck } from "react-icons/ai";
import useTranslate from "../../utils/useTranslate";
import getPosterUrl from "../../utils/getPosterUrl";

const FALLBACK_POSTER = "/default-poster.jpg";

// ✅ Unified PosterWithLoader with shimmer
function PosterWithLoader({ src, alt, onClick, style }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showSrc = !error && src ? src : FALLBACK_POSTER;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        ...style,
      }}
      onClick={onClick}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "6px",
            background:
              "linear-gradient(90deg, #3a0d60 25%, #B327F6 50%, #3a0d60 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s infinite",
          }}
        />
      )}

      <img
        src={showSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "6px",
          display: "block",
        }}
      />

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}

// 🔹 Normalize to TMDB id
const toTmdbId = (x) => {
  if (x == null) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && /^\d+$/.test(x)) return Number(x);
  if (typeof x === "object") {
    const cand =
      x.tmdbId ?? x.id ?? x.movieId ?? x.movie?.tmdbId ?? x.movie?.id;
    const n = Number(cand);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export default function ProfileTabProfile({
  user,
  favoriteMovies = [],
  logs = [],
  profileUserId,
  customPosters = {},
}) {
  const navigate = useNavigate();
  const t = useTranslate();
  const [showConnections, setShowConnections] = useState(true);

  // ⏱️ Recent logs (latest 6)
  const recentlyWatched = useMemo(() => {
    const arr = Array.isArray(logs) ? logs : [];
    return arr
      .slice()
      .sort((a, b) => {
        const ad = new Date(a?.createdAt ?? a?.watchedAt ?? 0).getTime();
        const bd = new Date(b?.createdAt ?? b?.watchedAt ?? 0).getTime();
        return bd - ad;
      })
      .slice(0, 6);
  }, [logs]);

  const handleLogClick = (log) => {
    if (log?.review?.trim()) return navigate(`/review/${log._id}`);
    const id = toTmdbId(
      log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id
    );
    if (id) navigate(`/movie/${id}`);
  };

  return (
    <>
      {/* 🎬 Favorite Movies */}
      {(favoriteMovies?.length || 0) > 0 ? (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "12px", fontWeight: "600" }}>
            {t("Favorite Movies")}
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "10px",
              justifyContent: "flex-start",
            }}
          >
            {favoriteMovies.map((movie, idx) => {
              const id = toTmdbId(movie);
              if (!id) return null;

              // ✅ Normalize movie object with fallback logic
              const normalized = {
                tmdbId: id,
                // if poster_path missing, still pass null → getPosterUrl will build from id
                posterPath: movie.poster_path || movie.poster || null,
                override: customPosters?.[id],
                size: "w342", // optional, consistent with other places
              };
              

              const posterUrl = getPosterUrl(normalized);

              return (
                <PosterWithLoader
                  key={`${id}-${idx}-${customPosters?.[id] || ""}`} // ✅ re-render when override arrives
                  src={posterUrl}
                  alt={movie?.title || "Poster"}
                  style={{ width: "21vw", maxWidth: "110px" }}
                  onClick={() => navigate(`/movie/${id}`)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>
          {t("No favorite movies yet.")}
        </p>
      )}

      {/* 🕒 Recent Activity */}
      {(recentlyWatched?.length || 0) > 0 ? (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: "12px", fontWeight: "600" }}>
              {t("Recent Activities")}
            </h3>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("navigateToFilms"))
              }
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {t("More →")}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                typeof window !== "undefined" && window.innerWidth <= 600
                  ? "repeat(3, 1fr)"
                  : "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "8px",
              justifyItems: "center",
              marginTop: "12px",
            }}
          >
            {recentlyWatched.map((log) => {
              const id = toTmdbId(
                log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id
              );
              if (!id) return null;

              const posterUrl = getPosterUrl({
                tmdbId: log.tmdbId || log.movie?.id,
                posterPath: log.movie?.poster_path || log.poster,
                override: customPosters[id],
              });

              const hasReview =
                !!(log?.review && log.review.trim().length > 0);

              const logDate = new Date(
                log?.createdAt || log?.watchedAt || Date.now()
              );
              const sevenDaysAgo = subDays(new Date(), 7);
              const timestamp = isBefore(logDate, sevenDaysAgo)
                ? logDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : formatDistanceToNowStrict(logDate, { addSuffix: true });

              return (
                <div
                  key={log._id}
                  style={{ position: "relative", width: "100%" }}
                  onClick={() => handleLogClick(log)}
                >
                  <PosterWithLoader src={posterUrl} alt={log?.title || "Poster"} />

                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      fontSize: "11px",
                      background: "rgba(0,0,0,0.7)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      color: "#fff",
                    }}
                  >
                    {timestamp}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                      fontSize: "10px",
                      color: "#aaa",
                    }}
                  >
                    <StarRating rating={log?.rating} size={12} />
                    {hasReview && <FaRegComment size={9} />}
                    {log?.rewatchCount > 0 && (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <HiOutlineRefresh size={11} color="#aaa" />
                        <span style={{ fontSize: "10px", color: "#aaa" }}>
                          {log.rewatchCount}x
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>
          {t("No recent logs yet.")}
        </p>
      )}

      {/* 🔗 Connections */}
      {Object.values(user?.socials || {}).some(Boolean) && (
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {t("Connections")}
            </h3>
            <button
              onClick={() => setShowConnections((prev) => !prev)}
              style={{
                fontSize: "12px",
                color: "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showConnections ? t("Hide") : t("Show")}
            </button>
          </div>

          {showConnections && (
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {Object.entries(user?.socials || {})
                .filter(([, value]) => value)
                .map(([platform, value]) => {
                  const icon = getPlatformIcon(platform);
                  const link =
                    platform === "website"
                      ? value
                      : `https://${platform}.com/${String(value).replace(
                          /^@/,
                          ""
                        )}`;

                  return (
                    <a
                      key={platform}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        color: "#fff",
                        textDecoration: "none",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div style={{ fontSize: "20px" }}>{icon}</div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {value}
                          <span
                            style={{
                              background: "#444",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <AiOutlineCheck />
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: "16px", color: "#aaa" }}>
                        <FiExternalLink />
                      </span>
                    </a>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
