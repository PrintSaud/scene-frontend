import React, { useEffect, useState } from "react";
import { backend } from "../../config";
import StarRating from "../StarRating";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { getPlatformIcon } from "../../utils/getPlatformIcon.jsx";
import { FaRegComment } from "react-icons/fa";
import { subDays, isBefore, formatDistanceToNowStrict } from "date-fns";
import { FiExternalLink } from "react-icons/fi";
import { AiOutlineCheck } from "react-icons/ai";


const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";


export default function ProfileTabProfile({
  user,
  favoriteMovies = [],
  logs = [],
  navigate,
  customPosters = {},
}) {
  const [showConnections, setShowConnections] = useState(true);
  const [tmdbPosters, setTmdbPosters] = useState({});
  const recentlyWatched = Array.isArray(logs)
    ? logs
        .filter((log) => log.movie?.poster || log.poster)
        .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
        .slice(0, 6)
    : [];

  useEffect(() => {
    const fetchPosters = async () => {
      const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const updated = {};
      for (const movie of favoriteMovies) {
        const id = movie.id || movie._id;
        if (!customPosters[id]) {
          try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`);
            const data = await res.json();
            updated[id] = data.poster_path ? `${TMDB_IMG}${data.poster_path}` : FALLBACK_POSTER;
          } catch {
            updated[id] = FALLBACK_POSTER;
          }
        }
      }
      setTmdbPosters(updated);
    };
    fetchPosters();
  }, [favoriteMovies]);

  const handleLogClick = (log) => {
    if (!navigate) return;
  
    if (log.review?.trim()) {
      navigate(`/review/${log._id}`);
    } else {
      const tmdbId = log.tmdbId || log.movie?._id || log.movieId || log.movie;
      if (tmdbId) {
        navigate(`/movie/${tmdbId}`);
      } else {
        console.warn("❌ No valid movie ID found in log:", log);
      }
    }
  };
  

  const hasFavorites = favoriteMovies && favoriteMovies.length > 0;

  return (
    <>
      {/* 🎬 Favorite Movies */}
      {hasFavorites ? (
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
            {favoriteMovies.map((movie) => {
              const id = movie.id || movie._id || movie.tmdbId;
              const customPoster = customPosters?.[id];
              const fallbackPoster =
                movie.poster?.startsWith("http")
                  ? movie.poster
                  : movie.poster
                  ? `${TMDB_IMG}${movie.poster}`
                  : FALLBACK_POSTER;

              const posterToShow = customPoster || tmdbPosters[id] || fallbackPoster;

              return (
                <img
                  key={id}
                  src={posterToShow}
                  alt={movie.title}
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
  <div style={{ marginTop: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ fontSize: "12px", fontWeight: "600" }}>Recent Activity</h3>
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
        const movieId =
          typeof log.movie === "string"
            ? log.movie
            : log.movie?._id || log.movie?.id || log.movieId;

        const posterUrl =
          log.posterOverride ||
          (log.poster?.startsWith("http")
            ? log.poster
            : log.poster
            ? `${TMDB_IMG}${log.poster}`
            : log.movie?.poster_path
            ? `${TMDB_IMG}${log.movie.poster_path}`
            : FALLBACK_POSTER);

        const hasReview = log.review && log.review.length > 0;

        // 🧠 Smart timestamp
        const logDate = new Date(log.createdAt);
        const sevenDaysAgo = subDays(new Date(), 7);
        const timestamp = isBefore(logDate, sevenDaysAgo)
          ? logDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : formatDistanceToNowStrict(logDate, { addSuffix: true });

        return (
          <div key={log._id} onClick={() => handleLogClick(log)} style={{ position: "relative", cursor: "pointer" }}>
            <img
              src={posterUrl}
              alt={log.title}
              style={{
                width: "100%",
                aspectRatio: "2/3",
                objectFit: "cover",
                borderRadius: "6px",
              }}
              onError={(e) => (e.currentTarget.src = FALLBACK_POSTER)}
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

            {/* ⭐ & 💬 below the poster */}
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
              <StarRating rating={log.rating} size={12} />
              {hasReview && <FaRegComment size={9} style={{ position: "relative", top: "-1.5px" }} />}
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
{Object.values(user.socials || {}).some((val) => val) && (
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
                <div style={{ fontSize: "20px", position: "relative", top: "2px" }}>
  {icon}
</div>

                  <div style={{ fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  {value}
    <span style={{
      background: "#444",
      padding: "2px 6px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: "600",
      color: "#fff",
      display: "flex",
      alignItems: "center",
    }}>
      <AiOutlineCheck />
    </span>
  </div>
</div>

{/* External link icon */}
<span style={{ fontSize: "16px", color: "#aaa", display: "flex", alignItems: "center" }}>
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
