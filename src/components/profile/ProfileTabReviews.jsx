import React from "react";

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
        if (log.posterOverride) {
          poster = log.posterOverride;
        } else if (log.movie?.poster_path) {
          poster = `${TMDB_IMG}${log.movie.poster_path}`;
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
            {/* 🕑 Timestamp */}
            <div style={{
              position: "absolute",
              top: "8px",
              right: "12px",
              fontSize: "11px",
              color: "#888",
              fontFamily: "Inter, sans-serif",
            }}>
              {new Date(log.watchedAt).toLocaleDateString()}
            </div>

            {/* 🎬 Poster + Details side by side */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <img
                src={poster}
                alt={log.movie?.title}
                style={{
                  width: "90px",
                  height: "135px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: "#fff", fontSize: "15px" }}>{log.movie?.title}</h4>

                {/* ⭐ Rating as stars */}
                <div style={{ margin: "6px 0" }}>
                  {[1,2,3,4,5].map((i) => (
                    <span key={i} style={{ color: i <= Math.round(log.rating) ? '#FFD700' : '#444', fontSize: "14px" }}>
                      ★
                    </span>
                  ))}
                </div>

                {/* Review text */}
                <p style={{
                  color: "#ccc",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  marginTop: "6px",
                  marginBottom: 0,
                  whiteSpace: "pre-wrap",
                }}>
                  {log.review}
                </p>
              </div>
            </div>

            {/* 🎁 GIF or Image */}
            {log.image && (
              <img
                src={log.image}
                alt="uploaded"
                style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover", marginTop: "12px" }}
              />
            )}
            {log.gif && (
              <img
                src={log.gif}
                alt="gif"
                style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover", marginTop: "12px" }}
              />
            )}

            {/* 🔥 Likes + Replies */}
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
