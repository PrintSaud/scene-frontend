import React from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

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
  

  export default function ProfileTabReviews({
    logs,
    filter,
    setFilter,
    navigate,
    handleLike,
    customPosters = {},
  }) {
  
  const userId = JSON.parse(localStorage.getItem("user"))?._id;

  const filtered = logs
    .filter((log) => log.review)
    .sort((a, b) => {
      if (filter === "likes") return (b.likes?.length || 0) - (a.likes?.length || 0);
      return new Date(b.watchedAt) - new Date(a.watchedAt);
    });

    const handleLike = async (logId) => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        await axios.post(
          `/api/logs/${logId}/like`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
    
        // Optional: trigger a refresh or mutate the state if needed
        console.log("✅ Liked!");
      } catch (err) {
        console.error("❌ Failed to like log", err);
      }
    };
    

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
      {/* ⬇️ Dropdown Filter */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            backgroundColor: "#1c1c1c",
            color: "white",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="likes">Most Likes</option>
        </select>
      </div>

      {/* 📝 Reviews */}
      {filtered.map((log) => {
        let poster = log.posterOverride || "/default-poster.png";
        const movieId =
          typeof log.movie === "string"
            ? log.movie
            : log.movie?.id || log.movie?._id || log.movieId;
        
        if (!poster && movieId && log.poster) {
          poster = log.poster.startsWith("http")
            ? log.poster
            : `${TMDB_IMG}${log.poster}`;
        }
        

        const isLikedByMe = log.likes?.includes(userId);

        

        return (
          <div
            key={log._id}
            onClick={() => {
              const hasReview = log.review?.trim();
              const tmdbId = log.tmdbId || log.movie?.id || log.movie;
            
              const user = JSON.parse(localStorage.getItem("user"));
              const token = user?.token;
            
              // 🚀 Prefer review if exists
              if (hasReview) {
                return navigate(`/review/${log._id}`);
              }
            
              // 🧠 Fallback to movie page if logged in or guest
              if (tmdbId) {
                return navigate(`/movie/${tmdbId}`);
              }
            
              console.warn("⚠️ No TMDB ID or review for log:", log);
            }}
                    
            style={{
              backgroundColor: "#181818",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {/* 📅 Relative timestamp in top right */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "12px",
                fontSize: "11px",
                color: "#888",
              }}
            >
              {getRelativeTime(log.watchedAt)}
            </div>

            {/* 🎬 Movie poster + review */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <img
                src={poster}
                alt={log.title}
                style={{
                  width: "100px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: "#fff", fontSize: "15px" }}>{log.title}</h4>

                {/* ⭐ Rating */}
                <div style={{ display: "flex", gap: "3px", marginTop: "4px", fontSize: "18px" }}>
                  {[...Array(5)].map((_, i) => {
                    const isFull = i + 1 <= log.rating;
                    const isHalf = log.rating >= i + 0.5 && log.rating < i + 1;
                    return (
                      <span key={i}>
                        {isFull ? (
                          <FaStar style={{ color: "#B327F6" }} />
                        ) : isHalf ? (
                          <FaStarHalfAlt style={{ color: "#B327F6" }} />
                        ) : (
                          <FaRegStar style={{ color: "#777" }} />
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* 📝 Review text */}
                <p
                  style={{
                    color: "#ccc",
                    fontSize: "13px",
                    fontFamily: "Inter, sans-serif",
                    marginTop: "8px",
                  }}
                >
                  {log.review}
                </p>
              </div>
            </div>

            {/* 🎁 GIF or Image */}
            {log.image && (
              <img
                src={log.image}
                alt="uploaded"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  maxHeight: "220px",
                  objectFit: "cover",
                  marginTop: "10px",
                }}
              />
            )}
            {log.gif && (
              <img
                src={log.gif}
                alt="gif"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  maxHeight: "220px",
                  objectFit: "cover",
                  marginTop: "10px",
                }}
              />
            )}

            {/* 🔥 Likes + 💬 Replies */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
              }}
            >
              {/* ❤️ Likes */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(log._id);
                }}
              >
                {isLikedByMe ? (
                  <AiFillHeart style={{ fontSize: "14px", color: "#B327F6" }} />
                ) : (
                  <AiOutlineHeart style={{ fontSize: "14px", color: "#999" }} />
                )}
                <span style={{ fontSize: "13px", color: "#999" }}>{log.likes?.length || 0}</span>
              </div>

              {/* 💬 Replies */}
              {log.replies?.length > 0 && (
                <span style={{ fontSize: "12px", color: "#999" }}>
                  💬 {log.replies.length} {log.replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
