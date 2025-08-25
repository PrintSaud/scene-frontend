// src/components/movieTabs/FullCastTab.jsx
import React from "react";

export default function FullCastTab({ credits, navigate }) {
  return (
    <div
      style={{
        display: "grid",
        // ✅ Forces at least 4 per row on phones, grows naturally on desktops
        gridTemplateColumns: "repeat(auto-fit, minmax(clamp(80px, 20%, 140px), 1fr))",
        gap: "16px",
        padding: "25px 25px 2px",
        margin: "0 auto",
        maxWidth: "100%",
      }}
    >
      {credits.cast.map((actor) => (
        <div
          key={actor.id}
          onClick={() => navigate(`/actor/${actor.id}`)}
          style={{ cursor: "pointer", textAlign: "center" }}
        >
          <img
            src={
              actor.profile_path
                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                : "/default-avatar.png"
            }
            alt={actor.name}
            style={{
              width: "100%",
              aspectRatio: "3 / 5",
              objectFit: "cover",
              borderRadius: "12px",
              maxWidth: "160px",
              margin: "0 auto",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              marginTop: "6px",
              fontFamily: "Inter",
              fontWeight: "500",
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {actor.name}
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "#aaa",
              fontFamily: "Inter",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {actor.character}
          </p>
        </div>
      ))}
    </div>
  );
}
