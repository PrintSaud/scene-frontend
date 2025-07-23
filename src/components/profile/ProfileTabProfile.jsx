import React from "react";
import { backend } from "../../config";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { getPlatformIcon } from "../../utils/getPlatformIcon.jsx";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

export default function ProfileTabProfile({
  user,
  favoriteMovies = [],
  logs = [],
  navigate,
  customPosters = {},
}) {
  console.log("🧪 [ProfileTabProfile] favoriteMovies prop:", favoriteMovies);

  const recentlyWatched = Array.isArray(logs)
    ? logs
        .filter((log) => log.movie?.poster || log.poster)
        .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
        .slice(0, 6)
    : [];

  const handleLogClick = (log) => {
    if (!navigate) return;
    if (log.review) {
      navigate(`/review/${log._id}`);
    } else {
      navigate(`/movie/${log.movie?._id || log.movieId}`);
    }
  };

  const hasFavorites = favoriteMovies && favoriteMovies.length > 0;

  return (
    <>
      {/* 🎬 Favorite Movies */}
      {hasFavorites ? (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
            Favorite Movies
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "10px",
              justifyContent: "space-between",
            }}
          >
            {favoriteMovies.map((movie) => {
              const id = movie.id || movie._id;
              const poster =
                customPosters[id] ||
                (movie.poster?.startsWith("http")
                  ? movie.poster
                  : movie.poster
                  ? `${TMDB_IMG}${movie.poster}`
                  : FALLBACK_POSTER);

              return (
                <img
                  key={id}
                  src={poster}
                  alt={movie.title}
                  style={{
                    width: "23vw",
                    maxWidth: "90px",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                  onClick={() => navigate(`/movie/${id}`)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No favorite movies yet.</p>
      )}

      {/* 🕒 Recent Activity */}
      {recentlyWatched.length > 0 ? (
        <div style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
              Recent Activity
            </h3>
            <button
              onClick={() => {
                const event = new CustomEvent("navigateToFilms");
                window.dispatchEvent(event);
              }}
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
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {recentlyWatched.map((log) => {
              const poster =
                log.posterOverride ||
                (log.poster?.startsWith("http")
                  ? log.poster
                  : log.poster
                  ? `${TMDB_IMG}${log.poster}`
                  : log.movie?.poster_path
                  ? `${TMDB_IMG}${log.movie.poster_path}`
                  : FALLBACK_POSTER);

              const timestamp = new Date(log.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={log._id}
                  onClick={() => handleLogClick(log)}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={poster}
                    alt={log.movie?.title}
                    style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover" }}
                  />

                  {/* 🕒 Timestamp top-right */}
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

                  {/* 🔁 Rewatch icon */}
                  {log.rewatch && (
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        background: "rgba(0,0,0,0.6)",
                        padding: "4px",
                        borderRadius: "6px",
                        color: "#fff",
                      }}
                    >
                      <HiOutlineRefresh size={14} />
                    </div>
                  )}

                  {/* ⭐ Star Rating */}
                  {log.rating > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "6px",
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: "6px",
                        padding: "2px 5px",
                      }}
                    >
                      <StarRating rating={log.rating} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", marginTop: "20px" }}>No recent logs yet.</p>
      )}

      {/* 🔗 Connections */}
      {Object.values(user.socials || {}).some((val) => val) && (
        <div style={{ marginTop: "36px" }}>
          <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "600" }}>
            Connections
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {Object.entries(user.socials || {})
              .filter(([_, value]) => value)
              .map(([platform, value]) => {
                const icon = getPlatformIcon(platform);
                const link =
                  platform === "website"
                    ? value
                    : `https://${platform}.com/${value.replace(/^@/, "")}`;

                return (
                  <a
                    key={platform}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      padding: "10px",
                      color: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "18px", marginRight: "8px" }}>{icon}</span>
                    <span
                      style={{
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {value}
                    </span>
                  </a>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
