// src/components/movieTabs/FullCastTab.jsx
import React from "react";

export default function FullCastTab({ credits, navigate }) {
  if (!credits?.local || !credits?.en) {
    return (
      <p style={{ color: "#888", padding: "20px", textAlign: "center" }}>
        No cast data available
      </p>
    );
  }

  const castLocal = credits.local.cast || [];
  const castEn = credits.en.cast || [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(clamp(80px, 20%, 140px), 1fr))",
        gap: "16px",
        padding: "25px 25px 2px",
        margin: "0 auto",
        maxWidth: "100%",
      }}
    >
      {castLocal.map((actor) => {
        const englishActor = castEn.find((a) => a.id === actor.id);

        return (
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
                fontWeight: "300",
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {actor.name}
              {englishActor?.name && englishActor.name !== actor.name && (
                <> / {englishActor.name}</>
              )}
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
              {englishActor?.character &&
                englishActor.character !== actor.character && (
                  <> / {englishActor.character}</>
                )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
