import React from "react";
import { backend } from "../../config";


export default function ProfileTabReviews({ logs, filter, setFilter, navigate }) {
  const filtered = logs
    .filter((log) => log.review)
    .sort((a, b) => {
      if (filter === "likes") return b.likes - a.likes;
      return new Date(b.watchedAt) - new Date(a.watchedAt);
    });

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: "#f3b13a", fontSize: "15px" }}>
          {i <= fullStars ? "★" : "☆"}
        </span>
      );
    }
    return stars;
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
      {filtered.map((log) => (
        <div
          key={log._id}
          onClick={() => navigate(`/review/${log._id}`)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#181818",
            padding: "12px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {/* 🎬 Movie + Rating */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <img
              src={log.movie?.poster}
              alt={log.movie?.title}
              style={{
                width: "80px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
            <div>
              <h4 style={{ margin: 0, color: "#fff", fontSize: "15px" }}>{log.movie?.title}</h4>
              <div style={{ margin: "4px 0", display: "flex", gap: "2px" }}>{renderStars(log.rating)}</div>
              <p
                style={{
                  color: "#ccc",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  margin: 0,
                }}
              >
                {new Date(log.watchedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* 📝 Review Snippet */}
          <p
            style={{
              color: "#ccc",
              fontSize: "13px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              marginTop: "-6px",
            }}
          >
            {log.review}
          </p>

          {/* 🎁 GIF or Image */}
          {log.image && (
            <img
              src={log.image}
              alt="uploaded"
              style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover" }}
            />
          )}
          {log.gif && (
            <img
              src={log.gif}
              alt="gif"
              style={{ width: "100%", borderRadius: "10px", maxHeight: "220px", objectFit: "cover" }}
            />
          )}

          {/* 🔥 Likes + 💬 Replies */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#999",
              fontSize: "12px",
            }}
          >
            <span>❤️ {log.likes || 0} likes</span>
            {log.replies?.length > 0 && (
              <span>💬 {log.replies.length} {log.replies.length === 1 ? "reply" : "replies"}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
