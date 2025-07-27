import React from "react";
import { useNavigate } from "react-router-dom";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export default function SearchTabActors({ results = [] }) {
  const navigate = useNavigate();
  const filteredActors = results.filter((actor) => actor.profile_path);

  if (filteredActors.length === 0) {
    return <p style={{ color: "#888", textAlign: "center" }}>No actors found.</p>;
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {filteredActors.map((actor) => (
        <div
          key={actor.id}
          onClick={() => navigate(`/actor/${actor.id}`)}
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
            src={`${TMDB_IMG}${actor.profile_path}`}
            alt={actor.name}
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
              {actor.name}
            </div>
            <div style={{ fontSize: "13px", color: "#bbb" }}>Actor</div>
          </div>
        </div>
      ))}
    </div>
  );
}
