import React from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export default function ProfileTabReviews({ logs, filter, setFilter, navigate }) {
  const filtered = logs
    .filter((log) => log.review)
    .sort((a, b) => {
      if (filter === "likes") return (b.likes || 0) - (a.likes || 0);
      return new Date(b.watchedAt) - new Date(a.watchedAt);
    });

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
        let poster = "/default-poster.png";
        if (log.movie) {
          if (log.movie.customPoster) {
            poster = log.movie.customPoster;
          } else if (log.movie.poster) {
            poster = log.movie.poster.startsWith("http")
              ? log.movie.poster
              : `${TMDB_IMG}${log.movie.poster}`;
          } else if (log.movie.poster_path) {
            poster = `${TMDB_IMG}${log.movie.poster_path}`;
          }
        }

        return (
          <div
            key={log._id}
            onClick={() => navigate(`/review/${log._id}`)}
            style={{
              backgroundColor: "#181818",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {/* 📅 Timestamp in top right */}
            <div style={{ position: "absolute", top: "10px", right: "12px", fontSize: "11px", color: "#888" }}>
              {new Date(log.watchedAt).toLocaleDateString()}
            </div>

            {/* 🎬 Movie poster + review */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <img
                src={poster}
                alt={log.movie?.title}
                style={{
                  width: "100px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: "#fff", fontSize: "15px" }}>{log.movie?.title}</h4>

                {/* ⭐ Rating (same style as LogModal) */}
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

                {/* 📝 Review next to poster */}
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
                style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover", marginTop: "10px" }}
              />
            )}
            {log.gif && (
              <img
                src={log.gif}
                alt="gif"
                style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover", marginTop: "10px" }}
              />
            )}

            {/* 🔥 Likes + 💬 Replies */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#999",
                fontSize: "12px",
                marginTop: "10px",
              }}
            >
              <span>❤️ {log.likes || 0} likes</span>
              {log.replies?.length > 0 && (
                <span>💬 {log.replies.length} {log.replies.length === 1 ? "reply" : "replies"}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
