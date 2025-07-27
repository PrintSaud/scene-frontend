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
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {filteredDirectors.map((director) => (
        <div
          key={director.id}
          onClick={() => navigate(`/director/${director.id}`)}
          style={{
            width: "100%",
            background: "#1a1a1a",
            borderRadius: "14px",
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "14px 16px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}          
        >
          <img
            src={`${TMDB_IMG}${director.profile_path}`}
            alt={director.name}
            style={{
                width: "70px",
                height: "70px",
                borderRadius: "14px",
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
  );
}
