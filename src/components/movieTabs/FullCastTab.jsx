// src/components/movieTabs/FullCastTab.jsx
import React from "react";

export default function FullCastTab({ credits, navigate }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        padding: "25px 30px 2px",
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
                width: "80px",
                height: "135px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
          />
          <p style={{ fontSize: "12px", marginTop: "6px", fontFamily: "Inter", fontWeight: "500", color: "#fff" }}>
            {actor.name}
          </p>
          <p style={{ fontSize: "11px", color: "#aaa", fontFamily: "Inter" }}>
            {actor.character}
          </p>
        </div>
      ))}
    </div>
  );
}
