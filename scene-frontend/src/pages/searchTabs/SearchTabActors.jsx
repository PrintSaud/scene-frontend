import React from "react";
import { useNavigate } from "react-router-dom";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export default function SearchTabActors({ results, onSearch, saveToRecentSearches }) {

  const navigate = useNavigate();
  const filteredActors = results.filter((actor) => actor.profile_path);

  if (filteredActors.length === 0) {
    return <p style={{ color: "#888", textAlign: "center" }}>No actors found.</p>;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "0 16px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "480px", // slightly larger for extra room
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {filteredActors.map((actor) => (
          <div
            key={actor.id}
            onClick={() => {
                saveToRecentSearches(actor.name, "actors");
                navigate(`/actor/${actor.id}`);
              }}              
            style={{
              background: "#1a1a1a",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              transition: "transform 0.2s ease",
            }}
          >
            <img
              src={`${TMDB_IMG}${actor.profile_path}`}
              alt={actor.name}
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "14px",
                objectFit: "cover",
                background: "#333",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#fff" }}>
                {actor.name}
              </div>
              <div style={{ fontSize: "14px", color: "#bbb" }}>Actor</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
