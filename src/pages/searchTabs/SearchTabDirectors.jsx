import React from "react";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMG = "/default-profile.png";

export default function SearchTabDirectors({ results = [] }) {
  const navigate = useNavigate();

  // ✅ Filter out directors with no profile picture
  const filteredDirectors = results.filter((d) => d.profile_path);

  if (filteredDirectors.length === 0) {
    return <p style={{ color: "#888", textAlign: "center" }}>No directors found.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        padding: "0 16px 80px",
      }}
    >
      {filteredDirectors.map((director) => (
        <div
          key={director.id}
          onClick={() => navigate(`/director/${director.id}`)}
          style={{
            background: "#1a1a1a",
            borderRadius: "14px",
            overflow: "hidden",
            cursor: "pointer",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src={`https://image.tmdb.org/t/p/w185${director.profile_path}`}
            alt={director.name}
            style={{
              width: "70px",
              height: "70px",
              objectFit: "cover",
              borderRadius: "12px",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>
              {director.name}
            </div>
            <div style={{ fontSize: "13px", color: "#bbb" }}>Director</div>
          </div>
        </div>
      ))}
    </div>
  );
}
