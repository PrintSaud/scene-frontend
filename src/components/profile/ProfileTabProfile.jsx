import React, { useEffect, useState, useMemo } from "react";
import StarRating from "../StarRating";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { getPlatformIcon } from "../../utils/getPlatformIcon.jsx";
import { FaRegComment } from "react-icons/fa";
import { subDays, isBefore, formatDistanceToNowStrict } from "date-fns";
import { FiExternalLink } from "react-icons/fi";
import { AiOutlineCheck } from "react-icons/ai";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

// 🔐 Normalize anything → TMDB numeric id or null
// 🔐 Normalize anything → TMDB numeric id or null (no Mongo _id)
const toTmdbId = (x) => {
  if (x == null) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && /^\d+$/.test(x)) return Number(x);
  if (typeof x === "object") {
    const cand =
      x.tmdbId ??
      x.id ??
      x.movieId ??
      x.movie?.tmdbId ??
      x.movie?.id;
    const n = Number(cand);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

// 🖼️ Poster resolver (custom → tmdb → fallback)
const resolvePoster = ({ id, tmdbPosters, customPosters, raw }) => {
  const key = String(id);
  return (
    (id && customPosters?.[key]) ||
    (id && tmdbPosters?.[key]) ||
    (raw?.poster_path
      ? `${TMDB_IMG}${raw.poster_path}`
      : FALLBACK_POSTER)
  );
};

export default function ProfileTabProfile({
  user,
  favoriteMovies = [],
  logs = [],
  profileUserId,
  customPosters = {},
}) {
  const navigate = useNavigate();
  const [showConnections, setShowConnections] = useState(true);
  const [tmdbPosters, setTmdbPosters] = useState({});

  // 🕒 Recent logs — always take latest 6, even if id missing
  const recentlyWatched = useMemo(() => {
    const arr = Array.isArray(logs) ? logs : [];
    return arr
      .slice() // clone
      .sort((a, b) => {
        const ad = new Date(a?.createdAt ?? a?.watchedAt ?? 0).getTime();
        const bd = new Date(b?.createdAt ?? b?.watchedAt ?? 0).getTime();
        return bd - ad;
      })
      .slice(0, 6);
  }, [logs]);

  // 📚 IDs for poster fetching — only include valid ids
  const allTmdbIds = useMemo(() => {
    const favIds = (favoriteMovies || [])
      .map(toTmdbId)
      .filter(Boolean);
    const recentIds = (recentlyWatched || [])
      .map((log) =>
        toTmdbId(log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id)
      )
      .filter(Boolean);

    return [...new Set([...favIds, ...recentIds])];
  }, [favoriteMovies, recentlyWatched]);

  // 🧠 Fetch TMDB posters for any id without a custom override
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
        if (!TMDB_KEY) return;

        const need = allTmdbIds.filter(
          (id) => !customPosters[String(id)] && !tmdbPosters[String(id)]
        );
        if (need.length === 0) return;

        const updates = {};
        for (const id of need) {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`
            );
            const data = await res.json();
            updates[String(id)] = data?.poster_path
              ? `${TMDB_IMG}${data.poster_path}`
              : FALLBACK_POSTER;
          } catch {
            updates[String(id)] = FALLBACK_POSTER;
          }
        }
        if (Object.keys(updates).length) {
          setTmdbPosters((prev) => ({ ...prev, ...updates }));
        }
      } catch {
        // ignore
      }
    };
    fetchPosters();
  }, [allTmdbIds, customPosters, tmdbPosters]);

  const handleLogClick = (log) => {
    if (!navigate) return;
    if (log?.review?.trim()) return navigate(`/review/${log._id}`);
    const id = toTmdbId(
      log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id
    );
    if (id) navigate(`/movie/${id}`);
  };

  // ========================= RENDER =========================
  return (
    <>
      {/* 🎬 Favorite Movies */}
      {(favoriteMovies?.length || 0) > 0 ? (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "12px", fontWeight: "600" }}>Favorite Movies</h3>

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

              const posterUrl = resolvePoster({
                id,
                tmdbPosters,
                customPosters,
                raw: movie && typeof movie === "object" ? movie : null,
              });

              return (
                <img
                  key={`${id}-${idx}`}
                  src={posterUrl}
                  alt={(movie && movie.title) || "Poster"}
                  style={{
                    width: "21vw",
                    maxWidth: "110px",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: "6px",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/movie/${id}`)}
                  onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No favorite movies yet.</p>
      )}

      {/* 🕒 Recent Activity */}
      {(recentlyWatched?.length || 0) > 0 ? (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ fontSize: "12px", fontWeight: "600" }}>Recent Activities</h3>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("navigateToFilms"))}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              More →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {recentlyWatched.map((log) => {
              const id = toTmdbId(log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id);
              if (!id) return null;

              const posterUrl = resolvePoster({
                id,
                tmdbPosters,
                customPosters,
                raw: log?.movie,
              });

              const hasReview = !!(log?.review && log.review.trim().length > 0);

              const logDate = new Date(log?.createdAt || log?.watchedAt || Date.now());
              const sevenDaysAgo = subDays(new Date(), 7);
              const timestamp = isBefore(logDate, sevenDaysAgo)
                ? logDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : formatDistanceToNowStrict(logDate, { addSuffix: true });

              return (
                <div
                  key={log._id}
                  onClick={() => handleLogClick(log)}
                  style={{ position: "relative", cursor: "pointer" }}
                >
                  <img
                    src={posterUrl}
                    alt={log?.title || "Poster"}
                    style={{
                      width: "100%",
                      aspectRatio: "2/3",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                    onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
                  />

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
                      justifyContent: "flex-start",
                      gap: "4px",
                      padding: "2px 4px 0 4px",
                      fontSize: "10px",
                      color: "#aaa",
                      fontFamily: "Inter",
                    }}
                  >
                    <StarRating rating={log?.rating} size={12} />
                    {hasReview && (
                      <FaRegComment size={9} style={{ position: "relative", top: "-1.5px" }} />
                    )}
                    {log?.rewatchCount > 0 && (
                      <HiOutlineRefresh
                        size={11}
                        color="#aaa"
                        style={{ position: "relative", top: "-1.2px" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No recent logs yet.</p>
      )}

      {/* 🔗 Connections */}
      {Object.values(user?.socials || {}).some(Boolean) && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
              Connections
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
              {showConnections ? "Hide" : "Show"}
            </button>
          </div>

          {showConnections && (
            <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(user?.socials || {})
                .filter(([, value]) => value)
                .map(([platform, value]) => {
                  const icon = getPlatformIcon(platform);
                  const link =
                    platform === "website"
                      ? value
                      : `https://${platform}.com/${String(value).replace(/^@/, "")}`;

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
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "20px", position: "relative", top: "2px" }}>{icon}</div>
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
                      <span
                        style={{
                          fontSize: "16px",
                          color: "#aaa",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
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
