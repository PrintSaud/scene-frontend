import React from "react";
import { useNavigate } from "react-router-dom";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export default function SearchTabDirectors({ results = [] }) {
  const navigate = useNavigate();
  const filteredDirectors = results.filter((director) => director.profile_path);

  if (filteredDirectors.length === 0) {
    return <p style={{ color: "#888", textAlign: "center" }}>No directors found.</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", // ✅ Center horizontally
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px", // ✅ Lock width to center the card stack
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {filteredDirectors.map((director) => (
          <div
            key={director.id}
            onClick={() => navigate(`/director/${director.id}`)}
            style={{
              width: "95%",
              background: "#1a1a1a",
              borderRadius: "14px",
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px",
              boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src={`${TMDB_IMG}${director.profile_path}`}
              alt={director.name}
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "12px",
                objectFit: "cover",
                background: "#333",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#fff" }}>
                {director.name}
              </div>
              <div style={{ fontSize: "13px", color: "#bbb" }}>Director</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
