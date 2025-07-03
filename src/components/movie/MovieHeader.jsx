// src/components/movie/MovieHeader.jsx
import React from "react";
import { backend } from "../../config";


export default function MovieHeader({
  movie,
  posterOverride,
  handleLogClick,
  handleWatchTrailer,
  handleSceneBotReview,
}) {
  const TMDB_IMG = "https://image.tmdb.org/t/p/original";

  return (
    <div style={{ padding: "24px", marginTop: "-90px", position: "relative", zIndex: 3 }}>
<div
  style={{
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "nowrap", // ✅ still needed to keep poster beside info
    overflowX: "hidden", // ✅ remove scroll
    maxWidth: "100%",    // ✅ don’t go outside screen
  }}
>

        <img
          src={posterOverride || `${TMDB_IMG}${movie.poster_path}`}
          alt="Poster"
          style={{ width: "150px", borderRadius: "8px" }}
        />
<div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
  <div>
    <h1 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "2px" }}>{movie.title}</h1>
    {movie.tagline && (
      <p style={{ fontSize: "13px", fontStyle: "italic", color: "#aaa", marginBottom: "4px" }}>
        {movie.tagline}
      </p>
    )}
    <p style={{ fontSize: "12px", color: "#ccc", marginBottom: "2px" }}>
      {movie.release_date?.slice(0, 4)} • {movie.runtime} min
    </p>
    <p style={{ fontSize: "12px", color: "#ccc", marginBottom: "8px" }}>
      {movie.genres?.map((g) => g.name).join(", ")}
    </p>
  </div>

  {/* 🎬 Buttons Row */}
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
  <button
    onClick={handleLogClick}
    style={{
      width: "80px",
      background: "#111",
      color: "#fff",
      padding: "6px 8px",
      borderRadius: "5px",
      border: "1px solid #444",
      fontWeight: "500",
      fontSize: "11px",
      cursor: "pointer",
    }}
  >
    + Log
  </button>

  <button
    onClick={handleWatchTrailer}
    style={{
      width: "80px",
      background: "#111",
      color: "#fff",
      padding: "6px 8px",
      borderRadius: "5px",
      border: "1px solid #444",
      fontWeight: "500",
      fontSize: "11px",
      cursor: "pointer",
    }}
  >
    🎞️ Trailer
  </button>

  <button
    onClick={handleSceneBotReview}
    style={{
      width: "167px",
      background: "#111",
      color: "#fff",
      padding: "6px 8px",
      borderRadius: "5px",
      border: "1px solid #444",
      fontWeight: "500",
      fontSize: "11px",
      cursor: "pointer",
    }}
  >
    🤖 Ask SceneBot
  </button>
</div>


</div>

      </div>
    </div>
  );
}
